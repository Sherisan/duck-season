/** Pure game maths shared by the engine and the stage. */

export const WAIT_MS = 5000;
export const HOLD_MS = 3400;
export const GROWTH = 0.11;
export const HOUSE_EDGE = 0.01;
export const MAX_MULT = 10000;
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

/** Where the duck is in scene coordinates (viewBox 0 0 1000 560). */
export function duckPosition(m: number, t: number): { x: number; y: number } {
  const p = Math.min(1, Math.log(m) / Math.log(12));
  return { x: 470 + p * 330, y: 400 - p * 280 + Math.sin(t * 4.2) * 6 };
}

/** Must match the rotate() pivot in art/Hunter.tsx. */
export const GUN_PIVOT = { x: 205, y: 372 };

/** Gun angle in degrees for a target point, clamped to a natural range. */
export function aimAngle(x: number, y: number): number {
  const a = (Math.atan2(y - GUN_PIVOT.y, x - GUN_PIVOT.x) * 180) / Math.PI;
  return Math.max(-40, Math.min(-4, a));
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
