import { memo, useId } from 'react';

/*
 * The marsh at dusk, split into layers so the stage can slot the duck and the
 * hunter between them. All layers share the viewBox 0 0 1000 560 (phones add a near shore below, to y 680).
 */

/** Deterministic star field: denser and brighter high up, thinning towards the horizon. */
const STARS = (() => {
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  return Array.from({ length: 72 }, (_, i) => {
    const y = Math.pow(rnd(), 1.6) * 300;
    return {
      x: rnd() * 1000,
      y,
      r: 0.5 + rnd() * (y < 120 ? 1.3 : 0.8),
      o: 0.35 + (1 - y / 300) * 0.55,
      twinkle: i % 4 === 0 ? (i % 7) * 0.45 : -1,
    };
  });
})();

/** Stars for the sky above the frame (y < 0). */
const HIGH_STARS = (() => {
  let seed = 31;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  return Array.from({ length: 140 }, () => ({ x: rnd() * 1000, y: -rnd() * 880, r: 0.5 + rnd() * 1.2, o: 0.4 + rnd() * 0.5 }));
})();

/** The sky; `top` is where its gradient starts (above 0 on phones, which show sky above the frame). */
export const SceneSky = memo(function SceneSky({ top = 0 }: { top?: number }) {
  const id = useId().replace(/:/g, '');
  const u = (n: string) => `url(#${id}-${n})`;
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#040817" />
          <stop offset=".22" stopColor="#0f1838" />
          <stop offset=".42" stopColor="#2a2a5e" />
          <stop offset=".58" stopColor="#5b3a72" />
          <stop offset=".7" stopColor="#9a4a6e" />
          <stop offset=".8" stopColor="#d9675a" />
          <stop offset=".88" stopColor="#f59a56" />
          <stop offset="1" stopColor="#ffd88a" />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#fff0c4" stopOpacity=".95" />
          <stop offset=".25" stopColor="#ffc27a" stopOpacity=".5" />
          <stop offset=".6" stopColor="#ff8a5c" stopOpacity=".16" />
          <stop offset="1" stopColor="#ff7a50" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-sun`} cx=".5" cy=".4" r=".6">
          <stop offset="0" stopColor="#fffbe6" />
          <stop offset=".55" stopColor="#ffe29a" />
          <stop offset="1" stopColor="#ffb85c" />
        </radialGradient>
        <radialGradient id={`${id}-moon`} cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#dfe8ff" stopOpacity=".35" />
          <stop offset=".5" stopColor="#c9d6ff" stopOpacity=".1" />
          <stop offset="1" stopColor="#c9d6ff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-milky`} cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#b9b6ff" stopOpacity=".16" />
          <stop offset="1" stopColor="#b9b6ff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-ray`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#ffe7b0" stopOpacity=".22" />
          <stop offset="1" stopColor="#ffe7b0" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}-haze`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff9a6a" stopOpacity="0" />
          <stop offset="1" stopColor="#ffb07a" stopOpacity=".35" />
        </linearGradient>
      </defs>

      {/* night sky continuing above the frame, shown when a tall (phone) stage fits the scene to its width */}
      <rect y="-900" width="1000" height="901" fill="#040817" />
      {/* the dusk gradient, which on phones stretches up to the top of the stage */}
      <rect y={top} width="1000" height={560 - top} fill={u('sky')} />
      <g fill="#fff">
        {HIGH_STARS.map((st, i) => (
          <circle key={i} cx={st.x.toFixed(1)} cy={st.y.toFixed(1)} r={st.r.toFixed(2)} opacity={st.o.toFixed(2)} />
        ))}
      </g>

      {/* a faint band of the Milky Way across the high sky */}
      <ellipse cx="560" cy="110" rx="520" ry="60" transform="rotate(-14 560 110)" fill={u('milky')} />

      <g fill="#fff">
        {STARS.map((st, i) =>
          st.twinkle < 0 ? (
            <circle key={i} cx={st.x.toFixed(1)} cy={st.y.toFixed(1)} r={st.r.toFixed(2)} opacity={st.o.toFixed(2)} />
          ) : (
            <circle key={i} cx={st.x.toFixed(1)} cy={st.y.toFixed(1)} r={(st.r + 0.3).toFixed(2)} className="twinkle" style={{ animationDelay: `${st.twinkle}s` }} />
          ),
        )}
      </g>

      {/* crescent moon with a cool halo and a hint of craters */}
      <circle cx="170" cy="96" r="70" fill={u('moon')} />
      <path d="M170 72 A24 24 0 1 0 190 112 A19 19 0 1 1 170 72 Z" fill="#f3efe2" />
      <g fill="#d8d2bf" opacity=".7">
        <circle cx="156" cy="100" r="3" />
        <circle cx="163" cy="112" r="2" />
        <circle cx="152" cy="88" r="1.6" />
      </g>

      {/* soft light beams fanning up from the sun */}
      <g className="sunrays">
        {Array.from({ length: 9 }, (_, i) => (
          <path key={i} d="M730 452 L700 -40 L760 -40 Z" fill={u('ray')} transform={`rotate(${-80 + i * 20} 730 452)`} />
        ))}
      </g>

      <rect y="330" width="1000" height="140" fill={u('haze')} />
      <circle cx="730" cy="446" r="300" fill={u('glow')} />
      <circle cx="730" cy="452" r="62" fill={u('sun')} />
      <circle cx="730" cy="452" r="70" fill="none" stroke="#fff3cf" strokeWidth="1.5" opacity=".35" />

      {/* a skein of geese crossing the sky */}
      <g className="flock" fill="none" stroke="#1a1428" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" opacity=".75">
        <path d="M600 210 q6 -6 12 0 q6 -6 12 0" />
        <path d="M584 200 q5 -5 10 0 q5 -5 10 0" />
        <path d="M570 190 q4 -4 8 0 q4 -4 8 0" />
        <path d="M618 222 q5 -5 10 0 q5 -5 10 0" />
        <path d="M634 232 q4 -4 8 0 q4 -4 8 0" />
      </g>
    </g>
  );
});

const CLOUDS = [
  { x: 120, y: 214, s: 1 },
  { x: 420, y: 150, s: 0.7 },
  { x: 640, y: 262, s: 1.2 },
  { x: 860, y: 178, s: 0.8 },
];

/** A dusk cloud: dark violet on top, lit pink and gold underneath by the low sun. */
function Cloud({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-78 4 C-80 -8 -62 -14 -50 -10 C-46 -24 -24 -30 -10 -22 C0 -36 30 -34 38 -18 C54 -22 72 -12 70 0 C84 2 86 12 74 14 L-70 14 C-84 14 -86 6 -78 4 Z" fill="#3a2d58" opacity=".7" />
      <path d="M-60 0 C-56 -10 -40 -14 -30 -8 C-22 -20 -2 -22 6 -12 C16 -22 36 -18 40 -6 C52 -8 62 0 58 6 L-56 8 Z" fill="#53407a" opacity=".55" />
      <path d="M-74 12 C-40 6 20 6 76 12 C60 18 -50 18 -74 12 Z" fill="#ffb38a" opacity=".55" />
      <path d="M-50 13 C-20 10 20 10 50 13" stroke="#ffe1a8" strokeWidth="1.4" fill="none" opacity=".6" strokeLinecap="round" />
    </g>
  );
}

/** Clouds scroll left; the engine speeds them up as the duck climbs. */
export function Clouds({ x }: { x: number }) {
  return (
    <g transform={`translate(${(-x).toFixed(1)} 0)`}>
      {[0, 1000].map((off) => (
        <g key={off} transform={`translate(${off} 0)`}>
          {CLOUDS.map((c) => (
            <Cloud key={c.x} {...c} />
          ))}
        </g>
      ))}
    </g>
  );
}

/* ---- landscape ------------------------------------------------------------------- */

/** The low sun sits at this x; trees and buildings catch a warm rim on the side facing it. */
const SUN_X = 730;
const RIM = '#ffc79a';

const rng = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

const cubic = (t: number, a: number, b: number, c: number, d: number) => {
  const m = 1 - t;
  return m * m * m * a + 3 * m * m * t * b + 3 * m * t * t * c + t * t * t * d;
};

const MTN_BACK =
  'M0 418 L40 402 L80 410 L130 378 L175 396 L215 384 L262 404 L320 372 L372 398 L420 388 L470 408 L520 396 L580 414 L640 422 L700 428 L760 426 L820 416 L870 396 L920 382 L960 394 L1000 386';
const MTN_FRONT =
  'M0 432 C50 418 100 424 150 412 C200 402 250 420 300 414 C360 408 410 426 470 420 C530 414 580 432 640 436 C700 440 760 440 820 432 C870 424 930 410 1000 416';
const FAR_HILL = 'M0 442 C90 426 180 430 260 438 C340 446 400 430 470 434 C550 438 610 448 690 448 C770 448 850 434 930 430 C965 428 985 432 1000 434 L1000 470 L0 470 Z';
const HILL_L = 'M340 470 C372 446 420 410 492 402 C548 396 600 404 640 422 C668 434 694 452 716 470 Z';
const HILL_R = 'M680 470 C712 448 760 418 815 412 C868 406 926 420 962 438 C984 449 996 454 1000 455 L1000 470 Z';
const SHORE_TOP =
  'M0 452 C40 438 70 446 100 440 C130 432 150 448 190 444 C240 438 270 452 320 448 C380 442 420 454 480 450 C560 444 600 456 680 452 C760 448 820 458 900 450 C940 446 970 452 1000 448';

/** Round tree from overlapping blobs; mirrored so the lit edge faces the sun. */
function Oak({ x, y, s = 1, c = '#2c1f3c' }: { x: number; y: number; s?: number; c?: string }) {
  const f = x > SUN_X ? -1 : 1;
  return (
    <g transform={`translate(${x} ${y}) scale(${f * s} ${s})`}>
      <path d="M-1.6 0 L-1 -14 L1 -14 L1.6 0 Z M0 -9 L-5 -15 L-4 -16 L0 -11 Z" fill="#1a1324" />
      <g fill={c}>
        <circle cx="-9" cy="-17" r="8" />
        <circle cx="-2" cy="-25" r="10" />
        <circle cx="8" cy="-20" r="9" />
        <circle cx="3" cy="-13" r="7" />
        <circle cx="-6" cy="-11" r="6" />
      </g>
      <circle cx="-7" cy="-13" r="6" fill="#000" opacity=".18" />
      <path d="M-3.7 -34.8 A10 10 0 0 1 6.7 -30 M12.5 -27.8 A9 9 0 0 1 16.5 -16.9" stroke={RIM} strokeWidth="1.5" strokeLinecap="round" fill="none" opacity=".55" />
    </g>
  );
}

/** Tall Lombardy poplar. */
function Poplar({ x, y, h = 40, c = '#2a1d38' }: { x: number; y: number; h?: number; c?: string }) {
  const f = x > SUN_X ? -1 : 1;
  const w = h * 0.16;
  const n = (v: number) => v.toFixed(1);
  return (
    <g transform={`translate(${x} ${y}) scale(${f} 1)`}>
      <path d={`M0 ${-h}C${n(w)} ${n(-h * 0.75)} ${n(w * 1.15)} ${n(-h * 0.3)} ${n(w * 0.7)} 0H${n(-w * 0.7)}C${n(-w * 1.15)} ${n(-h * 0.3)} ${n(-w)} ${n(-h * 0.75)} 0 ${-h}Z`} fill={c} />
      <path
        d={`M${n(w * 0.25)} ${n(-h * 0.92)}C${n(w * 0.9)} ${n(-h * 0.7)} ${n(w * 1.05)} ${n(-h * 0.35)} ${n(w * 0.75)} ${n(-h * 0.08)}`}
        stroke={RIM}
        strokeWidth="1.3"
        strokeLinecap="round"
        fill="none"
        opacity=".5"
      />
    </g>
  );
}

function Pine({ x, y, s = 1, c = '#261b33' }: { x: number; y: number; s?: number; c?: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-1" y="-4" width="2" height="4" fill="#1a1324" />
      <path d="M0 -30 L6 -18 L3.5 -18 L9 -9 L5 -9 L11 -3 L-11 -3 L-5 -9 L-9 -9 L-3.5 -18 L-6 -18 Z" fill={c} />
    </g>
  );
}

/** Hanging willow strands in two layers: each starts inside the crown and falls to a ragged hem. */
const WILLOW = (() => {
  const r = rng(5);
  const strand = (x: number) => {
    const top = -40 - 36 * Math.sqrt(Math.max(0, 1 - (x / 48) ** 2)) + 10;
    const end = -2 - r() * 16 + Math.abs(x) * 0.05;
    const flare = x * 0.1;
    const ex = x + flare + (r() - 0.5) * 4;
    return `M${x.toFixed(1)} ${top.toFixed(1)}C${(x + flare * 0.6).toFixed(1)} ${(top + (end - top) * 0.45).toFixed(1)} ${ex.toFixed(1)} ${(top + (end - top) * 0.7).toFixed(1)} ${ex.toFixed(1)} ${end.toFixed(1)}`;
  };
  const layer = (n: number, from: number, to: number) =>
    Array.from({ length: n }, (_, i) => strand(from + ((to - from) * (i + r() * 0.8)) / n)).join('');
  return { back: layer(30, -48, 48), front: layer(22, -44, 40), lit: layer(7, -48, -20) };
})();

/** Weeping willow on the far bank, its curtain of strands swaying from the crown. */
function Willow({ id, x, y }: { id: string; x: number; y: number }) {
  return (
    <g id={id} transform={`translate(${x} ${y})`}>
      <path d="M-4 0 C-3 -14 -7 -28 -2 -46 L3 -46 C0 -28 4 -14 6 0 Z" fill="#1b1424" />
      <path d="M-1 -38 C-12 -48 -24 -52 -36 -48 M1 -40 C14 -54 28 -54 38 -46" stroke="#1b1424" strokeWidth="2.4" fill="none" />
      <path
        d="M-50 -36 C-52 -50 -42 -60 -35 -61 C-33 -72 -19 -79 -8 -76 C0 -83 16 -81 22 -74 C34 -75 45 -65 44 -55 C51 -51 51 -42 48 -36 C30 -44 -30 -44 -50 -36 Z"
        fill="#211829"
      />
      <g className="sway" style={{ transformOrigin: '50% 0%', animationDuration: '7s' }} strokeLinecap="round" fill="none">
        <path d={WILLOW.back} stroke="#1c1426" strokeWidth="4.2" />
        <path d={WILLOW.front} stroke="#2b2038" strokeWidth="2.4" />
        <path d={WILLOW.lit} stroke={RIM} strokeWidth="1" opacity=".38" />
      </g>
      <path d="M-49 -42 C-50 -54 -40 -60 -34 -61 C-32 -71 -20 -78 -9 -76" stroke={RIM} strokeWidth="1.5" strokeLinecap="round" fill="none" opacity=".5" />
    </g>
  );
}

/** One windmill sail: a spar with a lattice frame half-covered in cloth. Drawn pointing up from the hub. */
function Sail() {
  return (
    <g>
      <rect x="-1.2" y="-50" width="2.4" height="47" rx="1" fill="#1b1325" />
      <rect x="2" y="-48" width="10" height="36" fill="#4a3658" opacity=".5" />
      <path d="M2 -48 H12 V-12 H2 Z M7 -48 V-12 M2 -42 H12 M2 -36 H12 M2 -30 H12 M2 -24 H12 M2 -18 H12" stroke="#1b1325" strokeWidth=".9" fill="none" />
    </g>
  );
}

function Window({ x, y, w = 10, h = 11, glow }: { x: number; y: number; w?: number; h?: number; glow?: number }) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        fill="#ffcf6b"
        className={glow === undefined ? undefined : 'window-glow'}
        style={glow ? { animationDelay: `${glow}s` } : undefined}
      />
      <path d={`M${x + w / 2} ${y}V${y + h}M${x} ${y + h / 2}H${x + w}`} stroke="#2a1d33" strokeWidth="1.1" />
      <rect x={x - 0.6} y={y - 0.6} width={w + 1.2} height={h + 1.2} fill="none" stroke="#1a1222" strokeWidth="1.2" />
      <rect x={x - 1.5} y={y + h} width={w + 3} height="1.6" fill="#1a1222" />
    </g>
  );
}

/** Lily pad with a notch, and optionally a pink water lily on it. */
function Lily({ x, y, s = 1, flower = false }: { x: number; y: number; s?: number; flower?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 0 L13.7 -1 A14 5 0 1 0 13.7 1 Z" fill="#2c4a33" />
      <path d="M-12 -2.6 A14 5 0 0 1 9 -3.8" stroke="#5f8a52" strokeWidth=".9" fill="none" opacity=".6" />
      {flower && (
        <g transform="translate(-2 -2)">
          {[-60, -30, 0, 30, 60].map((a) => (
            <ellipse key={a} cy="-3" rx="1.5" ry="3.6" fill="#f4b3cc" transform={`rotate(${a} 0 0)`} />
          ))}
          <ellipse cy="-2.6" rx="1.3" ry="3" fill="#fff0f5" />
          <circle cy="-.6" r="1.3" fill="#f2cf5b" />
        </g>
      )}
    </g>
  );
}

const SHORE_FLOWERS = (() => {
  const r = rng(23);
  const colors = ['#f3ece0', '#f2cf5b', '#f0a3c4', '#b9a0ff'];
  return Array.from({ length: 48 }, (_, i) => ({ x: 392 + r() * 600, y: 454 + r() * 7, c: colors[i % 4], r: 0.9 + r() * 0.8 }));
})();

const SHORE_GRASS = (() => {
  const r = rng(31);
  let d = '';
  for (let x = 384; x < 1000; x += 5 + r() * 4) {
    const y = 457 + r() * 6;
    const h = 3 + r() * 5;
    d += `M${x.toFixed(1)} ${y.toFixed(1)}l${((r() - 0.5) * 3).toFixed(1)} ${(-h).toFixed(1)}`;
  }
  return d;
})();

export const SceneLand = memo(function SceneLand() {
  const id = useId().replace(/:/g, '');
  const u = (n: string) => `url(#${id}-${n})`;
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-mtnb`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a87a9e" />
          <stop offset="1" stopColor="#c98a88" />
        </linearGradient>
        <linearGradient id={`${id}-mtnf`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7a5890" />
          <stop offset="1" stopColor="#94627e" />
        </linearGradient>
        <linearGradient id={`${id}-far`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5e3e6e" />
          <stop offset="1" stopColor="#3e2a52" />
        </linearGradient>
        <linearGradient id={`${id}-hill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#402c56" />
          <stop offset="1" stopColor="#261b38" />
        </linearGradient>
        <linearGradient id={`${id}-shore`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2c2238" />
          <stop offset="1" stopColor="#15111d" />
        </linearGradient>
        {/* warm light along edges, strongest right under the sun */}
        <linearGradient id={`${id}-rim`} gradientUnits="userSpaceOnUse" x1="300" y1="0" x2="1000" y2="0">
          <stop offset="0" stopColor={RIM} stopOpacity="0" />
          <stop offset=".614" stopColor={RIM} stopOpacity=".95" />
          <stop offset="1" stopColor={RIM} stopOpacity=".15" />
        </linearGradient>
        <linearGradient id={`${id}-wall`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#35263f" />
          <stop offset="1" stopColor="#4a3352" />
        </linearGradient>
        <linearGradient id={`${id}-tower`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#4d3654" />
          <stop offset=".35" stopColor="#2e2039" />
          <stop offset="1" stopColor="#211829" />
        </linearGradient>
        <linearGradient id={`${id}-water`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8a5a7a" />
          <stop offset=".18" stopColor="#4a3a62" />
          <stop offset=".6" stopColor="#1c1a34" />
          <stop offset="1" stopColor="#080a14" />
        </linearGradient>
        <radialGradient id={`${id}-sunpath`} cx=".5" cy="0" r="1">
          <stop offset="0" stopColor="#ffd28a" stopOpacity=".55" />
          <stop offset=".5" stopColor="#ffb070" stopOpacity=".15" />
          <stop offset="1" stopColor="#ff9a60" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-mist`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset=".5" stopColor="#ffe9d0" stopOpacity=".18" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${id}-fade`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".6" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id={`${id}-reflmask`}>
          <rect y="466" width="1000" height="64" fill={u('fade')} />
        </mask>
        <clipPath id={`${id}-farclip`}>
          <path d={FAR_HILL} />
        </clipPath>
      </defs>

      {/* two hazy mountain ranges, dipping where the sun goes down */}
      <path d={`${MTN_BACK} L1000 470 L0 470 Z`} fill={u('mtnb')} opacity=".5" />
      <path d={MTN_BACK} stroke={u('rim')} strokeWidth="1.2" fill="none" opacity=".5" strokeLinejoin="round" />
      <path d={`${MTN_FRONT} L1000 470 L0 470 Z`} fill={u('mtnf')} opacity=".78" />
      <path d={MTN_FRONT} stroke={u('rim')} strokeWidth="1.4" fill="none" opacity=".55" />

      {/* far farmland with hedgerows, and a stand of pines */}
      <path d={FAR_HILL} fill={u('far')} />
      <g clipPath={u('farclip')}>
        <path d="M0 470 L50 432 L140 428 L110 470 Z" fill="#6c4a7c" opacity=".4" />
        <path d="M200 470 L236 434 L320 440 L300 470 Z" fill="#6c4a7c" opacity=".3" />
        <path d="M0 448 C80 438 170 440 250 446 C300 450 330 446 360 442" stroke="#2f2142" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="0.1 4" fill="none" />
        <path d="M30 462 C110 452 200 456 330 458" stroke="#2f2142" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="0.1 4" fill="none" />
      </g>
      <path d="M0 442 C90 426 180 430 260 438 C340 446 400 430 470 434" stroke={RIM} strokeWidth="1" fill="none" opacity=".18" />
      <Pine x={262} y={440} s={0.8} />
      <Pine x={275} y={438} s={1} />
      <Pine x={289} y={441} s={0.75} />
      <Oak x={180} y={432} s={0.5} c="#33243f" />
      <Oak x={196} y={433} s={0.42} c="#33243f" />

      {/* everything above the waterline that the lake reflects */}
      <g id={`${id}-refl`}>
        <path d={HILL_L} fill={u('hill')} />
        <path d="M492 402 C548 396 600 404 640 422 C668 434 694 452 716 470" stroke={u('rim')} strokeWidth="1.6" fill="none" opacity=".7" />
        <path d={HILL_R} fill={u('hill')} />
        <path d="M680 470 C712 448 760 418 815 412" stroke={u('rim')} strokeWidth="1.6" fill="none" opacity=".7" />

        {/* path from the farmhouse down to the water */}
        <path d="M519 406 C514 420 536 428 546 438 C556 448 546 456 536 462 L556 462 C566 454 570 444 560 434 C550 424 530 418 528 406 Z" fill="#6a4c6a" opacity=".45" />

        <Oak x={452} y={411} s={0.8} />
        <Oak x={470} y={407} s={1.05} />

        {/* barn */}
        <path d="M560 406 V384 L566 372 L583 365 L600 372 L606 384 V406 Z" fill="#3e2438" />
        <path d="M558 385 L566 371 L583 363.5 L600 371 L608 385" stroke="#22162a" strokeWidth="3" strokeLinejoin="round" fill="none" />
        <path d="M600 371 L608 385 M606 386 V406" stroke={RIM} strokeWidth="1.2" fill="none" opacity=".6" />
        <path d="M574 406 V391 H592 V406 M574 391 L592 406 M592 391 L574 406" stroke="#22162a" strokeWidth="1.3" fill="none" />
        <rect x="580" y="375" width="6" height="7" fill="#ffcf6b" opacity=".85" />

        {/* farmhouse: stone walls, tiled gable roof, chimney, lit windows and an open door */}
        <rect x="486" y="374" width="74" height="32" fill={u('wall')} />
        <path d="M480 376 L523 344 L566 376 Z" fill="#251a30" />
        <path d="M494 366 H552 M504 358 H542 M514 351 H532" stroke="#1a1222" strokeWidth=".8" opacity=".8" />
        <path d="M477 377.5 L523 343 L569 377.5" stroke="#1a1222" strokeWidth="2.6" strokeLinejoin="round" fill="none" />
        <path d="M524 344.5 L566 376" stroke={RIM} strokeWidth="1.3" opacity=".6" />
        <path d="M559.4 378 V406" stroke={RIM} strokeWidth="1.2" opacity=".5" />
        <rect x="540" y="346" width="8" height="18" fill="#1f1629" />
        <rect x="538.5" y="343.5" width="11" height="3" fill="#1a1222" />
        <circle cx="523" cy="362" r="4" fill="#ffd98a" />
        <path d="M519 362 H527 M523 358 V366" stroke="#2a1d33" strokeWidth=".9" />
        <Window x={494} y={382} glow={0} />
        <Window x={541} y={382} glow={1.3} />
        <path d="M516.5 406 V392 a6.5 6.5 0 0 1 13 0 V406 Z" fill="#1a1222" />
        <path d="M518 406 V392.5 a5 5 0 0 1 10 0 V406 Z" fill="#ffb84a" />
        <circle cx="534" cy="387" r="7" fill="#ffcf6b" opacity=".18" />
        <circle cx="534" cy="387" r="1.6" fill="#fff1c4" />
        <ellipse cx="523" cy="408" rx="50" ry="5" fill="#ffcf6b" opacity=".12" />
        <path d="M517 406 L529 406 L540 420 L506 420 Z" fill="#ffcf6b" opacity=".1" />
        <g fill="#f0a3c4">
          <circle cx="490" cy="406" r="1.4" />
          <circle cx="500" cy="407" r="1.3" fill="#f3ece0" />
          <circle cx="509" cy="406" r="1.4" fill="#f2cf5b" />
          <circle cx="538" cy="407" r="1.4" />
          <circle cx="548" cy="406" r="1.3" fill="#b9a0ff" />
          <circle cx="556" cy="407" r="1.4" fill="#f3ece0" />
        </g>

        {/* fence running down the slope */}
        <g fill="#1d1527">
          <rect x="612" y="402" width="1.8" height="9" />
          <rect x="624" y="406" width="1.8" height="9" />
          <rect x="636" y="411" width="1.8" height="9" />
          <rect x="648" y="417" width="1.8" height="9" />
          <rect x="660" y="423" width="1.8" height="9" />
        </g>
        <path d="M612 405 L662 426 M612 409 L662 430" stroke="#1d1527" strokeWidth="1.1" />

        {/* poplars backlit by the sun */}
        <Poplar x={672} y={440} h={34} />
        <Poplar x={684} y={446} h={44} />
        <Poplar x={697} y={452} h={30} />

        {/* windmill tower: stone base, timber body, gallery and cap */}
        <path d="M798 416 L801 404 L829 404 L832 416 Z" fill="#241a2e" />
        <path d="M801 405 L807 362 L823 362 L829 405 Z" fill={u('tower')} />
        <path d="M803 392 H827 M805 378 H825" stroke="#1b1325" strokeWidth=".8" opacity=".7" />
        <path d="M801.6 404 L807.4 363" stroke={RIM} strokeWidth="1.2" opacity=".65" />
        <rect x="797" y="384" width="36" height="3" rx="1" fill="#1b1325" />
        <path d="M799 384 V378.5 M805 384 V378.5 M811 384 V378.5 M819 384 V378.5 M825 384 V378.5 M831 384 V378.5 M798 378.5 H832" stroke="#1b1325" strokeWidth="1" />
        <path d="M804 363 C804 349 826 349 826 363 Z" fill="#221830" />
        <path d="M805.5 357 C807 351 812 349.5 815 349.5" stroke={RIM} strokeWidth="1" fill="none" opacity=".55" />
        <path d="M802.5 363 H827.5" stroke="#1b1325" strokeWidth="2" />
        <rect x="812.5" y="367" width="5" height="7" rx="2.5" fill="#ffcf6b" className="window-glow" style={{ animationDelay: '2.1s' }} />
        <path d="M810 416 V405 a5 5 0 0 1 10 0 V416 Z" fill="#ffb84a" opacity=".85" />
        <ellipse cx="815" cy="417" rx="16" ry="3" fill="#ffcf6b" opacity=".12" />

        <Oak x={874} y={413} s={0.9} />
        <Oak x={898} y={417} s={1.15} />
      </g>

      {/* chimney smoke */}
      <g fill="#c9b8d8" className="mist">
        <circle cx="545" cy="337" r="3" opacity=".25" />
        <circle cx="549" cy="329" r="4" opacity=".18" />
        <circle cx="554" cy="320" r="5" opacity=".1" />
      </g>

      {/* the windmill's lattice sails turning against the setting sun */}
      <g transform="translate(815 356)">
        <g className="windmill-sails">
          {[0, 90, 180, 270].map((r) => (
            <g key={r} transform={`rotate(${r})`}>
              <Sail />
            </g>
          ))}
        </g>
        <circle r="3.2" fill="#1b1325" />
        <circle r="1.2" fill="#6b5070" />
      </g>

      {/* far bank: grassy edge lit by the sun, dotted with wildflowers */}
      <path d={`${SHORE_TOP} L1000 472 L0 472 Z`} fill={u('shore')} />
      <path d={SHORE_TOP} stroke={u('rim')} strokeWidth="1.4" fill="none" opacity=".45" />
      <Willow id={`${id}-willow`} x={946} y={456} />
      <path d={SHORE_GRASS} stroke="#3a3348" strokeWidth="1.3" strokeLinecap="round" fill="none" />
      <g>
        {SHORE_FLOWERS.map((f, i) => (
          <circle key={i} cx={f.x.toFixed(1)} cy={f.y.toFixed(1)} r={f.r.toFixed(2)} fill={f.c} opacity=".85" />
        ))}
      </g>

      {/* the lake: sky colours on top, the sun's path, reflections and gentle waves */}
      <rect x="0" y="466" width="1000" height="94" fill={u('water')} />
      <g mask={u('reflmask')} opacity=".55">
        <g transform="matrix(1 0 0 -0.6 0 745.6)">
          <use href={`#${id}-refl`} />
          <use href={`#${id}-willow`} />
        </g>
      </g>
      <path d="M580 466 A150 80 0 0 0 880 466 Z" fill={u('sunpath')} />
      <g stroke="#ffcf80" strokeLinecap="round" opacity=".7">
        <line className="shimmer" x1="672" y1="476" x2="788" y2="476" strokeWidth="3" />
        <line className="shimmer" x1="692" y1="488" x2="768" y2="488" strokeWidth="2.5" style={{ animationDelay: '.5s' }} />
        <line className="shimmer" x1="704" y1="501" x2="756" y2="501" strokeWidth="2" style={{ animationDelay: '1s' }} />
        <line className="shimmer" x1="714" y1="515" x2="746" y2="515" strokeWidth="1.6" style={{ animationDelay: '1.5s' }} />
        <line className="shimmer" x1="721" y1="529" x2="739" y2="529" strokeWidth="1.2" style={{ animationDelay: '2s' }} />
      </g>
      {/* lamplight from the farm and the mill streaking across the water */}
      <g stroke="#ffcf6b" strokeLinecap="round" opacity=".45">
        <line className="shimmer" x1="494" y1="474" x2="506" y2="474" strokeWidth="1.6" />
        <line className="shimmer" x1="517" y1="480" x2="529" y2="480" strokeWidth="2" style={{ animationDelay: '.8s' }} />
        <line className="shimmer" x1="541" y1="474" x2="551" y2="474" strokeWidth="1.6" style={{ animationDelay: '1.6s' }} />
        <line className="shimmer" x1="809" y1="472" x2="821" y2="472" strokeWidth="1.6" style={{ animationDelay: '1.2s' }} />
      </g>
      <g stroke="#b9a6d8" strokeLinecap="round" opacity=".22" fill="none">
        <path d="M420 494 q14 -3 28 0 q14 3 28 0" />
        <path d="M560 512 q12 -3 24 0 q12 3 24 0" />
        <path d="M860 500 q12 -3 24 0 q12 3 24 0" />
        <path d="M600 538 q16 -3 32 0 q16 3 32 0" />
        <path d="M880 544 q14 -3 28 0 q14 3 28 0" />
      </g>
      <Lily x={470} y={528} />
      <Lily x={438} y={514} s={0.7} flower />
      <Lily x={520} y={546} s={0.85} flower />
      <Lily x={640} y={552} s={0.7} />
      <Lily x={905} y={534} s={1.15} flower />
      <Lily x={930} y={546} s={0.75} />
      <rect className="mist" x="-120" y="452" width="1240" height="34" fill={u('mist')} />

      {/* reeds and cattails on the far bank, swaying */}
      <g className="sway">
        <g fill="#2a2235">
          <path d="M852 470 C850 448 856 428 866 410 C860 430 858 450 860 470 Z" />
          <path d="M884 470 C886 452 894 436 906 424 C898 440 892 454 892 470 Z" />
          <path d="M934 470 C930 450 922 436 910 426 C924 434 936 450 941 470 Z" />
          <path d="M962 470 C962 446 970 430 982 418 C974 434 970 450 970 470 Z" />
        </g>
        <g stroke="#2a2235" strokeWidth="3" strokeLinecap="round" fill="none">
          <path d="M860 470 C862 430 858 410 866 380" />
          <path d="M876 470 C878 440 884 420 880 396" />
          <path d="M900 470 C898 444 906 424 912 404" />
          <path d="M944 470 C940 440 950 420 948 392" />
          <path d="M970 470 C972 444 966 426 976 410" />
        </g>
        <g fill="#3a2618">
          <rect x="861" y="376" width="9" height="26" rx="4.5" />
          <rect x="907" y="400" width="9" height="24" rx="4.5" />
          <rect x="943" y="388" width="9" height="26" rx="4.5" />
        </g>
        <path d="M869 380 V400 M915 404 V422 M951 392 V412" stroke={RIM} strokeWidth="1" strokeLinecap="round" opacity=".3" />
      </g>

      {/* fireflies over the water */}
      <g fill="#ffe7a6">
        {[
          [520, 430, 0.4],
          [610, 412, 1.7],
          [820, 440, 2.4],
          [350, 470, 3],
          [460, 446, 1.1],
          [690, 436, 2.9],
          [940, 452, 0.8],
          [580, 458, 2.1],
        ].map(([x, y, d]) => (
          <circle key={x} className="twinkle" cx={x} cy={y} r="1.7" style={{ animationDelay: `${d}s`, filter: 'drop-shadow(0 0 3px #ffe7a6)' }} />
        ))}
      </g>
    </g>
  );
});

/* ---- the hunter's bank ----------------------------------------------------------- */

/** Grass blades along the top edge of the bank, grouped into three shades. */
const BANK_GRASS = (() => {
  const r = rng(11);
  const paths = ['', '', ''];
  for (let i = 0; i <= 78; i++) {
    const t = i / 78;
    const x = cubic(t, 0, 90, 250, 390);
    const y = cubic(t, 506, 486, 490, 518) + 2;
    const h = 5 + r() * 9;
    const lean = (r() - 0.5) * 8;
    paths[i % 3] += `M${x.toFixed(1)} ${y.toFixed(1)}q${(lean / 2).toFixed(1)} ${(-h / 2).toFixed(1)} ${lean.toFixed(1)} ${(-h).toFixed(1)}`;
  }
  return paths;
})();

/** Dry-stone wall: two courses of stones in a few shades. */
const WALL_STONES = (() => {
  const r = rng(17);
  const shades = ['#46424f', '#3d3946', '#4f4a59', '#423e4b'];
  const out: { x: number; y: number; w: number; c: string }[] = [];
  [483, 496.5].forEach((y, row) => {
    let x = row ? -10 : 0;
    while (x < 336) {
      const w = 18 + r() * 14;
      out.push({ x, y, w: Math.min(w, 336 - x) - 1.5, c: shades[Math.floor(r() * shades.length)] });
      x += w;
    }
  });
  return out;
})();

type Bloom = 'daisy' | 'poppy' | 'lavender';
const BANK_FLOWERS: [Bloom, number, number, number][] = [
  ['lavender', 206, 514, 1],
  ['lavender', 213, 520, 1.15],
  ['lavender', 220, 513, 0.9],
  ['daisy', 230, 508, 1],
  ['daisy', 244, 516, 1.1],
  ['daisy', 256, 507, 0.9],
  ['daisy', 264, 522, 1.2],
  ['daisy', 238, 532, 1.1],
  ['poppy', 280, 512, 1],
  ['poppy', 292, 524, 1.1],
  ['poppy', 274, 536, 1.2],
  ['daisy', 172, 540, 1.2],
  ['poppy', 190, 547, 1.3],
  ['daisy', 10, 518, 1],
  ['poppy', 20, 530, 1.1],
  ['daisy', 362, 532, 1.1],
  ['poppy', 377, 541, 1.2],
];

function Flower({ kind, x, y, s }: { kind: Bloom; x: number; y: number; s: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 0 Q1 7 0 14" stroke="#3e5232" strokeWidth="1.2" fill="none" />
      {kind === 'daisy' && (
        <>
          <g fill="#f3ece0">
            {[0, 45, 90, 135].map((a) => (
              <ellipse key={a} rx="4.2" ry="1.3" transform={`rotate(${a})`} />
            ))}
          </g>
          <circle r="1.7" fill="#f2cf5b" />
        </>
      )}
      {kind === 'poppy' && (
        <>
          <g fill="#c93a31">
            <circle cx="-2.2" cy="-.5" r="2.8" />
            <circle cx="2.2" cy="-.5" r="2.8" />
            <circle cy="-2.4" r="2.8" />
          </g>
          <circle cy="-.4" r="2.4" fill="#e2503f" />
          <circle cy="-1.2" r="1" fill="#2a1414" />
        </>
      )}
      {kind === 'lavender' && (
        <g fill="#9d7fe0">
          {[0, 2.6, 5.2, 7.8].map((k, i) => (
            <ellipse key={k} cx={i % 2 ? 0.9 : -0.9} cy={k - 2} rx="1.5" ry="2" />
          ))}
          <ellipse cy="-4" rx="1.1" ry="1.6" fill="#b9a0ff" />
        </g>
      )}
    </g>
  );
}

const COPING = Array.from({ length: 26 }, (_, i) => i * 13);

/** The bank the hunter stands on, with a dry-stone wall behind him and wildflowers in the grass. */
export const SceneBank = memo(function SceneBank() {
  const id = useId().replace(/:/g, '');
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-bank`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2b3822" />
          <stop offset=".45" stopColor="#18200f" />
          <stop offset="1" stopColor="#0b0e0a" />
        </linearGradient>
      </defs>

      <g transform="skewY(1.9)">
        <rect x="0" y="482" width="336" height="28" fill="#2a2731" />
        {WALL_STONES.map((st, i) => (
          <g key={i}>
            <rect x={st.x.toFixed(1)} y={st.y} width={st.w.toFixed(1)} height="12" rx="3" fill={st.c} />
            <path d={`M${(st.x + 2).toFixed(1)} ${st.y + 1.2}H${(st.x + st.w - 2).toFixed(1)}`} stroke="#5d5868" strokeWidth="1" opacity=".6" />
          </g>
        ))}
        <g fill="#4a4652">
          {COPING.map((x) => (
            <rect key={x} x={x} y="476" width="11" height="8" rx="3" />
          ))}
        </g>
        <g fill="#3e5232">
          <ellipse cx="40" cy="477" rx="10" ry="3" />
          <ellipse cx="150" cy="477" rx="14" ry="3.2" />
          <ellipse cx="262" cy="477" rx="9" ry="2.8" />
          <path d="M150 478 q-2 8 1 14 M156 478 q2 6 0 11" stroke="#3e5232" strokeWidth="1.4" fill="none" />
        </g>
      </g>

      <path d="M0 506 C90 486 250 490 390 518 L390 560 L0 560 Z" fill={`url(#${id}-bank)`} />
      <path d="M0 506 C90 486 250 490 390 518" stroke="#4a5e3a" strokeWidth="2" fill="none" />
      <g strokeWidth="1.6" strokeLinecap="round" fill="none">
        <path d={BANK_GRASS[0]} stroke="#3e5232" />
        <path d={BANK_GRASS[1]} stroke="#55703f" />
        <path d={BANK_GRASS[2]} stroke="#2c3a25" />
      </g>
      <g fill="#3a3740">
        <ellipse cx="320" cy="534" rx="7" ry="3.5" />
        <ellipse cx="331" cy="537" rx="4" ry="2.2" fill="#4a4652" />
        <ellipse cx="44" cy="540" rx="6" ry="3" />
      </g>
      {BANK_FLOWERS.map(([kind, x, y, s], i) => (
        <Flower key={i} kind={kind} x={x} y={y} s={s} />
      ))}
    </g>
  );
});

/** Dark reeds, leaves and cattails that frame the front of the shot. */
export const SceneForeground = memo(function SceneForeground() {
  return (
    <g>
      <g fill="#0b0d14">
        <path d="M0 560 C4 536 0 516 -8 498 C10 512 16 534 14 560 Z" />
        <path d="M86 560 C92 540 104 526 120 518 C106 530 98 544 96 560 Z" />
        <path d="M286 560 C282 538 270 524 256 516 C272 522 290 538 296 560 Z" />
        <path d="M372 560 C376 540 388 526 404 520 C392 532 384 546 382 560 Z" />
        <path d="M1000 560 C996 532 1004 510 1016 494 C1010 514 1008 536 1010 560 Z" />
        <path d="M944 560 C940 540 928 526 914 520 C930 524 946 540 952 560 Z" />
      </g>
      <g stroke="#0b0d14" strokeLinecap="round" fill="none">
        <path d="M24 560 C28 520 20 490 34 450" strokeWidth="5" />
        <path d="M50 560 C46 520 58 498 54 462" strokeWidth="4" />
        <path d="M74 560 C80 530 70 510 82 486" strokeWidth="5" />
        <path d="M300 560 C306 530 298 516 310 494" strokeWidth="4" />
        <path d="M328 560 C324 532 336 516 332 498" strokeWidth="5" />
        <path d="M356 560 C360 536 352 520 366 504" strokeWidth="4" />
        <path d="M980 560 C976 520 986 500 978 470" strokeWidth="5" />
        <path d="M958 560 C962 530 952 512 960 490" strokeWidth="4" />
      </g>
      <g fill="#24170e">
        <rect x="29" y="442" width="11" height="30" rx="5.5" />
        <rect x="305" y="486" width="10" height="26" rx="5" />
        <rect x="360" y="496" width="10" height="24" rx="5" />
        <rect x="973" y="462" width="10" height="26" rx="5" />
      </g>
      <path d="M38 446 V468 M313 490 V508 M368 500 V516" stroke="#ffb070" strokeWidth="1.2" strokeLinecap="round" opacity=".25" />
    </g>
  );
});

/* ---- the near shore (phones) ------------------------------------------------------ */

/** Top edge of the near shore, as three cubic segments [x0 y0 x1 y1 x2 y2 x3 y3]. */
const NEAR_SEGS = [
  [0, 594, 140, 586, 280, 584, 420, 590],
  [420, 590, 540, 595, 660, 598, 780, 592],
  [780, 592, 880, 587, 950, 584, 1000, 588],
];
const NEAR_TOP = `M0 594 ${NEAR_SEGS.map((s) => `C${s.slice(2).join(' ')}`).join(' ')}`;

/** Grass blades along the near shore's top edge, grouped into three shades. */
const NEAR_GRASS = (() => {
  const r = rng(23);
  const paths = ['', '', ''];
  let k = 0;
  for (const [x0, y0, x1, y1, x2, y2, x3, y3] of NEAR_SEGS) {
    for (let i = 0; i < 60; i++) {
      const t = i / 60;
      const x = cubic(t, x0, x1, x2, x3);
      const y = cubic(t, y0, y1, y2, y3) + 3;
      const h = 6 + r() * 10;
      const lean = (r() - 0.5) * 9;
      paths[k++ % 3] += `M${x.toFixed(1)} ${y.toFixed(1)}q${(lean / 2).toFixed(1)} ${(-h / 2).toFixed(1)} ${lean.toFixed(1)} ${(-h).toFixed(1)}`;
    }
  }
  return paths;
})();

const NEAR_FLOWERS: [Bloom, number, number, number][] = [
  ['daisy', 70, 592, 1],
  ['poppy', 128, 590, 1.1],
  ['daisy', 196, 588, 0.9],
  ['lavender', 470, 596, 1],
  ['daisy', 540, 600, 1],
  ['poppy', 612, 602, 1.1],
  ['daisy', 700, 600, 0.9],
  ['poppy', 842, 594, 1],
];

/**
 * Phones only: the lake and the hunter's bank carry on towards us down to a near shore, which
 * gives the altitude gauge its own strip of ground below the scene (y 560–680).
 */
export const SceneNearShore = memo(function SceneNearShore() {
  const id = useId().replace(/:/g, '');
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-near`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1c2616" />
          <stop offset=".3" stopColor="#10160c" />
          <stop offset="1" stopColor="#060807" />
        </linearGradient>
      </defs>

      {/* the lake, darkening as it comes towards us, with a few ripples and lily pads */}
      <rect x="0" y="559" width="1000" height="50" fill="#080a14" />
      <g stroke="#b9a6d8" strokeLinecap="round" opacity=".16" fill="none">
        <path d="M470 572 q14 -3 28 0 q14 3 28 0" />
        <path d="M660 578 q16 -3 32 0 q16 3 32 0" />
        <path d="M800 568 q12 -3 24 0 q12 3 24 0" />
      </g>
      <Lily x={590} y={576} s={0.9} />
      <Lily x={760} y={582} s={0.8} flower />

      {/* the hunter's bank running on down to the near shore */}
      <path d="M0 559 H392 C412 568 428 580 452 592 L0 600 Z" fill="#0b0e0a" />

      {/* the near shore, in shadow, with grass, wildflowers and stones along its edge */}
      <path d={`${NEAR_TOP} L1000 690 L0 690 Z`} fill={`url(#${id}-near)`} />
      <path d={NEAR_TOP} stroke="#3a4d2e" strokeWidth="2" fill="none" />
      <g strokeWidth="1.6" strokeLinecap="round" fill="none">
        <path d={NEAR_GRASS[0]} stroke="#3e5232" />
        <path d={NEAR_GRASS[1]} stroke="#55703f" />
        <path d={NEAR_GRASS[2]} stroke="#26331f" />
      </g>
      <g fill="#24222b">
        <ellipse cx="300" cy="600" rx="9" ry="4" />
        <ellipse cx="313" cy="603" rx="5" ry="2.6" fill="#33303a" />
        <ellipse cx="900" cy="597" rx="8" ry="3.6" />
      </g>
      {NEAR_FLOWERS.map(([kind, x, y, s], i) => (
        <Flower key={i} kind={kind} x={x} y={y} s={s} />
      ))}

      {/* dark reeds growing up from the near shore at the corners of the shot */}
      <g fill="#07090d">
        <path d="M30 600 C26 576 14 562 -4 554 C16 558 34 574 40 600 Z" />
        <path d="M820 596 C826 574 840 560 858 552 C842 566 832 580 830 596 Z" />
        <path d="M874 594 C870 572 858 558 842 552 C860 556 876 572 882 594 Z" />
      </g>
      <g stroke="#07090d" strokeLinecap="round" fill="none">
        <path d="M14 600 C18 570 10 552 22 530" strokeWidth="4" />
        <path d="M848 596 C852 566 844 548 856 520" strokeWidth="4.5" />
        <path d="M864 594 C860 570 870 554 866 534" strokeWidth="4" />
      </g>
      <g fill="#1c120a">
        <rect x="851" y="512" width="10" height="26" rx="5" />
      </g>
    </g>
  );
});
