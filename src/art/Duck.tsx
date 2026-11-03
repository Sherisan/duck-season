import { useId } from 'react';

export type DuckState = 'float' | 'fly' | 'hit';

const BODY = 'M-46 -4 C-36 -13 -14 -16 8 -16 C22 -16 31 -10 33 -1 C35 8 29 15 18 17.5 C4 20 -14 19 -28 14 C-38 10 -44 4 -46 -4 Z';
const HEAD = 'M23 -30 C23 -38 29 -43 36 -42.5 C42 -42 46 -38 46.5 -33 C47 -30 46 -27.5 44 -26 C40 -23 34 -21 28 -21 C25 -22 23 -26 23 -30 Z';
const NEAR_WING =
  'M14 -10 C10 -26 2 -42 -8 -54 C-12 -59 -18 -62 -25 -63 C-21 -59 -19 -56 -18 -53 C-22 -52.5 -24 -50.5 -24 -47.5 C-20 -46.5 -17 -44.5 -16 -42.5 C-20 -41.5 -21 -39 -20 -36.5 C-16 -35.5 -13 -33 -12 -30 C-15 -27 -15 -23 -13 -21 C-9 -19 -7 -15 -6 -10 Z';

/** Mallow the mallard drake, centred on (0, 0), facing right. Place it with a transform. */
export function Duck({ state }: { state: DuckState }) {
  const id = useId().replace(/:/g, '');
  const u = (n: string) => `url(#${id}-${n})`;
  const flying = state === 'fly';
  const hit = state === 'hit';

  const speculum = (d: string, edge: string) => (
    <g>
      <path d={d} fill={u('spec')} />
      <path d={edge} stroke="#f4f1ea" strokeWidth="1" fill="none" strokeLinecap="round" />
    </g>
  );

  return (
    <g className="duck">
      <defs>
        <linearGradient id={`${id}-flank`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e2ded6" />
          <stop offset=".6" stopColor="#bcb7ad" />
          <stop offset="1" stopColor="#8f897e" />
        </linearGradient>
        <pattern id={`${id}-verm`} width="4" height="2.4" patternUnits="userSpaceOnUse">
          <path d="M0 1.2 Q1 .4 2 1.2 T4 1.2" stroke="#7d776c" strokeWidth=".26" fill="none" />
        </pattern>
        <linearGradient id={`${id}-back`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8a7d6c" />
          <stop offset="1" stopColor="#5f5446" />
        </linearGradient>
        <linearGradient id={`${id}-breast`} x1="0" y1="0" x2=".4" y2="1">
          <stop offset="0" stopColor="#9a4a2c" />
          <stop offset=".55" stopColor="#6e2c1a" />
          <stop offset="1" stopColor="#3f170d" />
        </linearGradient>
        {/* iridescent head: green, blue-violet sheen on the crown */}
        <linearGradient id={`${id}-head`} x1=".2" y1="0" x2=".7" y2="1">
          <stop offset="0" stopColor="#4a63c8" />
          <stop offset=".25" stopColor="#1f9a6c" />
          <stop offset=".6" stopColor="#0f6650" />
          <stop offset="1" stopColor="#0a2c33" />
        </linearGradient>
        <linearGradient id={`${id}-bill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f1d65a" />
          <stop offset="1" stopColor="#c9a12a" />
        </linearGradient>
        <linearGradient id={`${id}-wing`} x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a69b8b" />
          <stop offset=".5" stopColor="#7d7262" />
          <stop offset="1" stopColor="#4f463b" />
        </linearGradient>
        <linearGradient id={`${id}-prim`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3c3530" />
          <stop offset="1" stopColor="#6a6058" />
        </linearGradient>
        <linearGradient id={`${id}-spec`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6f5ee6" />
          <stop offset=".5" stopColor="#2f56d8" />
          <stop offset="1" stopColor="#1b2f8a" />
        </linearGradient>
        <linearGradient id={`${id}-foot`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffa040" />
          <stop offset="1" stopColor="#d76a12" />
        </linearGradient>
        <clipPath id={`${id}-clip`}>
          <path d={BODY} />
        </clipPath>
        <clipPath id={`${id}-wclip`}>
          <path d={NEAR_WING} />
        </clipPath>
        <clipPath id={`${id}-sclip`}>
          <path d="M-20 -19 L-26 -37 L-11.5 -39 L-7 -20 Z" />
        </clipPath>
      </defs>

      {/* far wing, raised behind the body */}
      {flying && (
        <g className="wing wing-far">
          <path d={NEAR_WING} fill="#5a5045" transform="translate(9 2) scale(.92)" />
          <path d="M-6 -50 C-10 -55 -15 -58 -20 -59 L-12 -40 Z" fill="#3a332d" transform="translate(9 2) scale(.92)" />
        </g>
      )}

      {/* tail: pale outer feathers, black coverts and the drake's curl */}
      <path d="M-44 -6 L-60 -7 C-59 -2 -55 2 -50 3 L-41 1 Z" fill="#ece8e0" />
      <path d="M-58 -5.5 L-45 -4 M-56 -1.5 L-44 -1" stroke="#b9b2a5" strokeWidth=".7" />
      <path d="M-33 -12 C-40 -13 -47 -10 -51 -6 C-48 -2 -43 1 -37 2 C-35 -2 -33 -7 -33 -12 Z" fill="#17161a" />
      <path d="M-38 -12 C-42 -19 -36 -23 -33 -18" stroke="#1d1c22" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M-35 -12.5 C-37 -18 -32 -20 -30.5 -16.5" stroke="#26252c" strokeWidth="1.6" fill="none" strokeLinecap="round" />

      {/* body: vermiculated grey flanks, grey-brown back, chestnut breast */}
      <path d={BODY} fill={u('flank')} />
      <g clipPath={u('clip')}>
        <path d={BODY} fill={u('verm')} opacity=".38" />
        <path d="M-48 -6 C-30 -16 -4 -19 14 -17 L12 -9 C-6 -10 -26 -8 -46 -2 Z" fill={u('back')} />
        <path d="M-40 -2 C-36 -5 -34 -9 -33 -12 L-30 -11 C-31 -6 -33 -2 -36 1 Z" fill="#f2efe8" opacity=".8" />
        <path d="M10 -17 C24 -17 34 -9 34 0 C34 9 28 15 19 18 C22 9 21 0 14 -7 C11 -10 9 -13 10 -17 Z" fill={u('breast')} />
        <path d="M-44 6 C-24 18 6 22 30 12 L34 24 L-48 24 Z" fill="#2d2a33" opacity=".35" />
      </g>
      {/* warm light along the back and breast */}
      <path d="M-40 -10 C-26 -15 -4 -17 12 -16" stroke="#ffd3a0" strokeOpacity=".55" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      <path d="M26 -11 C32 -6 34 0 33 5" stroke="#ffb27a" strokeOpacity=".6" strokeWidth="1.3" fill="none" strokeLinecap="round" />

      {/* folded wing, tertials and primaries over the rump */}
      {state === 'float' && (
        <g>
          <path d="M18 -9 C8 -15 -14 -15 -30 -11 L-44 -12 C-38 -6 -30 -2 -18 0 C-4 1 10 -3 18 -9 Z" fill={u('wing')} />
          <path d="M-22 -9 L-44 -12 C-40 -8 -34 -5 -26 -3 Z" fill={u('prim')} />
          {speculum('M-16 -3 L2 -4.5 L1 -1 L-17 0.5 Z', 'M-17 -3.6 L3 -5.2 M-18 1.2 L2 -0.4')}
          <path d="M-8 -11 C0 -12.5 8 -12 14 -10 M-14 -7.5 C-4 -9 6 -8.5 12 -6.5" stroke="#5a5045" strokeWidth=".7" fill="none" opacity=".7" />
          <path d="M-28 -11.5 C-14 -14.5 4 -14.5 16 -10" stroke="#ffd3a0" strokeOpacity=".35" strokeWidth=".9" fill="none" />
        </g>
      )}

      {/* bill, under the head so the head overlaps its base */}
      {hit && <path d="M47 -27 C51 -24 54 -21 54.5 -18 C52 -17.5 48.5 -20 46 -23.5 Z" fill="#ff7a8a" stroke="#c94a5a" strokeWidth=".6" />}
      <path d="M43 -33 C49 -33 56 -31 61 -28.5 C63.5 -27 63 -25 60.5 -24.8 C54 -24.6 48 -25.6 43.5 -27 Z" fill={u('bill')} />
      {/* lower bill hangs open when shot */}
      <path
        d="M44 -26.5 C50 -25.4 56 -25 60 -24.9 C57 -22.6 50 -22.4 45 -24 Z"
        fill="#b8902a"
        transform={hit ? 'rotate(22 44 -25.5)' : undefined}
      />
      <path d="M59.5 -28.6 C62 -27.6 63.2 -26 62 -25 C60.6 -25 59.6 -26 59.5 -27.5 Z" fill="#3a3220" />
      <ellipse cx="49.5" cy="-30.4" rx="1.4" ry=".6" fill="#7a6420" />
      <path d="M44 -32 C50 -32.5 56 -31 60.5 -28.8" stroke="#fff6c8" strokeWidth=".8" fill="none" opacity=".7" />

      {/* neck and head */}
      <path d="M14 -16 C14 -22 18 -28 24 -32 L36 -24 C32 -20 28 -15 26 -10 Z" fill="#0e4f45" />
      <path d={HEAD} fill={u('head')} />
      <path d="M27 -39 C31 -42 37 -42.5 41 -41" stroke="#9fe0c8" strokeWidth="1.2" fill="none" opacity=".55" strokeLinecap="round" />
      <path d="M44.5 -35 C46.2 -32 46.3 -29 44.5 -26.5" stroke="#ffcf8a" strokeWidth="1.1" fill="none" opacity=".55" strokeLinecap="round" />
      {/* white collar */}
      <path d="M14.5 -15 C18 -13 24 -12 27.5 -13 L28.2 -10.6 C24 -9.4 18 -10 14 -12.2 Z" fill="#f6f3ec" />

      {hit ? (
        <g>
          {/* ruffled feathers and a closed eye */}
          <path d="M28 -41 l-3 -5 M33 -42.5 l-.5 -6 M38 -42 l2.5 -5" stroke="#1f9a6c" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M-20 -14 l-3 -5 M-12 -15.5 l0 -5 M-4 -16 l2.5 -4.5" stroke="#8a7d6c" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M34.5 -33.5 L40 -29 M40 -33.5 L34.5 -29" stroke="#0a0a0a" strokeWidth="1.6" strokeLinecap="round" />
          <g className="dizzy" fill="#f4d78e">
            <path d="M24 -52 l1.6 3.2 3.2 .4 -2.4 2.4 .8 3.2 -3.2 -1.6 -3.2 1.6 .8 -3.2 -2.4 -2.4 3.2 -.4 Z" />
            <path d="M42 -55 l1.3 2.4 2.4 .3 -1.8 1.6 .6 2.4 -2.5 -1.2 -2.5 1.2 .6 -2.4 -1.8 -1.6 2.4 -.3 Z" />
          </g>
        </g>
      ) : (
        <g>
          <circle cx="37.4" cy="-32.6" r="2.5" fill="#3a2414" />
          <circle cx="37.6" cy="-32.6" r="1.7" fill="#0b0806" />
          <circle cx="38.4" cy="-33.5" r=".7" fill="#fff" />
          <path
            d={flying ? 'M33.8 -35.4 C36 -36.4 39 -36.2 41 -34.8' : 'M34 -35.2 C36 -36 39 -35.8 40.8 -34.6'}
            stroke="#0a3a32"
            strokeWidth=".9"
            fill="none"
            strokeLinecap="round"
          />
        </g>
      )}

      {/* near wing */}
      {hit ? (
        /* limp wing flopping down off the back, feathers splayed */
        <g>
          <path
            d="M-16 -9 C-6 -12 8 -12 14 -7 C13 3 7 14 -1 24 C-3 20 -5 20 -7 22 C-8 17 -10 16 -13 18 C-13 12 -15 10 -18 11 C-17 4 -18 -3 -16 -9 Z"
            fill={u('wing')}
          />
          <path d="M-1 24 C-3 20 -5 20 -7 22 C-8 17 -10 16 -13 18 C-12 13 -13 10 -14 9 L-4 12 Z" fill={u('prim')} />
          <path d="M-12 -5 L-14 11 M-6 -6 L-8 19 M1 -7 L-2 21" stroke="#4f463b" strokeWidth=".7" opacity=".55" />
          <path d="M3 -5 L5 9" stroke="#f4f1ea" strokeWidth="4.6" strokeLinecap="round" />
          <path d="M3 -5 L5 9" stroke={u('spec')} strokeWidth="2.8" strokeLinecap="round" />
        </g>
      ) : (
        flying && (
          <g className="wing wing-near">
            <path d={NEAR_WING} fill={u('wing')} />
            {/* primaries towards the tip */}
            <path d="M-6 -50 C-10 -55 -16 -60 -25 -63 C-21 -59 -19 -56 -18 -53 C-22 -52.5 -24 -50.5 -24 -47.5 C-20 -46.5 -17 -44.5 -16 -42.5 C-20 -41.5 -21 -39 -20 -36.5 L-6 -40 Z" fill={u('prim')} />
            {/* speculum band along the secondaries */}
            <g clipPath={u('wclip')}>
              <path d="M-20 -19 L-26 -37 L-11.5 -39 L-7 -20 Z" fill={u('spec')} />
              <path d="M-7 -20 L-11.5 -39" stroke="#f4f1ea" strokeWidth="1.1" />
            </g>
            <g clipPath={u('sclip')}>
              <path d={NEAR_WING} stroke="#f4f1ea" strokeWidth="2.2" fill="none" />
            </g>
            <path d="M-4 -14 L-9 -40 M2 -15 L-3 -44 M8 -14 L4 -40" stroke="#4f463b" strokeWidth=".7" opacity=".5" />
            {/* warm leading edge */}
            <path d="M14 -10 C10 -26 2 -42 -8 -54 C-12 -59 -18 -62 -25 -63" stroke="#ffd3a0" strokeOpacity=".55" strokeWidth="1.2" fill="none" />
          </g>
        )
      )}

      {/* webbed feet, tucked back */}
      {state !== 'float' && (
        <g>
          <path d="M-4 15 L-14 19 C-14 22 -10 23 -8 21 L-6 23 C-3 22 -2 19 -2 16 Z" fill="#d76a12" />
          <path d="M3 15 L-6 19 C-6 22 -2 23 0 21 L2 23 C5 22 6 19 6 16 Z" fill={u('foot')} />
          <path d="M-5 19.5 L0 21.5 M-1 18 L2 22.5" stroke="#b55a0e" strokeWidth=".5" />
        </g>
      )}
    </g>
  );
}

export function DuckArt({ state = 'fly', width = 200 }: { state?: DuckState; width?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="-66 -70 136 100" width={width} height={(width * 100) / 136} role="img" aria-label="Mallow the duck">
      <Duck state={state} />
    </svg>
  );
}
