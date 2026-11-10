import {
  AIR_REFILL_SECONDS,
  AIR_SECONDS,
  DUCK_SPEED,
  DUCK_START,
  GROWTH,
  MAX_MULT,
  MIN_BET,
  MIN_CASHOUT,
  SKY,
  airLine,
  duckPosition,
  multiplierAt,
  SKY_OVER_HUNTER,
  shotGap,
  shotRandom,
  trackRate,
  winTier,
} from './engine';
import type { LiveConfig, LiveCrashClient, LiveRound, LiveSnapshot, MyBet } from '../api/liveCrash';
import { fmt, fmtX, parseAmount, parseNum } from './format';
import type { GameState, RoundsOption, Slot } from './types';

type Work = Pick<
  GameState,
  'slots' | 'balance' | 'rows' | 'rowId' | 'stats' | 'lim' | 'burstAt' | 'celebrate' | 'toast' | 'lastCashAt'
>;

export interface EngineEvents {
  launch?: () => void;
  crash?: (m: number) => void;
  miss?: () => void;
  cashout?: (m: number) => void;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

const MAX_ROWS = 12;
const MAX_HISTORY = 30;

const mkSlot = (amountStr: string, targetStr: string): Slot => ({
  amountStr,
  targetStr,
  cashOn: false,
  autoOn: false,
  bet: null,
  queued: false,
  result: null,
});

/**
 * The whole game loop, framework-free. React reads it through
 * useSyncExternalStore (see useGame.ts); every change replaces the snapshot.
 *
 * The GameEngineAPI runs the rounds (api/liveCrash.ts): it draws the crash
 * point before betting opens, runs the clock, takes the bets, pays cash-outs
 * and keeps the balance. This class follows the server's rounds and animates
 * them. Steering the duck and dodging his shots is for show: only the
 * server's crash point ends a round.
 */
export class GameEngine {
  private state: GameState;
  private listeners = new Set<() => void>();
  private raf: number | null = null;
  /** The server's current round. */
  private round: LiveRound | null = null;
  private cfg: LiveConfig | null = null;
  private connecting = false;
  private lastFrame = 0;
  /** Where the player is steering the duck, or null to fly the default path. */
  private pointer: { x: number; y: number } | null = null;
  /** Flight time (s) of the hunter's next shot. */
  private nextShotT = Infinity;
  private rng: () => number = Math.random;
  /** Out of air: the duck flies its own path until it has its breath back. */
  private breathless = false;
  events: EngineEvents = {};

  constructor(private live: LiveCrashClient) {
    const now = performance.now();
    this.state = {
      phase: 'waiting',
      now,
      waitEnd: now,
      t0: 0,
      mult: 1,
      crashAt: 0,
      crashX: 0,
      crashY: 0,
      duckX: DUCK_START.x,
      duckY: DUCK_START.y,
      duckVX: 0,
      duckVY: 0,
      aimX: DUCK_START.x,
      aimY: DUCK_START.y,
      steering: false,
      misses: [],
      air: 1,
      airLine: airLine(0),
      cause: 'shot',
      points: [],
      history: [],
      nonce: 0,
      nextHash: '',
      clientSeed: '',
      revealed: null,
      balance: 0,
      online: false,
      currency: '',
      slots: [mkSlot('10,00', '2,00'), mkSlot('20,00', '5,00')],
      lim: { rounds: 25, left: 0, profitStr: '', lossStr: '', net: 0, active: false, lastNonce: 0 },
      stats: { rounds: 0, wagered: 0, profit: 0, best: 0 },
      rows: [],
      rowId: 0,
      toast: 'Connecting to the game server…',
      celebrate: null,
      burstAt: 0,
      lastCashAt: 0,
      soundOn: false,
      cloudX: 0,
    };
  }

  // ---- store plumbing -------------------------------------------------------

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };

  getSnapshot = () => this.state;

  private set(patch: Partial<GameState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((f) => f());
  }

