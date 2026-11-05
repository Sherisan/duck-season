import { Duck, type DuckState } from '../art/Duck';
import { Hunter, type HunterMood } from '../art/Hunter';
import { CrocHead, CrocLeaper, CrocLurk } from '../art/Croc';
import { Clouds, SceneBank, SceneForeground, SceneLand, SceneNearShore, SceneSky } from '../art/Scene';
import { useEffect, useId, useRef, useState } from 'react';
import {
  AIR_SECONDS,
  CROC_LEAP_START,
  CROC_LEAP_TIME,
  CROC_LINE,
  CROC_SECONDS,
  WAIT_MS,
  HOLD_MS,
  DUCK_START,
  GRAVITY,
  HUNTER_SCALE,
  HUNTER_SCALE_WIDE,
  hunterTransform,
  SHOT_TRAVEL,
  SURFACE,
  aimAngle,
  fallTime,
  muzzlePosition,
  sightRadius,
} from '../game/engine';
import type { GameEngine } from '../game/GameEngine';
import { fmt, fmtX } from '../game/format';
import { LINES } from '../game/lines';
import type { GameState } from '../game/types';

/** Left edge of open water; the bank is to the left of it. */
const LAKE_MIN_X = 430;

/**
 * The shot duck's path after impact (h seconds): knocked along the shot (ux, uy), tumbling down
 * to the lake, then bobbing belly-up until the croc takes it. `hs` is seconds since the splash, or -1 before it.
 */
function deathMotion(cx: number, cy: number, ux: number, uy: number, h: number) {
  const vy = uy * 120 - 30;
  const floatY = SURFACE - 6;
  const tl = fallTime(cy, uy);
  // always land in the lake, never on the hunter's bank
  const vx = Math.max(ux * 120 + 20, (LAKE_MIN_X - cx) / tl);
  const lx = cx + vx * tl;
  const rl = -14 + tl * 600;
  if (h < tl) {
    return { x: cx + vx * h, y: cy + vy * h + 0.5 * GRAVITY * h * h, rot: -14 + h * 600, hs: -1, lx };
  }
  const hs = h - tl;
  const belly = 165 + 360 * Math.round((rl - 165) / 360);
  const settle = 1 - Math.pow(1 - Math.min(1, hs / 0.35), 3);
  const bob = Math.sin(hs * 9) * 3 * Math.exp(-hs * 3);
  return {
    x: lx + 14 * (1 - Math.exp(-hs * 3)),
    y: floatY + bob,
    rot: rl + (belly - rl) * settle + Math.sin(hs * 4) * 4 * Math.exp(-hs),
    hs,
    lx: lx + 14 * (1 - Math.exp(-hs * 3)),
  };
}

const FEATHER_FILLS = ['#c2a07a', '#efe8dc', '#7d5e41', '#1d9a82'];

/** The crocodile's attack (seconds from the crash): it reaches the duck, snaps shut, then drags it under. */
const CROC_REACH = 0.26;
const CROC_SNAP = 0.34;
const CROC_PULL = 0.42;
const CROC_PULL_TIME = 0.55;
/** The lunging croc's size on stage, and the angle it lunges up at; the duck is held this far along its jaws. */
const CROC_SCALE = 1.4;
const CROC_ANGLE = -72;
const JAW_BITE = 74;
/** The whole leaping croc's size on stage. */
const LEAP_SCALE = 0.62;

