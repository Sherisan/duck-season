import { useId } from 'react';

export type DuckState = 'float' | 'fly' | 'hit';

/** Mallow the mallard, centred on (0, 0), facing right. Place it with a transform. */
export function Duck({ state }: { state: DuckState }) {
  const id = useId().replace(/:/g, '');
  const u = (n: string) => `url(#${id}-${n})`;
  const flying = state === 'fly';

  return (
    <g className="duck">
      <defs>
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#cdb08a" />
          <stop offset="1" stopColor="#6b4c31" />
        </linearGradient>
        <linearGradient id={`${id}-head`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4fd6c8" />
          <stop offset=".5" stopColor="#1f8a8a" />
          <stop offset="1" stopColor="#123f5a" />
        </linearGradient>
        <linearGradient id={`${id}-scarf`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#a92b2b" />
          <stop offset="1" stopColor="#e04848" />
        </linearGradient>
      </defs>

      {/* far wing */}
      {flying && (
        <g className="wing wing-far">
          <path d="M-10 -8 C-6 -38 12 -48 26 -42 C20 -34 14 -24 10 -8 Z" fill="#6e5238" />
        </g>
      )}

      {/* tail with the drake curl */}
      <path d="M-28 -2 L-48 -9 C-51 -3 -51 4 -48 8 Z" fill="#2b2420" />
      <path d="M-31 0 L-43 -4 L-43 3 Z" fill="#ebe5da" />
      <path d="M-34 -6 C-37 -13 -31 -16 -29 -11" stroke="#1d1a18" strokeWidth="2.2" fill="none" strokeLinecap="round" />

      {/* scarf tail, streaming back above the tail */}
      <g className={flying ? 'scarf' : undefined}>
        <path d="M14 -14 C0 -22 -18 -22 -38 -34 L-42 -25 C-24 -14 -6 -10 12 -6 Z" fill={u('scarf')} />
        <path d="M-6 -19 L-9 -11 M-20 -22 L-24 -14 M-32 -28 L-36 -21" stroke="#fff3e0" strokeWidth="3" />
      </g>

      {/* body */}
      <ellipse cx="0" cy="0" rx="31" ry="17" fill={u('body')} stroke="#ffcf8a" strokeOpacity=".55" strokeWidth="1.5" />
      <ellipse cx="2" cy="7" rx="22" ry="8" fill="#d8cdbb" />
      <path d="M-14 4 q4 -2 8 0 q4 2 8 0 M-12 9 q4 -2 8 0 q4 2 8 0 M-4 -2 q4 -2 8 0 q4 2 8 0" stroke="#a89880" strokeWidth=".8" fill="none" opacity=".7" />
      <ellipse cx="19" cy="1" rx="12" ry="12" fill="#7a3c26" />

      {/* scarf knot */}
      <path d="M12 -15 C20 -9 30 -9 36 -15 L34 -8 C28 -3 18 -3 12 -8 Z" fill={u('scarf')} />
      <path d="M18 -13 L17 -6 M26 -12 L26 -5" stroke="#fff3e0" strokeWidth="2.4" />

      {/* head */}
      <circle cx="30" cy="-22" r="13" fill={u('head')} stroke="#ffcf8a" strokeOpacity=".5" strokeWidth="1.2" />
      <path d="M22 -30 C26 -34 32 -34 36 -31" stroke="#fff" strokeWidth="1.6" fill="none" opacity=".4" strokeLinecap="round" />
      <path d="M41 -22 C52 -25 61 -21 61 -17 C56 -13 47 -13 41 -16 Z" fill="#ffb02e" stroke="#c97a10" strokeWidth="1" />
      <path d="M57 -21 C60 -20 61 -18 61 -17 C59 -16 58 -16 57 -17 Z" fill="#7a4a12" />
      <circle cx="47" cy="-20" r=".9" fill="#7a4a12" />

      {state === 'hit' ? (
        <g>
          <path d="M31 -28 L37 -22 M37 -28 L31 -22" stroke="#0a0a0a" strokeWidth="2" strokeLinecap="round" />
          <g className="dizzy" fill="#f4d78e">
            <path d="M20 -48 l2 4 4 .5 -3 3 1 4 -4 -2 -4 2 1 -4 -3 -3 4 -.5 Z" />
            <path d="M40 -52 l1.6 3 3 .4 -2.3 2 .7 3 -3 -1.5 -3 1.5 .7 -3 -2.3 -2 3 -.4 Z" />
          </g>
        </g>
      ) : (
        <g>
          <ellipse cx="34.5" cy="-24.5" rx="3.6" ry="3.8" fill="#fff" />
          <circle cx="35.5" cy="-24.5" r="2.4" fill="#0a0a0a" />
          <circle cx="36.3" cy="-25.4" r=".8" fill="#fff" />
          {flying && <path d="M30 -30 L39 -28.5" stroke="#0e2a33" strokeWidth="2" strokeLinecap="round" />}
        </g>
      )}

      {/* near wing */}
      {state === 'float' ? (
        <path d="M-20 -4 C-10 -12 12 -12 22 -4 C12 2 -8 4 -20 -4 Z" fill="#8f6c4b" stroke="#5a4130" strokeWidth="1" />
      ) : (
        <g className={flying ? 'wing wing-near' : 'wing'}>
          <path
            d="M-18 -6 C-12 -40 10 -54 30 -44 C26 -40 22 -38 18 -36 C20 -32 16 -28 12 -26 C12 -20 8 -14 6 -6 Z"
            fill="#93704e"
            stroke="#5a4130"
            strokeWidth="1.2"
          />
          <path d="M-6 -14 L8 -28" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" />
          <path d="M-6 -14 L8 -28" stroke="#3c6fe0" strokeWidth="3.6" strokeLinecap="round" />
          <path d="M-12 -12 L4 -34 M-2 -10 L14 -34" stroke="#5a4130" strokeWidth=".8" opacity=".6" />
        </g>
      )}

      {/* feet */}
      {state !== 'float' && <path d="M-6 15 l-6 6 M2 15 l-5 7" stroke="#ff9a2e" strokeWidth="3" strokeLinecap="round" />}
    </g>
  );
}

export function DuckArt({ state = 'fly', width = 200 }: { state?: DuckState; width?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="-66 -66 136 96" width={width} height={(width * 96) / 136} role="img" aria-label="Mallow the duck">
      <Duck state={state} />
    </svg>
  );
}
