/** Small illustrated assets: casino chips, the credit coin and the game logo. */

export const CHIP_COLORS: Record<number, [string, string]> = {
  10: ['#2f7de1', '#2466bd'],
  50: ['#d23c3c', '#a92b2b'],
  100: ['#1f9a5a', '#157a45'],
  500: ['#6a3fc8', '#5430a3'],
};

export function Chip({ value, size = 46 }: { value: number; size?: number }) {
  const [outer, inner] = CHIP_COLORS[value] ?? ['#555', '#333'];
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 44 44" aria-hidden="true">
      <circle cx="22" cy="22" r="20" fill={outer} />
      <circle cx="22" cy="22" r="20" fill="none" stroke="#fff" strokeWidth="4" strokeDasharray="6 9.7" opacity=".92" />
      <circle cx="22" cy="22" r="13.5" fill={inner} stroke="rgba(255,255,255,.6)" strokeWidth="1.2" strokeDasharray="2 2" />
      <path d="M9 14 A16 16 0 0 1 22 6" stroke="#fff" strokeWidth="1.4" fill="none" opacity=".35" strokeLinecap="round" />
      <text x="22" y="26" textAnchor="middle" fontFamily="Oxanium, sans-serif" fontWeight="800" fontSize="11" fill="#fff">
        {value}
      </text>
    </svg>
  );
}

export function Coin({ size = 24 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="10.5" fill="#d9b45a" stroke="#8a6420" strokeWidth="1.2" />
      <circle cx="12" cy="12" r="7.2" fill="none" stroke="#fff1c4" strokeWidth="1.2" opacity=".8" />
      <path d="M12 7.5l1.3 2.8 3 .3-2.3 2 .7 3-2.7-1.6-2.7 1.6.7-3-2.3-2 3-.3z" fill="#8a6420" />
      <path d="M5.5 9 A7 7 0 0 1 10 4.6" stroke="#fff8de" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity=".8" />
    </svg>
  );
}

/** Scope reticle crest used as the game mark. */
export function Logo({ size = 44, accent = '#6cc4ff' }: { size?: number; accent?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 44 44" aria-hidden="true">
      <circle cx="22" cy="22" r="20" fill="#11151d" stroke={accent} strokeWidth="1.5" />
      <circle cx="22" cy="22" r="11" fill="none" stroke="#f4d78e" strokeWidth="1.6" />
      <path d="M22 4v8M22 32v8M4 22h8M32 22h8" stroke="#f4d78e" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M17 24 c2 -4 7 -5 10 -2 c1 1 3 1 4 0 c-1 3 -3 4 -5 4 c-3 1 -7 0 -9 -2 Z" fill="#4fd6c8" />
      <circle cx="22" cy="22" r="1.6" fill="#ff6a5c" />
    </svg>
  );
}
