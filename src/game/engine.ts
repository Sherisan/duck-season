/** Pure game maths shared by the engine and the stage. */

export const WAIT_MS = 5000;
export const HOLD_MS = 3400;
export const GROWTH = 0.11;
export const HOUSE_EDGE = 0.01;
export const MAX_MULT = 10000;
/** Smallest stake, and the lowest auto cash-out target. */
export const MIN_BET = 0.1;
export const MIN_CASHOUT = 1.01;
export const START_BALANCE = 10000;

/** Multiplier after t seconds of flight (floored to 2 decimals). */
export function multiplierAt(t: number): number {
  return Math.floor(Math.exp(GROWTH * t) * 100) / 100;
}

/** Seconds of flight needed to reach multiplier m. */
export function timeFor(m: number): number {
  return Math.log(m) / GROWTH;
}

/** Crash point from a uniform r in [0, 1): max(1, 0.99 / (1 - r)). */
export function crashFromUniform(r: number): number {
  return Math.min(MAX_MULT, Math.max(1, Math.floor(((1 - HOUSE_EDGE) / (1 - r)) * 100) / 100));
}

/** Uses the first 52 bits of a hex digest as r. */
export function crashFromHash(hex: string): number {
  const r = parseInt(hex.slice(0, 13), 16) / 2 ** 52;
  return crashFromUniform(r);
}

/** Where the duck floats before take-off: on the water just in front of the hunter. */
export const DUCK_START = { x: 450, y: 468 };

/** Where the duck is in scene coordinates (viewBox 0 0 1000 560). It lifts off from DUCK_START. */
export function duckPosition(m: number, t: number): { x: number; y: number } {
  const p = Math.min(1, Math.log(m) / Math.log(12));
  return { x: DUCK_START.x + p * 350, y: DUCK_START.y - 16 - p * 332 + Math.sin(t * 4.2) * 6 };
}

/**
 * Hunter size on stage (1 = as drawn): larger on phones, which draw the whole scene small, than
 * on wider screens. He scales around his feet so he stays on the bank.
 */
export const HUNTER_SCALE = 0.975;
export const HUNTER_SCALE_WIDE = 0.72;
export const HUNTER_FEET = { x: 182, y: 547 };
/** Sideways nudge for the hunter after scaling (negative = left). */
export const HUNTER_SHIFT = -90;

/** SVG transform that places art/Hunter.tsx (drawn at full size) on the stage at size k. */
export function hunterTransform(k = HUNTER_SCALE): string {
  return `translate(${HUNTER_FEET.x + HUNTER_SHIFT} ${HUNTER_FEET.y}) scale(${k}) translate(${-HUNTER_FEET.x} ${-HUNTER_FEET.y})`;
}

/** A point in the hunter's own drawing, in scene coordinates, with him at size k. */
function hunterToScene(x: number, y: number, k: number) {
  return { x: HUNTER_FEET.x + HUNTER_SHIFT + (x - HUNTER_FEET.x) * k, y: HUNTER_FEET.y + (y - HUNTER_FEET.y) * k };
}

/** The rotate() pivot in art/Hunter.tsx (205, 372), in scene coordinates. */
function gunPivot(k: number) {
  return hunterToScene(205, 372, k);
}

/** Muzzle tip in scene coordinates for a gun angle (art/Hunter.tsx draws it at (450, 365) before aiming). */
export function muzzlePosition(aimDeg: number, k = HUNTER_SCALE): { x: number; y: number } {
  const a = (aimDeg * Math.PI) / 180;
  const vx = 450 - 205;
  const vy = 365 - 372;
  return hunterToScene(205 + vx * Math.cos(a) - vy * Math.sin(a), 372 + vx * Math.sin(a) + vy * Math.cos(a), k);
}

/** Radius of the hunter's inner sight ring at multiplier m. The duck is hit if it is inside it when he fires. */
export function sightRadius(m: number): number {
  return 44 - Math.min(0.42, (Math.log(m) / Math.log(60)) * 0.42) * 24;
}