/** A splash at x on the lake, `t` seconds after it: ripple rings, foam, a crown and droplets; `size` scales it. */
function Splash({ x, t, size = 1 }: { x: number; t: number; size?: number }) {
  if (t < 0 || t >= 2.6) return null;
  return (
    <g>
      {[0, 0.3, 0.6, 1.0, 1.4].map((d) => {
        const rt = t - d;
        if (rt < 0 || rt > 1.3) return null;
        const rx = (12 + rt * 80) * size;
        return <ellipse key={d} cx={x} cy={SURFACE} rx={rx} ry={rx * 0.13} fill="none" stroke="#cfe6ff" strokeWidth="1.6" opacity={(1 - rt / 1.3) * 0.75} />;
      })}
      {t < 0.9 && <ellipse cx={x} cy={SURFACE + 1} rx={(30 - t * 10) * size} ry={4.5 * size} fill="#e8f3ff" opacity={(1 - t / 0.9) * 0.6} />}
      {t < 0.45 && (
        <g transform={`translate(${x.toFixed(1)} ${SURFACE}) scale(${((1 + t * 0.8) * size).toFixed(3)} ${(Math.sin(Math.PI * (t / 0.45)) * size).toFixed(3)})`}>
          <path
            d="M-32 0 C-26 -10 -22 -22 -18 -32 C-15 -20 -11 -12 -7 -6 C-5 -24 -2 -42 0 -52 C2 -42 5 -24 7 -6 C11 -12 15 -20 18 -32 C22 -22 26 -10 32 0 Z"
            fill="#cfe6ff"
            opacity=".85"
          />
          <path d="M-3 -8 C-2 -24 -1 -36 0 -44 C1 -36 2 -24 3 -8 Z" fill="#fff" opacity=".8" />
        </g>
      )}
      {Array.from({ length: 12 }, (_, k) => {
        const vx = (k - 5.5) * 26 * size;
        const vy = -(170 + (k % 3) * 60) * Math.sqrt(size);
        const y = SURFACE + vy * t + 0.5 * GRAVITY * t * t;
        if (y > SURFACE) return null;
        return <circle key={k} cx={x + vx * t} cy={y} r={k % 2 ? 2 : 2.8} fill="#e8f3ff" />;
      })}
    </g>
  );
}

const easeOut = (p: number) => 1 - (1 - p) * (1 - p);
const easeIn = (p: number) => p * p;

/** Phones: the whole scene, with the near shore below it for the altitude gauge. */
const PHONE_VIEW = { x: 0, w: 1000, h: 680 };

