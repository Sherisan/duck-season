import {
  AIR_REFILL_SECONDS,
  AIR_SECONDS,
  CROC_CALM_SECONDS,
  CROC_LINE,
  CROC_SECONDS,
  DUCK_SPEED,
  DUCK_START,
  HOLD_MS,
  MAX_MULT,
  MIN_BET,
  MIN_CASHOUT,
  SKY,
  START_BALANCE,
  WAIT_MS,
  airLine,
  duckPosition,
  multiplierAt,
  SKY_OVER_HUNTER,
  shotGap,
  shotRandom,
  sightRadius,
  trackRate,
  winTier,
} from './engine';
import type { RoundProvider, RoundResult } from './fairness';
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
 */
export class GameEngine {
  private state: GameState;
  private listeners = new Set<() => void>();
  private raf: number | null = null;
  private round: RoundResult | null = null;
  private starting = false;
  private retryAt = 0;
  private lastFrame = 0;
  /** Where the player is steering the duck, or null to fly the default path. */
  private pointer: { x: number; y: number } | null = null;
  /** Flight time (s) of the hunter's next dodgeable shot. */
  private nextShotT = Infinity;
  private rng: () => number = Math.random;
  events: EngineEvents = {};

  constructor(private provider: RoundProvider) {
    const now = performance.now();
    this.state = {
      phase: 'waiting',
      now,
      waitEnd: now + WAIT_MS,
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
      croc: 1,
      cause: 'shot',
      points: [],
      history: [],
      nonce: 0,
      nextHash: '',
      clientSeed: 'marsh-' + Math.random().toString(36).slice(2, 10),
      revealed: null,
      balance: START_BALANCE,
      slots: [mkSlot('10,00', '2,00'), mkSlot('20,00', '5,00')],
      lim: { rounds: 25, left: 0, profitStr: '', lossStr: '', net: 0, active: false, lastNonce: 0 },
      stats: { rounds: 0, wagered: 0, profit: 0, best: 0 },
      rows: [],
      rowId: 0,
      toast: null,
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

  private place(w: Work, i: number, auto: boolean, nonce: number): boolean {
    const sl = w.slots[i];
    const a = parseAmount(sl.amountStr);
    if (a <= 0 || a > w.balance) return false;
    const tg = parseNum(sl.targetStr);
    sl.bet = { amount: a, target: sl.cashOn && tg >= MIN_CASHOUT ? tg : null, cashedAt: null, auto };
    sl.result = null;
    w.balance -= a;
    w.stats.wagered += a;
    if (auto && w.lim.lastNonce !== nonce) {
      if (w.lim.rounds !== 'inf') w.lim.left -= 1;
      w.lim.lastNonce = nonce;
    }
    return true;
  }

  private applyCash(w: Work, i: number, m: number, now: number) {
    const sl = w.slots[i];
    if (!sl.bet || sl.bet.cashedAt !== null || !this.round) return;
    const a = sl.bet.amount;
    const win = Math.round(a * m * 100) / 100;
    const pr = win - a;
    sl.bet = { ...sl.bet, cashedAt: m };
    w.balance += win;
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
    sl.result = { win: true, text: `Bet ${i + 1} cashed out at ${fmtX(m)}: +${fmt(pr)}` };
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

    if (s.phase === 'waiting') {
      if (!this.round && !this.starting && now >= this.retryAt) {
        this.starting = true;
        void this.newRound();
      }
      if (this.round && this.round.nonce === s.nonce && now >= s.waitEnd) {
        this.pointer = null;
        this.rng = shotRandom(this.round.serverSeed, this.round.nonce);
        this.nextShotT = shotGap(this.rng(), true);
        this.set({
          phase: 'flying',
          t0: now,
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
          croc: 1,
          now,
          cloudX,
        });
        this.events.launch?.();
        return;
      }
      this.set({ now, cloudX });
      return;
    }

    if (s.phase === 'flying' && this.round) {
      const round = this.round;
      const t = (now - s.t0) / 1000;
      const m = multiplierAt(t);
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

      // the hunter's sight chases the duck, with a lag the player can exploit
      const f = 1 - Math.exp(-trackRate(m, s.misses.length) * dts);
      const aimX = s.aimX + (duckX - s.aimX) * f;
      const aimY = s.aimY + (duckY - s.aimY) * f;

      // at the seeded crash point he never misses
      if (m >= round.crash || m >= MAX_MULT) {
        this.crash(round, Math.min(m, round.crash), t, now, cloudX, duckX, duckY);
        return;
      }
      // steered up into the thin air of the night sky the duck runs out of breath, and faints
      // if it stays too long; lower down it gets its breath back
      const thin = this.pointer !== null && duckY < s.airLine;
      const air = thin ? s.air - dts / AIR_SECONDS : Math.min(1, s.air + dts / AIR_REFILL_SECONDS);
      if (air <= 0) {
        this.crash(round, m, t, now, cloudX, duckX, duckY, 'faint');
        return;
      }
      // steered low over the lake, the duck tempts the crocodile, which lunges if it lingers
      const low = this.pointer !== null && duckY > CROC_LINE;
      const croc = low ? s.croc - dts / CROC_SECONDS : Math.min(1, s.croc + dts / CROC_CALM_SECONDS);
      if (croc <= 0) {
        this.crash(round, m, t, now, cloudX, duckX, duckY, 'croc');
        return;
      }
      // before it, his shots hit only if the duck is inside his sight ring
      let misses = s.misses;
      if (t >= this.nextShotT) {
        if (Math.hypot(duckX - aimX, duckY - aimY) <= sightRadius(m)) {
          this.crash(round, m, t, now, cloudX, duckX, duckY);
          return;
        }
        misses = [...s.misses, { at: now, x: aimX, y: aimY }];
        this.nextShotT = t + shotGap(this.rng(), false);
        this.events.miss?.();
      }

      let w: Work | null = null;
      for (let i = 0; i < s.slots.length; i++) {
        const b = s.slots[i].bet;
        if (b && b.cashedAt === null && b.target !== null && m >= b.target) {
          w = w ?? this.work();
          this.applyCash(w, i, b.target, now);
        }
      }
      const patch: Partial<GameState> = { ...(w ?? {}), mult: m, now, cloudX, duckX, duckY, duckVX, duckVY, aimX, aimY, misses, air, croc };
      const last = s.points[s.points.length - 1];
      if (!last || t - last.t > 0.12) patch.points = [...s.points, { t, m, x: duckX, y: duckY }];
      this.set(patch);
      return;
    }

    if (s.phase === 'crashed' && now - s.crashAt > HOLD_MS && !this.starting) {
      this.starting = true;
      this.round = null;
      void this.newRound();
    }
    this.set({ now, cloudX });
  }

  /** The duck is hit (or faints) at multiplier m, at (x, y). */
  private crash(round: RoundResult, m: number, t: number, now: number, cloudX: number, x: number, y: number, cause: GameState['cause'] = 'shot') {
    const s = this.state;
    const w = this.work();
    w.slots.forEach((sl, i) => {
      if (sl.bet && sl.bet.cashedAt === null) {
        const a = sl.bet.amount;
        w.rowId += 1;
        w.rows = [{ id: w.rowId, round: round.nonce, slot: i + 1, bet: a, at: m, win: false, profit: -a }, ...w.rows].slice(0, MAX_ROWS);
        w.stats.rounds += 1;
        w.stats.profit -= a;
        if (sl.bet.auto) w.lim.net -= a;
        sl.result = {
          win: false,
          text:
            cause === 'faint'
              ? `Bet ${i + 1}: out of air at ${fmtX(m)}. Bet lost.`
              : cause === 'croc'
                ? `Bet ${i + 1}: snapped up by the croc at ${fmtX(m)}. Bet lost.`
                : `Bet ${i + 1} shot down at ${fmtX(m)}. Bet lost.`,
        };
      }
    });
    this.pointer = null;
    this.nextShotT = Infinity;
    this.set({
      ...w,
      phase: 'crashed',
      cause,
      mult: m,
      crashAt: now,
      crashX: x,
      crashY: y,
      duckX: x,
      duckY: y,
      now,
      cloudX,
      history: [m, ...s.history].slice(0, MAX_HISTORY),
      points: [...s.points, { t, m, x, y }],
      revealed: { nonce: round.nonce, serverSeed: round.serverSeed, crash: round.crash, hitAt: m },
    });
    this.events.crash?.(m);
  }

  private async newRound() {
    const nonce = this.state.nonce + 1;
    let round: RoundResult;
    try {
      round = await this.provider.next(nonce, this.state.clientSeed);
    } catch {
      this.starting = false;
      this.retryAt = performance.now() + 2000;
      this.set({ toast: 'Could not reach the round server. Retrying…' });
      return;
    }
    this.round = round;
    const w = this.work();
    w.slots.forEach((sl) => {
      sl.bet = null;
      sl.result = null;
    });

    if (w.lim.active && w.slots.some((sl) => sl.autoOn)) {
      const sp = parseNum(w.lim.profitStr);
      const lo = parseNum(w.lim.lossStr);
      let why = '';
      if (w.lim.rounds !== 'inf' && w.lim.left <= 0)
        why = `Auto play finished: all rounds played. Net ${w.lim.net >= 0 ? '+' : ''}${fmt(w.lim.net)}.`;
      else if (sp > 0 && w.lim.net >= sp) why = `Auto play stopped: profit target reached (+${fmt(w.lim.net)}).`;
      else if (lo > 0 && -w.lim.net >= lo) why = `Auto play stopped: loss limit reached (${fmt(w.lim.net)}).`;
      if (why) {
        w.slots.forEach((sl) => (sl.autoOn = false));
        w.lim.active = false;
        w.toast = why;
      } else {
        w.slots.forEach((sl, i) => {
          if (sl.autoOn && !this.place(w, i, true, nonce)) {
            sl.autoOn = false;
            w.toast = `Bet ${i + 1} auto play stopped: not enough demo credits.`;
          }
        });
        if (!w.slots.some((sl) => sl.autoOn)) w.lim.active = false;
      }
    }

    w.slots.forEach((sl, i) => {
      if (sl.queued && !sl.autoOn && !this.place(w, i, false, nonce))
        w.toast = `Not enough demo credits for Bet ${i + 1}.`;
      sl.queued = false;
    });

    this.starting = false;
    this.set({
      ...w,
      phase: 'waiting',
      waitEnd: performance.now() + WAIT_MS,
      nonce,
      nextHash: round.hash,
      mult: 1,
      points: [],
    });
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
    this.pointer = { x: px, y: clamp(y, Math.min(view.top + SKY.minY, maxY), maxY) };
    if (!this.state.steering) this.set({ steering: true });
  }

  setAmountText(i: number, text: string) {
    this.patchSlot(i, { amountStr: text });
  }

  setAmount(i: number, v: number) {
    const cap = Math.max(MIN_BET, this.state.balance);
    const val = Math.max(MIN_BET, Math.min(Math.round(v * 100) / 100, cap));
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
      const w = this.work();
      this.applyCash(w, i, s.mult, performance.now());
      this.set(w);
      return;
    }
    if (sl.bet && s.phase === 'waiting') {
      const w = this.work();
      const b = w.slots[i].bet!.amount;
      w.balance += b;
      w.stats.wagered -= b;
      w.slots[i].bet = null;
      w.slots[i].autoOn = false;
      w.toast = null;
      if (!w.slots.some((x) => x.autoOn)) w.lim.active = false;
      this.set(w);
      return;
    }
    if (sl.autoOn) return;
    if (s.phase !== 'waiting') {
      this.patchSlot(i, { queued: !sl.queued });
      return;
    }
    const w = this.work();
    if (!this.place(w, i, false, s.nonce)) {
      this.set({ toast: `Not enough demo credits for Bet ${i + 1}. Lower it or refill.` });
      return;
    }
    w.toast = null;
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
    if (a <= 0 || a > w.balance) {
      this.set({ toast: `Not enough demo credits for Bet ${i + 1} auto play.` });
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
    if (s.phase === 'waiting' && !sl.bet && this.round) this.place(w, i, true, s.nonce);
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

  refill() {
    this.set({ balance: START_BALANCE, toast: `Demo credits refilled to ${fmt(START_BALANCE)}.` });
  }

  dismissToast() {
    this.set({ toast: null });
  }

  toggleSound() {
    this.set({ soundOn: !this.state.soundOn });
  }
}