/** How quickly the sight closes in on the duck (per second). Faster at high multipliers and after each miss. */
export function trackRate(m: number, misses: number): number {
  return 1.3 + 2.6 * Math.min(1, Math.log(m) / Math.log(20)) + misses * 0.9;
}

/**
 * Seconds until his next shot: the first comes 1.4–3s after take-off, then 1.1–2.4s after each miss.
 * r is a uniform draw from the round's seeded generator, so shot times are fixed in advance too.
 */
export function shotGap(r: number, first: boolean): number {
  return first ? 1.4 + r * 1.6 : 1.1 + r * 1.3;
}

/** Deterministic generator for a round's shot times, seeded from its server seed and nonce. */
export function shotRandom(serverSeed: string, nonce: number): () => number {
  let h = 2166136261;
  for (const ch of `${serverSeed}:${nonce}`) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Where the player can steer the duck: open sky, clear of the water, and above the hunter's hat on the left. */
export const SKY = { minX: 40, maxX: 960, minY: 60, maxY: 440 };
export const SKY_OVER_HUNTER = { maxX: 380, maxY: 190 };

/** Seconds the steered duck can stay low over the lake before the crocodile gets it, and to calm it. */
export const CROC_SECONDS = 0.75;
export const CROC_CALM_SECONDS = 1.5;
/** After a shot or fainted duck lands in the lake, the croc leaps for it: when (s after the splash) and how long in the air. */
export const CROC_LEAP_START = 0.25;
export const CROC_LEAP_TIME = 0.8;
/** Scene y below which the duck is close enough to the water for the crocodile. */
export const CROC_LINE = 380;

/** Seconds of air the steered duck has in the thin air of the night sky, and to fully recover below it. */
export const AIR_SECONDS = 5;
export const AIR_REFILL_SECONDS = 2;

/**
 * Scene y below which the air is fine: the bottom of the dark night band at the top of the sky
 * (the sky gradient's first stop), where `top` is the top of the visible sky.
 */
export function airLine(top: number): number {
  return top + 0.22 * (560 - top);
}
/** Top speed of the steered duck, in scene units per second. */
export const DUCK_SPEED = 620;

/** Gun angle in degrees for a target point, clamped to a natural range. */
export function aimAngle(x: number, y: number, k = HUNTER_SCALE): number {
  const pivot = gunPivot(k);
  const a = (Math.atan2(y - pivot.y, x - pivot.x) * 180) / Math.PI;
  return Math.max(-58, Math.min(-4, a));
}

export function winTier(m: number): string | null {
  if (m >= 25) return 'Mega win';
  if (m >= 10) return 'Huge win';
  if (m >= 5) return 'Big win';
  return null;
}

export function chanceFor(target: number): number {
  return ((1 - HOUSE_EDGE) / target) * 100;
}

/** Seconds the shot takes to reach the duck. Long enough to see the tracer. */
export const SHOT_TRAVEL = 0.16;
/** Where the duck meets the lake. */
export const SURFACE = DUCK_START.y + 8;
export const GRAVITY = 900;

/** Seconds a duck hit at height cy, knocked along a shot with vertical direction uy, takes to reach the water. */
export function fallTime(cy: number, uy: number): number {
  const vy = uy * 120 - 30;
  return (-vy + Math.sqrt(vy * vy + 2 * GRAVITY * Math.max(0, SURFACE - 6 - cy))) / GRAVITY;
}

/** Seconds from the shot until a duck hit at (x, y) splashes into the lake. */
export function splashDelay(x: number, y: number, k = HUNTER_SCALE): number {
  const mz = muzzlePosition(aimAngle(x, y, k), k);
  const uy = (y - mz.y) / (Math.hypot(x - mz.x, y - mz.y) || 1);
  return SHOT_TRAVEL + fallTime(y, uy);
}