export function Stage({ s, engine }: { s: GameState; engine: GameEngine }) {
  const svgRef = useRef<SVGSVGElement>(null);
  // a tall stage (phones) shows the scene and near shore, fitted to its width, with sky above for the
  // read-outs; a stage a little taller than the scene fits it whole; wider stages crop some sky
  const [fit, setFit] = useState<'slice' | 'meet' | 'phone'>('slice');
  // on phones, the scene y of the top of the stage, where the dusk sky starts
  const [skyTop, setSkyTop] = useState(0);
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      const r = width > 0 ? height / width : 0;
      const phone = r > PHONE_VIEW.h / PHONE_VIEW.w;
      setFit(phone ? 'phone' : r > 560 / 1000 ? 'meet' : 'slice');
      setSkyTop(phone ? Math.floor(PHONE_VIEW.h - r * PHONE_VIEW.w) : 0);
    });
    ro.observe(svg);
    return () => ro.disconnect();
  }, []);
  const faceRef = useRef<1 | -1>(1);
  const { phase: ph, now, mult: m } = s;
  const t = ph === 'flying' ? (now - s.t0) / 1000 : 0;
  const e = ph === 'crashed' ? (now - s.crashAt) / 1000 : 0;
  // the round ended with the duck fainting from lack of air, or taken by the crocodile: no blast
  const faint = s.cause === 'faint';
  const croc = s.cause === 'croc';
  const quiet = faint || croc;
  // seconds since the shot reached the duck, or since it fainted (negative while the shot is in the air)
  const h = quiet ? e : e - SHOT_TRAVEL;
  const waitLeft = Math.max(0, (s.waitEnd - now) / 1000);
  const clipId = `sink-${useId().replace(/:/g, '')}`;
  // phones draw the scene small, so the hunter, duck and croc are drawn larger there than on wider screens
  const wide = fit !== 'phone';
  const hk = wide ? HUNTER_SCALE_WIDE : HUNTER_SCALE;
  const dk = wide ? 0.8 : 1;
  const ck = wide ? 0.8 : 1;
  const crocBite = JAW_BITE * CROC_SCALE * ck;

  // the shot line, from the muzzle to where the duck was hit
  const crashAim = aimAngle(s.crashX, s.crashY, hk);
  const mz = muzzlePosition(crashAim, hk);
  const shotLen = Math.hypot(s.crashX - mz.x, s.crashY - mz.y) || 1;
  const ux = (s.crashX - mz.x) / shotLen;
  const uy = (s.crashY - mz.y) / shotLen;
  // the crocodile's lunge: its jaw hinge rises from under the water so the jaws close on the duck,
  // then it tips over and dives, taking the duck with it
  let crocHead: { x: number; y: number; a: number; open: number } | null = null;
  if (ph === 'crashed' && croc) {
    const lunge = easeOut(Math.min(1, e / CROC_REACH));
    const pull = e < CROC_PULL ? 0 : easeIn(Math.min(1, (e - CROC_PULL) / CROC_PULL_TIME));
    const up = (CROC_ANGLE * Math.PI) / 180;
    const reachY = s.crashY - crocBite * Math.sin(up);
    const snap = Math.min(1, Math.max(0, (e - CROC_REACH) / (CROC_SNAP - CROC_REACH)));
    crocHead = {
      x: s.crashX - crocBite * Math.cos(up),
      y: SURFACE + 130 + (reachY - SURFACE - 130) * lunge + pull * (SURFACE + 210 - s.crashY),
      a: CROC_ANGLE + pull * 26,
      open: 56 - snap * 50,
    };
  }
  const death =
    ph === 'crashed' && croc
      ? { x: 0, y: 0, rot: 0, hs: e, lx: s.crashX - 18 }
      : ph === 'crashed' && h >= 0
        ? deathMotion(s.crashX, s.crashY, faint ? 0 : ux, faint ? 0 : uy, h)
        : null;
  const hs = death ? death.hs : -1;

  // --- after a shot or fainted duck lands, the croc leaps out of the lake and comes down on it ---
  // it springs from whichever side has open water, along an arc that ends with its jaws on the duck
  const leapT = hs - CROC_LEAP_START;
  const leapK = LEAP_SCALE * ck;
  const leapDir: 1 | -1 = death && death.lx < 715 ? -1 : 1;
  const leapFromX = death ? death.lx - leapDir * 390 * leapK : 0;
  const eaten = ph === 'crashed' && !croc && leapT >= CROC_LEAP_TIME * 0.97;
  let leap: { x: number; y: number; a: number; open: number } | null = null;
  if (ph === 'crashed' && !croc && death && leapT >= 0 && leapT < CROC_LEAP_TIME + 0.2) {
    const q = Math.min(1, leapT / CROC_LEAP_TIME);
    const bite = JAW_BITE * leapK;
    const sx = death.lx - leapDir * 470 * leapK;
    const sy = SURFACE + 30;
    const ex = death.lx - leapDir * 0.5 * bite;
    const ey = SURFACE - 2 - 0.866 * bite;
    const cx = (sx + ex) / 2;
    const cy = SURFACE - 480 * leapK;
    const r = 1 - q;
    const vx = 2 * r * (cx - sx) + 2 * q * (ex - cx);
    const vy = 2 * r * (cy - sy) + 2 * q * (ey - cy);
    const snap = Math.min(1, Math.max(0, (q - 0.86) / 0.12));
    leap = {
      x: r * r * sx + 2 * q * r * cx + q * q * ex,
      y: r * r * sy + 2 * q * r * cy + q * q * ey,
      a: (Math.atan2(vy, vx * leapDir) * 180) / Math.PI,
      open: 46 - snap * 42,
    };
  }

  // --- duck ---------------------------------------------------------------
  let dx: number, dy: number, rot: number, duckState: DuckState;
  if (ph === 'waiting') {
    dx = DUCK_START.x;
    dy = DUCK_START.y + Math.sin(now / 380) * 2.5;
    rot = 0;
    duckState = 'float';
  } else if (ph === 'flying') {
    dx = s.duckX;
    dy = s.duckY + (s.steering ? Math.sin(t * 4.2) * 4 : 0);
    // tilt with the climb or dive; face the way it is flying
    if (s.duckVX < -80) faceRef.current = -1;
    else if (s.duckVX > 80) faceRef.current = 1;
    rot = Math.max(-40, Math.min(28, -14 + s.duckVY * 0.05 * faceRef.current));
    duckState = 'fly';
  } else if (crocHead) {
    // flapping in panic until the jaws shut, then held in them as the croc dives
    const held = e >= CROC_SNAP;
    const rad = (crocHead.a * Math.PI) / 180;
    dx = held ? crocHead.x + crocBite * Math.cos(rad) : s.crashX;
    dy = held ? crocHead.y + crocBite * Math.sin(rad) : s.crashY;
    rot = held ? crocHead.a + 90 + Math.sin(e * 40) * 6 : -14 + Math.sin(e * 50) * 10;
    duckState = held ? 'hit' : 'fly';
  } else if (h < 0) {
    dx = s.crashX;
    dy = s.crashY;
    rot = -14;
    duckState = 'fly';
  } else {
    dx = death!.x;
    dy = death!.y;
    rot = death!.rot;
    duckState = 'hit';
  }

  // --- a missed shot (the player dodged) --------------------------------------
  const lastMiss = ph === 'flying' && s.misses.length ? s.misses[s.misses.length - 1] : null;
  const me = lastMiss ? (now - lastMiss.at) / 1000 : Infinity;
  let missLine: { x1: number; y1: number; x2: number; y2: number } | null = null;
  if (lastMiss && me < 0.35) {
    const from = muzzlePosition(aimAngle(lastMiss.x, lastMiss.y, hk), hk);
    // the shot flies on past the empty sight
    missLine = { x1: from.x, y1: from.y, x2: from.x + (lastMiss.x - from.x) * 1.8, y2: from.y + (lastMiss.y - from.y) * 1.8 };
  }

  // --- hunter -------------------------------------------------------------
  const aim = ph === 'waiting' ? -10 : ph === 'flying' ? aimAngle(s.aimX, s.aimY, hk) : crashAim;
  const kick = ph === 'crashed' && !quiet && e < 0.2 ? 1 - e / 0.2 : me < 0.2 ? 1 - me / 0.2 : 0;
  let mood: HunterMood = 'idle';
  let bubble: string | null = null;
  if (ph === 'crashed') {
    mood = croc ? 'annoyed' : 'cheer';
    if (e > 0.15 && e < 2.8) bubble = croc ? LINES.croc : faint ? LINES.faint : LINES.hit;
    // ...until the croc takes his duck
    if (eaten && leapT >= CROC_LEAP_TIME) {
      mood = 'annoyed';
      bubble = LINES.stolen;
    }
  } else if (ph === 'flying') {
    const sinceCash = (now - s.lastCashAt) / 1000;
    if (me < 1.4) {
      mood = 'annoyed';
      bubble = s.misses.length > 1 ? LINES.missAgain : LINES.miss;
    } else if (s.lastCashAt > s.t0 && sinceCash < 1.5) {
      mood = 'annoyed';
      bubble = LINES.cashout;
    } else mood = 'aim';
  }

  // steer the duck: pointer position on the stage, converted to scene coordinates
  const steer = (ev: React.PointerEvent) => {
    const svg = svgRef.current;
    if (ph !== 'flying' || !svg) return;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const inv = ctm.inverse();
    const pt = new DOMPoint(ev.clientX, ev.clientY).matrixTransform(inv);
    const box = ev.currentTarget.getBoundingClientRect();
    const tl = new DOMPoint(box.left, box.top).matrixTransform(inv);
    const br = new DOMPoint(box.right, box.bottom).matrixTransform(inv);
    // the thin-air line sits just under the read-outs at the top of the stage
    const readout = ev.currentTarget.querySelector('.stage__sub')?.getBoundingClientRect();
    const air = readout ? new DOMPoint(0, readout.bottom + 8).matrixTransform(inv).y : undefined;
    engine.steer(pt.x, pt.y, { top: tl.y, left: tl.x, right: br.x, air });
  };

  // feathers burst out on impact, then drift down slowly, swaying, and settle on the water
  const feathers =
    ph === 'crashed' && !quiet && h >= 0 && h < 2.8
      ? Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2 + 0.3;
          const burst = (40 + (i % 3) * 22) * (1 - Math.exp(-h * 7));
          const sway = Math.sin(h * 3 + i) * 12 * Math.min(1, h * 2);
          return {
            x: s.crashX + ux * 30 * (1 - Math.exp(-h * 5)) + Math.cos(a) * burst + sway,
            y: Math.min(SURFACE - 2, s.crashY + Math.sin(a) * burst * 0.6 + h * 60),
            r: i * 30 + Math.sin(h * 3 + i) * 45,
            k: 0.6 + (i % 3) * 0.25,
            fill: FEATHER_FILLS[i % FEATHER_FILLS.length],
            o: Math.max(0, 1 - h / 2.8),
          };
        })
      : [];

  // --- the shot: a tracer with a spread of pellets from the muzzle to the duck ---
  let shot: { hx: number; hy: number; sx: number; sy: number; fade: number } | null = null;
  if (ph === 'crashed' && !quiet && h < 0.35) {
    const p = Math.min(1, e / SHOT_TRAVEL);
    const q = Math.max(0, p - 0.4);
    shot = {
      hx: mz.x + (s.crashX - mz.x) * p,
      hy: mz.y + (s.crashY - mz.y) * p,
      sx: mz.x + (s.crashX - mz.x) * q,
      sy: mz.y + (s.crashY - mz.y) * q,
      fade: h < 0 ? 1 : Math.max(0, 1 - h / 0.35),
    };
  }

  const shake = ph === 'crashed' && !quiet && e < 0.45 ? 1 - e / 0.45 : 0;
  const shakeX = shake ? (Math.random() - 0.5) * 16 * shake : 0;
  const shakeY = shake ? (Math.random() - 0.5) * 12 * shake : 0;
  const danger = ph === 'flying' ? Math.min(0.42, (Math.log(m) / Math.log(60)) * 0.42) : 0;
  const ring = sightRadius(m);

  // --- thin air: the duck's oxygen while it is up in the night band (meter in the read-out) ---
  const thin = ph === 'flying' && s.steering && s.duckY < s.airLine;
  // ...and low over the lake, the crocodile's patience
  const low = ph === 'flying' && s.steering && s.duckY > CROC_LINE;
  const zoneLeft = thin ? s.air : low ? s.croc : 1;
  const meterColor = zoneLeft < 0.4 ? '#ff6a5c' : zoneLeft < 0.7 ? '#f2b84b' : thin ? '#6cc4ff' : '#5fd3a0';
  // phones draw the scene small, so the zone labels are drawn larger there
  const k = fit === 'phone' ? 1.8 : 1;

  // --- overlay copy ---------------------------------------------------------
  const live = s.slots.filter((x) => x.bet && x.bet.cashedAt === null);
  const stake = live.reduce((sum, x) => sum + (x.bet?.amount ?? 0), 0);
  let kicker: string, kickerClass: string, sub: string;
  if (ph === 'waiting') {
    kicker = 'Place your bets';
    kickerClass = 'kicker--gold';
    sub = `The duck takes off in ${waitLeft.toFixed(1)}s`;
  } else if (ph === 'flying') {
    kicker = 'Duck in flight';
    kickerClass = 'kicker--game';
    sub = thin
      ? `Thin air! ${(s.air * AIR_SECONDS).toFixed(1)}s left · fly lower!`
      : low
        ? `Croc below! ${(s.croc * CROC_SECONDS).toFixed(1)}s · fly higher!`
        : live.length
      ? `Your ${fmt(stake)} is worth ${fmt(stake * m)}`
      : s.steering
        ? 'Keep out of his sights!'
        : 'Move your cursor to steer the duck';
  } else {
    kicker = croc ? 'Snapped up' : faint ? 'Out of air' : 'Shot down';
    kickerClass = 'kicker--loss';
    sub = `Next round in ${Math.max(0, HOLD_MS / 1000 - e).toFixed(1)}s`;
  }
  const results = ph === 'waiting' ? [] : s.slots.filter((x) => x.result).map((x) => x.result!);

  const be = (now - s.burstAt) / 1300;
  const coins =
    s.burstAt && be >= 0 && be < 1
      ? Array.from({ length: 16 }, (_, j) => {
          const a = (j / 16) * Math.PI * 2 + 0.3;
          const d = (70 + (j % 4) * 30) * Math.min(1, be * 2.4);
          return { x: Math.cos(a) * d, y: Math.sin(a) * d * 0.7 + 240 * be * be, o: 1 - be, r: (j * 47 + be * 720) % 360 };
        })
      : [];
  const cel = s.celebrate && now - s.celebrate.at < 3000 ? s.celebrate : null;

  const gauge = Math.min(100, (Math.log(Math.max(1, m)) / Math.log(100)) * 100);

  return (
    <section
      className={`stage${ph === 'flying' ? ' stage--steer' : ''}`}
      aria-label="Game stage"
      onPointerMove={steer}
      onPointerDown={steer}
    >
      <div className="stage__camera" style={{ transform: `translate(${shakeX}px, ${shakeY}px)` }}>
        <svg
          ref={svgRef}
          className="stage__svg"
          viewBox={fit === 'phone' ? `${PHONE_VIEW.x} 0 ${PHONE_VIEW.w} ${PHONE_VIEW.h}` : '0 0 1000 560'}
          preserveAspectRatio={`xMidYMax ${fit === 'slice' ? 'slice' : 'meet'}`}
          role="img"
          aria-label="Sir Reginald, a portly English gentleman, aims his shotgun at a duck over a marsh at sunset"
        >
          <SceneSky top={skyTop} />
          <Clouds x={s.cloudX} />
          <SceneLand />
          {ph === 'waiting' && (
            <g>
              <ellipse className="ripple" cx={DUCK_START.x} cy={DUCK_START.y + 8} rx="46" ry="5" fill="none" stroke="#ffcf80" strokeWidth="1.5" />
              <ellipse className="ripple" cx={DUCK_START.x} cy={DUCK_START.y + 8} rx="46" ry="5" fill="none" stroke="#ffcf80" strokeWidth="1.5" style={{ animationDelay: '1.2s' }} />
            </g>
          )}
          {ph === 'flying' && m > 3 && (
            <g stroke="#fff3d6" strokeLinecap="round" opacity={Math.min(0.6, (m - 3) / 10)} transform={`translate(${dx} ${dy}) scale(${faceRef.current} 1)`}>
              <path d="M-70 -6 h-40 M-64 6 h-56 M-76 16 h-30" strokeWidth="2" />
            </g>
          )}
          <defs>
            <clipPath id={clipId}>
              <rect x="-200" y="-200" width="1400" height={SURFACE + 200} />
            </clipPath>
          </defs>
          {!eaten && (
            <g clipPath={ph === 'crashed' ? `url(#${clipId})` : undefined}>
              <g transform={`translate(${dx.toFixed(1)} ${dy.toFixed(1)}) scale(${(ph === 'flying' ? faceRef.current : 1) * dk} ${dk}) rotate(${rot.toFixed(1)})`}>
                <Duck state={duckState} />
              </g>
            </g>
          )}
          {/* the croc leaping for the fallen duck, out of the water and back in */}
          {leap && (
            <g clipPath={`url(#${clipId})`}>
              <g transform={`translate(${leap.x.toFixed(1)} ${leap.y.toFixed(1)}) scale(${leapDir * leapK} ${leapK}) rotate(${leap.a.toFixed(1)})`}>
                <CrocLeaper open={leap.open} />
              </g>
            </g>
          )}
          {/* the crocodile surfacing under a duck that lingers low over the lake */}
          {ph === 'flying' && s.croc < 1 && (
            <g
              transform={`translate(${Math.min(960, Math.max(450, s.duckX - 12)).toFixed(1)} ${(SURFACE - 1 + s.croc * 5).toFixed(1)})`}
              opacity={Math.min(1, (1 - s.croc) * 4)}
            >
              <ellipse rx={56 + (1 - s.croc) * 20} ry="5" fill="none" stroke="#cfe6ff" strokeWidth="1.2" opacity=".35" />
              <g transform={`scale(${1.5 * ck})`}>
                <CrocLurk />
              </g>
            </g>
          )}
          {/* splashes: where the duck (or the lunging croc) hit the water, and the leaping croc out and back in */}
          {death && hs >= 0 && <Splash x={death.lx} t={hs} />}
          {death && !croc && <Splash x={leapFromX} t={leapT - 0.1} size={1.1} />}
          {death && !croc && <Splash x={death.lx} t={leapT - CROC_LEAP_TIME * 0.98} size={1.6} />}
          {/* bubbles rising where it went under */}
          {death &&
            [0, 1, 2, 3, 4].map((k) => {
              const p = (hs - (croc ? 0.9 : CROC_LEAP_START + CROC_LEAP_TIME + 0.25) - k * 0.28) / 0.35;
              if (p < 0 || p > 1) return null;
              return (
                <circle key={k} cx={death.lx + [-8, 6, -2, 10, 1][k]} cy={SURFACE - 1 - p * 3} r={1 + p * 3} fill="none" stroke="#e8f3ff" strokeWidth="1.2" opacity={1 - p} />
              );
            })}
          {/* the lunging head goes over its own splash */}
          {crocHead && (
            <g clipPath={`url(#${clipId})`}>
              <g transform={`translate(${crocHead.x.toFixed(1)} ${crocHead.y.toFixed(1)}) rotate(${crocHead.a.toFixed(1)}) scale(${CROC_SCALE * ck})`}>
                <CrocHead open={crocHead.open} />
              </g>
            </g>
          )}
          {missLine && (
            <g strokeLinecap="round" opacity={1 - me / 0.35}>
              <line {...missLine} stroke="#ffcf6a" strokeWidth="6" opacity=".3" />
              <line {...missLine} stroke="#fff6d6" strokeWidth="1.8" />
            </g>
          )}
          {lastMiss && me < 0.9 && (
            <text
              x={lastMiss.x}
              y={lastMiss.y - 30 - me * 40}
              textAnchor="middle"
              className="miss-pop"
              opacity={1 - me / 0.9}
            >
              MISS!
            </text>
          )}
          {ph === 'flying' && (
            <g transform={`translate(${s.aimX.toFixed(1)} ${s.aimY.toFixed(1)})`} opacity=".9">
              {/* rotating bezel: four arcs with notches */}
              <g className="reticle">
                <circle r="52" fill="none" stroke="rgba(5, 8, 16, 0.45)" strokeWidth="5" strokeDasharray="56 25.7" />
                <circle r="52" fill="none" style={{ stroke: 'var(--game)' }} strokeWidth="2.2" strokeDasharray="56 25.7" />
              </g>
              {/* inner ring tightens as the multiplier climbs: he's locking on */}
              <circle r={ring} fill="none" stroke="rgba(5, 8, 16, 0.4)" strokeWidth="4" />
              <circle r={ring} fill="none" stroke="#fff1c4" strokeWidth="1.3" />
              {/* crosshair with a clear centre, plus range ticks */}
              <g strokeLinecap="round">
                <path d="M-66 0 H-20 M20 0 H66 M0 -66 V-20 M0 20 V66" stroke="rgba(5, 8, 16, 0.45)" strokeWidth="4" />
                <path d="M-66 0 H-20 M20 0 H66 M0 -66 V-20 M0 20 V66" stroke="#fff1c4" strokeWidth="1.6" />
                <path d="M-30 -3.5 V3.5 M30 -3.5 V3.5 M-3.5 -30 H3.5 M-3.5 30 H3.5" stroke="#fff1c4" strokeWidth="1.4" />
              </g>
              <circle r="2.6" fill="rgba(5, 8, 16, 0.5)" />
              <circle r="1.6" style={{ fill: 'var(--game)' }} />
            </g>
          )}
          {/* zone marks: the thin air at the top of the sky, and the crocodile's water at the bottom */}
          {ph === 'flying' && s.steering && (
            <g opacity=".6">
              <text x={14 * k} y={s.airLine - 7 * k} className="air-label" style={{ fontSize: 11 * k }}>
                THIN AIR
              </text>
              <text x={1000 - 14 * k} y={CROC_LINE + 4 * k} textAnchor="end" className="croc-label" style={{ fontSize: 11 * k }}>
                CROC WATER
              </text>
            </g>
          )}
          {feathers.map((f, i) => (
            <g key={i} transform={`translate(${f.x.toFixed(1)} ${f.y.toFixed(1)}) rotate(${f.r.toFixed(0)}) scale(${f.k})`} opacity={f.o}>
              <path d="M-9 0 C-4 -5 6 -5 10 0 C6 4 -4 4 -9 0 Z" fill={f.fill} />
              <path d="M-9 0 L10 0" stroke="#6b4c31" strokeWidth="1" />
            </g>
          ))}
          {shot && (
            <g strokeLinecap="round" opacity={shot.fade}>
              {/* faint smoke line left along the whole path */}
              <line x1={mz.x} y1={mz.y} x2={shot.hx} y2={shot.hy} stroke="#fff1c4" strokeWidth="1.2" opacity=".35" />
              {h < 0 && (
                <g>
                  <line x1={shot.sx} y1={shot.sy} x2={shot.hx} y2={shot.hy} stroke="#ffcf6a" strokeWidth="7" opacity=".35" />
                  <line x1={shot.sx} y1={shot.sy} x2={shot.hx} y2={shot.hy} stroke="#fff6d6" strokeWidth="2.2" />
                  <circle cx={shot.hx} cy={shot.hy} r="4" fill="#fff" />
                  {/* pellets spread out from the shot line as they travel */}
                  {[-1, -0.5, 0.5, 1].map((k, i) => {
                    const spread = 9 * Math.min(1, e / SHOT_TRAVEL) * k;
                    const back = (i % 2) * 10;
                    return <circle key={k} cx={shot!.hx - ux * back - uy * spread} cy={shot!.hy - uy * back + ux * spread} r="2" fill="#ffe7a6" />;
                  })}
                </g>
              )}
            </g>
          )}
          {ph === 'crashed' && !quiet && h >= 0 && h < 0.25 && (
            <g transform={`translate(${s.crashX} ${s.crashY}) scale(${0.6 + h * 3}) rotate(${h * 90})`} opacity={1 - h / 0.25}>
              <path d="M0 -26 L6 -8 L24 -12 L10 2 L20 20 L2 10 L-8 26 L-8 6 L-26 2 L-10 -6 Z" fill="#fff1c4" />
              <path d="M0 -14 L3 -4 L13 -6 L5 1 L10 11 L1 5 L-4 14 L-4 3 L-14 1 L-5 -3 Z" fill="#fff" />
            </g>
          )}
          {ph === 'crashed' && !quiet && h >= 0 && h < 0.7 && (
            <circle cx={s.crashX} cy={s.crashY} r={12 + h * 120} fill="none" stroke="#fff1c4" strokeWidth="3" opacity={1 - h / 0.7} />
          )}
          <SceneBank />
          <g transform={hunterTransform(hk)}>
            <Hunter
              mood={mood}
              aim={aim - kick * 4}
              recoil={-9 * kick}
              flash={(ph === 'crashed' && !quiet && e < 0.16) || me < 0.12}
              smoke={ph === 'crashed' && !quiet && e < 1.4 ? e / 1.4 : me < 1.4 ? me / 1.4 : -1}
              bubble={bubble}
              accent="#6cc4ff"
            />
          </g>
          <SceneForeground />
          {fit === 'phone' && <SceneNearShore />}
        </svg>
      </div>

      <div className="stage__vignette" aria-hidden="true" />
      <div className="stage__danger" aria-hidden="true" style={{ opacity: danger }} />
      <div className="stage__flash" aria-hidden="true" style={{ opacity: ph === 'crashed' && !quiet && e < 0.25 ? 0.45 * (1 - e / 0.25) : 0 }} />

      <div className="stage__center">
        <span className={`stage__kicker ${kickerClass}`}>{kicker}</span>
        <span className={`stage__mult num stage__mult--${ph}`}>{ph === 'waiting' ? '1.00×' : fmtX(m)}</span>
        {ph === 'waiting' && (
          <div className="countdown" aria-hidden="true">
            <div className="countdown__fill" style={{ width: `${100 - (waitLeft / (WAIT_MS / 1000)) * 100}%` }} />
          </div>
        )}
        <span className="stage__sub num">
          {(thin || low) && (
            <span className={`air-meter${zoneLeft < 0.4 ? ' air-low' : ''}`} aria-hidden="true">
              <i style={{ width: `${Math.max(0, zoneLeft) * 100}%`, background: meterColor }} />
            </span>
          )}
          {sub}
        </span>
        {results.map((r, i) => (
          <span key={i} className={`result num ${r.win ? 'result--win' : 'result--loss'}`}>
            {r.text}
          </span>
        ))}
      </div>

      {coins.map((c, i) => (
        <svg
          key={i}
          className="coin-burst"
          width="22"
          height="22"
          viewBox="0 0 22 22"
          aria-hidden="true"
          style={{ left: `calc(50% + ${c.x - 11}px)`, top: `calc(26% + ${c.y}px)`, opacity: c.o, transform: `rotate(${c.r}deg)` }}
        >
          <circle cx="11" cy="11" r="10" fill="#e9c46a" stroke="#8a6420" strokeWidth="1.4" />
          <circle cx="11" cy="11" r="6.4" fill="none" stroke="#fff1c4" strokeWidth="1.2" />
          <circle cx="8" cy="7" r="1.6" fill="#fff8de" />
        </svg>
      ))}

      {cel && (
        <div className="celebrate" aria-live="polite">
          <svg className="celebrate__rays" width="440" height="440" viewBox="0 0 420 420" aria-hidden="true">
            <g fill="#f4d78e" opacity=".35">
              {Array.from({ length: 8 }, (_, i) => (
                <path key={i} d="M210 210 L200 0 L220 0 Z" transform={`rotate(${i * 45} 210 210)`} />
              ))}
            </g>
          </svg>
          <div className="celebrate__plaque">
            <span className="celebrate__label">{cel.label}</span>
            <span className="celebrate__total num">+{fmt(cel.total * Math.min(1, (now - cel.at) / 1000))}</span>
            <span className="celebrate__at">collected at {fmtX(cel.mult)}</span>
          </div>
        </div>
      )}

      <div className="gauge">
        <span className="gauge__label">Altitude</span>
        <div className="gauge__track">
          <div className="gauge__fill" style={{ width: `${gauge}%` }} />
          <span className="gauge__tick" style={{ left: '15%' }} />
          <span className="gauge__tick" style={{ left: '50%' }} />
        </div>
        <span className="gauge__scale num">2× · 10× · 100×</span>
      </div>
    </section>
  );
}
