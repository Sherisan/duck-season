const NBSP = ' ';

/** Credits in en-ZA style: 10 000,00 */
export function fmt(n: number): string {
  const neg = n < 0;
  const [int, dec] = Math.abs(n).toFixed(2).split('.');
  return (neg ? '−' : '') + int.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP) + ',' + dec;
}

export function fmtSigned(n: number): string {
  return (n > 0 ? '+' : '') + fmt(n);
}

/** Multiplier: two decimals, whole number from 100× up. */
export function fmtX(m: number): string {
  return m >= 100 ? `${Math.floor(m)}×` : `${m.toFixed(2)}×`;
}

/** Parses "1 250,50" or "1250.5". Returns NaN when it can't. */
export function parseNum(s: string | null | undefined): number {
  const v = parseFloat(String(s ?? '').replace(/[\s ]/g, '').replace(',', '.'));
  return Number.isFinite(v) ? v : NaN;
}

export function parseAmount(s: string): number {
  const v = parseNum(s);
  return Number.isFinite(v) && v > 0 ? Math.round(v * 100) / 100 : 0;
}