  start() {
    if (this.raf !== null) return;
    void this.connect();
    this.lastFrame = performance.now();
    const loop = (now: number) => {
      this.tick(now);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    if (this.raf !== null) cancelAnimationFrame(this.raf);
    this.raf = null;
  }

  // ---- the game server ---------------------------------------------------------

  private async connect() {
    if (this.connecting || this.cfg) return;
    this.connecting = true;
    this.live.handlers = {
      round: (r) => this.onRound(r),
      tick: (m, serverMs) => this.onTick(m, serverMs),
      myBet: (b, balance) => this.onMyBet(b, balance),
      resync: (s) => this.applySnapshot(s),
      status: (st, message) => {
        this.set({ online: st === 'online', toast: st === 'online' ? null : (message ?? null) });
      },
    };
    try {
      this.applySnapshot(await this.live.connect());
      this.set({ toast: null });
    } catch (e) {
      this.set({ toast: `${e instanceof Error ? e.message : "Can't reach the game server."} Retrying…` });
      setTimeout(() => void this.connect(), 3000);
    } finally {
      this.connecting = false;
    }
  }

  private applySnapshot(s: LiveSnapshot) {
    this.cfg = s.config;
    const r = s.state.round;
    const w = this.work();
    if (s.balance !== null) w.balance = s.balance;
    // the player's bets in this round (e.g. after a reload or reconnect)
    w.slots.forEach((sl) => (sl.bet = null));
    for (const b of s.state.myBets) {
      if (b.roundId !== r.id || !w.slots[b.slot]) continue;
      if (b.status !== 'Active' && b.status !== 'CashedOut') continue;
      w.slots[b.slot].bet = { amount: b.amount, target: b.autoCashOut, cashedAt: b.cashedOutAt, auto: false, win: b.win ?? undefined };
    }
    this.set({
      ...w,
      online: true,
      currency: s.player.currency,
      history: s.state.history.map((h) => h.crashPoint).slice(0, MAX_HISTORY),
    });
    this.round = null;
    this.onRound(r, true);
  }

  private onRound(r: LiveRound, restore = false) {
    const prev = this.round;
    this.round = r;
    if (r.status === 'BETTING') {
      if (!prev || prev.id !== r.id) this.newRound(r, restore);
      else this.set({ waitEnd: this.live.toLocal(r.phaseEndsAt) });
      return;
    }
    if (r.status === 'FLYING') {
      if (this.state.phase !== 'flying' || restore) this.launch(r);
      return;
    }
    if (r.status === 'CRASHED' && (this.state.phase !== 'crashed' || restore)) {
      this.crash(r, r.crashPoint ?? this.state.mult);
    }
  }

  private get growth() {
    return this.cfg?.growthRate ?? GROWTH;
  }

  /**
   * The server's multiplier while flying. The screen counts up on its own between ticks; if it
   * has drifted from the server by more than a cent, the flight clock is moved to match.
   */
  private onTick(m: number, serverMs: number) {
    if (this.state.phase !== 'flying' || Math.abs(m - this.state.mult) < 0.02) return;
    this.set({ t0: this.live.toLocal(serverMs) - (Math.log(m) / this.growth) * 1000 });
  }

  private onMyBet(b: MyBet, balance: number | null) {
    if (balance !== null) this.set({ balance });
    if (!this.round || b.roundId !== this.round.id) return;
    const sl = this.state.slots[b.slot];
    if (!sl?.bet) return;
    if (b.status === 'CashedOut' && sl.bet.cashedAt === null && b.cashedOutAt !== null) {
      const w = this.work();
      if (balance !== null) w.balance = balance;
      this.applyCash(w, b.slot, b.cashedOutAt, b.win ?? 0, performance.now(), b.winPending);
      this.set(w);
    } else if (b.status === 'Lost' && !sl.result) {
      // a bet the crash left open on screen (e.g. a cash-out that arrived too late)
      const w = this.work();
      this.lose(w, b.slot, this.state.mult);
      this.set(w);
    }
  }

  /** Bet i went down with the duck at m. */
  private lose(w: Work, i: number, m: number) {
    const sl = w.slots[i];
    if (!sl.bet || sl.bet.cashedAt !== null || sl.result) return;
    const a = sl.bet.amount;
    sl.bet = { ...sl.bet, cashing: false };
    w.rowId += 1;
    w.rows = [{ id: w.rowId, round: this.state.nonce, slot: i + 1, bet: a, at: m, win: false, profit: -a }, ...w.rows].slice(0, MAX_ROWS);
    w.stats.rounds += 1;
    w.stats.profit -= a;
    if (sl.bet.auto) w.lim.net -= a;
    sl.result = { win: false, text: `Bet ${i + 1} shot down at ${fmtX(m)}. Bet lost.` };
  }

  private async sendBet(i: number, roundId: number, amount: number, target: number | null) {
    let res: Awaited<ReturnType<LiveCrashClient['placeBet']>>;
    try {
      res = await this.live.placeBet(i, amount, target);
    } catch (e) {
      res = { ok: false, bet: null, balance: null, error: e instanceof Error ? e.message : 'Bet failed.' };
    }
    const sl = this.state.slots[i];
    if (!sl.bet?.pending || this.round?.id !== roundId) {
      if (res.balance !== null) this.set({ balance: res.balance });
      return;
    }
    if (res.ok) {
      const slots = this.state.slots.slice();
      slots[i] = { ...sl, bet: { ...sl.bet, pending: false } };
      this.set({ slots, ...(res.balance !== null ? { balance: res.balance } : {}) });
      return;
    }
    // refused: give the stake back on screen and say why
    const w = this.work();
    const a = w.slots[i].bet!.amount;
    w.slots[i].bet = null;
    w.balance = res.balance ?? w.balance + a;
    w.stats.wagered -= a;
    w.toast = `Bet ${i + 1}: ${res.error ?? 'not accepted.'}`;
    this.set(w);
  }

  // ---- helpers ----------------------------------------------------------------

  private work(): Work {
    const s = this.state;
    return {
      slots: s.slots.map((x) => ({ ...x })),
      balance: s.balance,
      rows: s.rows,
      rowId: s.rowId,
      stats: { ...s.stats },
      lim: { ...s.lim },
      burstAt: s.burstAt,
      celebrate: s.celebrate,
      toast: s.toast,
      lastCashAt: s.lastCashAt,
    };
  }

  private patchSlot(i: number, patch: Partial<Slot>) {
    const slots = this.state.slots.slice();
    slots[i] = { ...slots[i], ...patch };
    this.set({ slots });
  }

  private get minBet() {
    return this.cfg?.minBet ?? MIN_BET;
  }

  private get maxBet() {
    return this.cfg?.maxBet ?? Infinity;
  }

  private get minCashOut() {
    return this.cfg?.minAutoCashOut ?? MIN_CASHOUT;
  }

  /** Puts a bet on the slot and sends it to the server (the server can still refuse it). */
  private place(w: Work, i: number, auto: boolean, nonce: number): boolean {
    const r = this.round;
    if (!r || r.status !== 'BETTING' || !this.state.online) return false;
    const sl = w.slots[i];
    const a = parseAmount(sl.amountStr);
    if (a < this.minBet || a > this.maxBet || a > w.balance) return false;
    const tg = parseNum(sl.targetStr);
    const target = sl.cashOn && tg >= this.minCashOut ? Math.round(tg * 100) / 100 : null;
    sl.bet = { amount: a, target, cashedAt: null, auto, pending: true };
    sl.result = null;
    w.balance -= a;
    w.stats.wagered += a;
    if (auto && w.lim.lastNonce !== nonce) {
      if (w.lim.rounds !== 'inf') w.lim.left -= 1;
      w.lim.lastNonce = nonce;
    }
    void this.sendBet(i, r.id, a, target);
    return true;
  }

  private betProblem(w: Work, i: number): string {
    const a = parseAmount(w.slots[i].amountStr);
    if (!this.state.online) return "Can't reach the game server.";
    if (a < this.minBet) return `The minimum bet is ${fmt(this.minBet)}.`;
    if (a > this.maxBet) return `The maximum bet is ${fmt(this.maxBet)}.`;
    if (a > w.balance) return `Not enough balance for Bet ${i + 1}.`;
    return `Bet ${i + 1} could not be placed.`;
  }

  /** A cash-out the server has confirmed: m and win are the server's. */
  private applyCash(w: Work, i: number, m: number, win: number, now: number, pending = false) {
    const sl = w.slots[i];
    if (!sl.bet || sl.bet.cashedAt !== null || !this.round) return;
    const a = sl.bet.amount;
    const pr = win - a;
    sl.bet = { ...sl.bet, cashedAt: m, win, cashing: false };
    w.burstAt = now;
    w.lastCashAt = now;
    w.rowId += 1;
    w.rows = [
      { id: w.rowId, round: this.round.nonce, slot: i + 1, bet: a, at: m, win: true, profit: pr },
      ...w.rows,
    ].slice(0, MAX_ROWS);
    w.stats.rounds += 1;
    w.stats.profit += pr;
    w.stats.best = Math.max(w.stats.best, m);
    if (sl.bet.auto) w.lim.net += pr;
    sl.result = {
      win: true,
      text: `Bet ${i + 1} cashed out at ${fmtX(m)}: +${fmt(pr)}${pending ? ' (payment pending, it will reach your balance shortly)' : ''}`,
    };
    const tier = winTier(m);
    if (tier) w.celebrate = { label: tier, total: win, at: now, mult: m };
    this.events.cashout?.(m);
  }

  // ---- the loop ---------------------------------------------------------------

  private tick(now: number) {
    const s = this.state;
    const dt = Math.min(100, now - this.lastFrame);
    this.lastFrame = now;
    const speed = s.phase === 'flying' ? 18 + 80 * Math.min(1, Math.log(s.mult) / Math.log(20)) : 7;
    const cloudX = (s.cloudX + (dt / 1000) * speed) % 1000;

    if (s.phase === 'flying') {
      // the multiplier follows the server's clock; the server says when it crashes
      const t = Math.max(0, (now - s.t0) / 1000);
      const m = Math.min(this.cfg?.maxMultiplier ?? MAX_MULT, multiplierAt(t, this.growth));
      const dts = Math.max(0.001, dt / 1000);

      // the duck: towards the player's cursor (with a top speed), or along its default path
      let duckX: number, duckY: number;
      if (this.pointer) {
        const ddx = this.pointer.x - s.duckX;
        const ddy = this.pointer.y - s.duckY;
        const dist = Math.hypot(ddx, ddy);
        const step = Math.min(dist * (1 - Math.exp(-dts * 10)), DUCK_SPEED * dts);
        duckX = dist > 0 ? s.duckX + (ddx / dist) * step : s.duckX;
        duckY = dist > 0 ? s.duckY + (ddy / dist) * step : s.duckY;
      } else {
        const p = duckPosition(m, t);
        duckX = p.x;
        duckY = p.y;
      }
      const duckVX = (duckX - s.duckX) / dts;
      const duckVY = (duckY - s.duckY) / dts;

      // the hunter's sight chases the duck
      const f = 1 - Math.exp(-trackRate(m, s.misses.length) * dts);
      const aimX = s.aimX + (duckX - s.aimX) * f;
      const aimY = s.aimY + (duckY - s.aimY) * f;

      // steered up into the thin air of the night sky the duck runs out of breath; when it is
      // out of air it drops back to its own flight path to get its breath back
      const thin = this.pointer !== null && duckY < s.airLine;
      let air = thin ? s.air - dts / AIR_SECONDS : Math.min(1, s.air + dts / AIR_REFILL_SECONDS);
      if (air <= 0) {
        air = 0;
        this.pointer = null;
        this.breathless = true;
      } else if (air >= 1) this.breathless = false;
      // he fires every second or two and misses: it is the server's crash point that ends the round
      let misses = s.misses;
      if (t >= this.nextShotT) {
        misses = [...s.misses, { at: now, x: aimX, y: aimY }];
        this.nextShotT = t + shotGap(this.rng(), false);
        this.events.miss?.();
      }

      const patch: Partial<GameState> = { mult: m, now, cloudX, duckX, duckY, duckVX, duckVY, aimX, aimY, misses, air };
      const last = s.points[s.points.length - 1];
      if (!last || t - last.t > 0.12) patch.points = [...s.points, { t, m, x: duckX, y: duckY }];
      this.set(patch);
      return;
    }

    this.set({ now, cloudX });
  }

  private launch(r: LiveRound) {
    const now = performance.now();
    this.pointer = null;
    this.breathless = false;
    this.rng = shotRandom(r.serverSeedHash, r.nonce);
    this.nextShotT = shotGap(this.rng(), true);
    // drop bets the server never confirmed
    const w = this.work();
    w.slots.forEach((sl, i) => {
      if (sl.bet?.pending) {
        w.balance += sl.bet.amount;
        w.stats.wagered -= sl.bet.amount;
        sl.bet = null;
        w.toast = `Bet ${i + 1} missed this round.`;
      }
    });
    this.set({
      ...w,
      phase: 'flying',
      t0: this.live.toLocal(r.startedAt),
      mult: 1,
      points: [{ t: 0, m: 1, x: DUCK_START.x, y: DUCK_START.y }],
      duckX: DUCK_START.x,
      duckY: DUCK_START.y,
      duckVX: 0,
      duckVY: 0,
      aimX: DUCK_START.x,
      aimY: DUCK_START.y,
      steering: false,
      misses: [],
      air: 1,
      nonce: r.nonce,
      nextHash: r.serverSeedHash,
      now,
    });
    this.events.launch?.();
  }

  /** The server's crash point: the duck is hit at multiplier m. */
  private crash(round: LiveRound, m: number) {
    const s = this.state;
    const now = performance.now();
    const t = Math.max(0, (now - s.t0) / 1000);
    const x = s.duckX;
    const y = s.duckY;
    const w = this.work();
    w.slots.forEach((sl, i) => {
      if (!sl.bet || sl.bet.cashedAt !== null || sl.bet.pending) return;
      // an auto cash-out at or below the crash point won; the server's payment is on its way
      if (sl.bet.target !== null && sl.bet.target <= m) return;
      // a cash-out still on its way: the server's answer (or its MyBet) settles it
      if (sl.bet.cashing) return;
      this.lose(w, i, m);
    });
    this.pointer = null;
    this.nextShotT = Infinity;
    const crashedAt = round.crashedAt !== null ? Math.min(now, this.live.toLocal(round.crashedAt)) : now;
    this.set({
      ...w,
      phase: 'crashed',
      cause: 'shot',
      mult: m,
      crashAt: crashedAt,
      crashX: x,
      crashY: y,
      duckX: x,
      duckY: y,
      now,
      nonce: round.nonce,
      history: s.history[0] === m && s.revealed?.nonce === round.nonce ? s.history : [m, ...s.history].slice(0, MAX_HISTORY),
      points: [...s.points, { t, m, x, y }],
      revealed: { nonce: round.nonce, serverSeed: round.serverSeedHash, crash: m, hitAt: m },
    });
    this.events.crash?.(m);
  }

  /** A new betting window from the server. */
  private newRound(r: LiveRound, restore: boolean) {
    const nonce = r.nonce;
    const w = this.work();
    if (!restore)
      w.slots.forEach((sl) => {
        sl.bet = null;
        sl.result = null;
      });
    this.set({
      ...w,
      phase: 'waiting',
      waitEnd: this.live.toLocal(r.phaseEndsAt),
      nonce,
      nextHash: r.serverSeedHash,
      mult: 1,
      points: [],
    });
    if (restore) return;

    const v = this.work();
    if (v.lim.active && v.slots.some((sl) => sl.autoOn)) {
      const sp = parseNum(v.lim.profitStr);
      const lo = parseNum(v.lim.lossStr);
      let why = '';
      if (v.lim.rounds !== 'inf' && v.lim.left <= 0)
        why = `Auto play finished: all rounds played. Net ${v.lim.net >= 0 ? '+' : ''}${fmt(v.lim.net)}.`;
      else if (sp > 0 && v.lim.net >= sp) why = `Auto play stopped: profit target reached (+${fmt(v.lim.net)}).`;
      else if (lo > 0 && -v.lim.net >= lo) why = `Auto play stopped: loss limit reached (${fmt(v.lim.net)}).`;
      if (why) {
        v.slots.forEach((sl) => (sl.autoOn = false));
        v.lim.active = false;
        v.toast = why;
      } else {
        v.slots.forEach((sl, i) => {
          if (sl.autoOn && !sl.bet && !this.place(v, i, true, nonce)) {
            v.toast = `Bet ${i + 1} auto play stopped: ${this.betProblem(v, i)}`;
            sl.autoOn = false;
          }
        });
        if (!v.slots.some((sl) => sl.autoOn)) v.lim.active = false;
      }
    }

    v.slots.forEach((sl, i) => {
      if (sl.queued && !sl.autoOn && !sl.bet && !this.place(v, i, false, nonce)) v.toast = this.betProblem(v, i);
      sl.queued = false;
    });
    this.set(v);
  }

  // ---- player actions -------------------------------------------------------------

  /**
   * Steer the flying duck towards a point in scene coordinates. `view` is the part of the scene on
   * screen (phones show sky above it and crop its sides), so the duck can climb to just below its
   * top and never leaves it; `air` is where the thin air starts, if the stage places it.
   */
  steer(x: number, y: number, view: { top: number; left: number; right: number; air?: number } = { top: 0, left: 0, right: 1000 }) {
    if (this.state.phase !== 'flying') return;
    const line = view.air ?? airLine(view.top);
    if (Math.abs(line - this.state.airLine) > 1) this.set({ airLine: line });
    const px = clamp(x, Math.max(SKY.minX, view.left + SKY.minX), Math.min(SKY.maxX, view.right - (1000 - SKY.maxX)));
    const maxY = px < SKY_OVER_HUNTER.maxX ? SKY_OVER_HUNTER.maxY : SKY.maxY;
    if (this.breathless) return;
    this.pointer = { x: px, y: clamp(y, Math.min(view.top + SKY.minY, maxY), maxY) };
    if (!this.state.steering) this.set({ steering: true });
  }

  setAmountText(i: number, text: string) {
    this.patchSlot(i, { amountStr: text });
  }

  setAmount(i: number, v: number) {
    const cap = Math.max(this.minBet, Math.min(this.maxBet, this.state.balance));
    const val = Math.max(this.minBet, Math.min(Math.round(v * 100) / 100, cap));
    this.patchSlot(i, { amountStr: fmt(val) });
  }

  amountOf(i: number): number {
    return parseAmount(this.state.slots[i].amountStr);
  }

  normalizeAmount(i: number) {
    this.setAmount(i, this.amountOf(i) || 1);
  }

  setTargetText(i: number, text: string) {
    this.patchSlot(i, { targetStr: text });
  }

  toggleCashOut(i: number) {
    this.patchSlot(i, { cashOn: !this.state.slots[i].cashOn });
  }

  /** The big button: place, cancel, queue, or cash out depending on the moment. */
  mainAction(i: number) {
    const s = this.state;
    const sl = s.slots[i];
    if (sl.bet && s.phase === 'flying' && sl.bet.cashedAt === null) {
      if (!sl.bet.cashing && !sl.bet.pending) void this.cashOut(i);
      return;
    }
    if (sl.bet && s.phase === 'waiting') {
      if (!sl.bet.pending && !sl.bet.cashing) void this.cancel(i);
      return;
    }
    if (sl.autoOn) return;
    if (s.phase !== 'waiting') {
      this.patchSlot(i, { queued: !sl.queued });
      return;
    }
    const w = this.work();
    if (!this.place(w, i, false, s.nonce)) {
      this.set({ toast: this.betProblem(w, i) });
      return;
    }
    w.toast = null;
    this.set(w);
  }

  private async cashOut(i: number) {
    const sl = this.state.slots[i];
    this.patchSlot(i, { bet: { ...sl.bet!, cashing: true } });
    let res: Awaited<ReturnType<LiveCrashClient['cashOut']>>;
    try {
      res = await this.live.cashOut(i);
    } catch (e) {
      res = { ok: false, multiplier: null, win: null, balance: null, error: e instanceof Error ? e.message : 'Cash-out failed.' };
    }
    const cur = this.state.slots[i];
    if (!cur.bet) return;
    if (res.ok && res.multiplier !== null) {
      const w = this.work();
      if (res.balance !== null) w.balance = res.balance;
      this.applyCash(w, i, res.multiplier, res.win ?? 0, performance.now(), res.balance === null);
      this.set(w);
      return;
    }
    const slots = this.state.slots.slice();
    slots[i] = { ...cur, bet: { ...cur.bet, cashing: false } };
    this.set({ slots, toast: cur.bet.cashedAt === null ? `Bet ${i + 1}: ${res.error ?? 'cash-out failed.'}` : this.state.toast });
  }

  private async cancel(i: number) {
    const sl = this.state.slots[i];
    this.patchSlot(i, { bet: { ...sl.bet!, cashing: true } });
    let res: Awaited<ReturnType<LiveCrashClient['cancelBet']>>;
    try {
      res = await this.live.cancelBet(i);
    } catch (e) {
      res = { ok: false, balance: null, error: e instanceof Error ? e.message : 'Cancel failed.' };
    }
    const w = this.work();
    const b = w.slots[i].bet;
    if (!b) return;
    if (!res.ok) {
      w.slots[i].bet = { ...b, cashing: false };
      w.toast = `Bet ${i + 1}: ${res.error ?? 'could not cancel.'}`;
      this.set(w);
      return;
    }
    w.balance = res.balance ?? w.balance + b.amount;
    w.stats.wagered -= b.amount;
    w.slots[i].bet = null;
    w.slots[i].autoOn = false;
    w.toast = null;
    if (!w.slots.some((x) => x.autoOn)) w.lim.active = false;
    this.set(w);
  }

  toggleAuto(i: number) {
    const s = this.state;
    const w = this.work();
    const sl = w.slots[i];
    if (sl.autoOn) {
      sl.autoOn = false;
      if (!w.slots.some((x) => x.autoOn)) {
        w.lim.active = false;
        w.toast = `Auto play stopped. Net ${w.lim.net >= 0 ? '+' : ''}${fmt(w.lim.net)}.`;
      }
      this.set(w);
      return;
    }
    const a = parseAmount(sl.amountStr);
    if (a < this.minBet || a > this.maxBet || a > w.balance) {
      this.set({ toast: `Bet ${i + 1} auto play: ${this.betProblem(w, i)}` });
      return;
    }
    sl.autoOn = true;
    sl.queued = false;
    w.toast = null;
    if (!w.lim.active) {
      w.lim.active = true;
      w.lim.net = 0;
      w.lim.left = w.lim.rounds === 'inf' ? Infinity : w.lim.rounds;
      w.lim.lastNonce = 0;
    }
    if (s.phase === 'waiting' && !sl.bet) this.place(w, i, true, s.nonce);
    this.set(w);
  }

  stopAuto() {
    const w = this.work();
    w.slots.forEach((x) => (x.autoOn = false));
    w.lim.active = false;
    w.toast = `Auto play stopped. Net ${w.lim.net >= 0 ? '+' : ''}${fmt(w.lim.net)}.`;
    this.set(w);
  }

  setRounds(r: RoundsOption) {
    if (this.state.lim.active) return;
    this.set({ lim: { ...this.state.lim, rounds: r } });
  }

  setLimit(key: 'profitStr' | 'lossStr', value: string) {
    this.set({ lim: { ...this.state.lim, [key]: value } });
  }

  /** Reads the balance from the server again. */
  async refreshBalance() {
    try {
      this.set({ balance: await this.live.getBalance(), toast: null });
    } catch (e) {
      this.set({ toast: e instanceof Error ? e.message : "Can't reach the game server." });
    }
  }

  dismissToast() {
    this.set({ toast: null });
  }

  toggleSound() {
    this.set({ soundOn: !this.state.soundOn });
  }
}
