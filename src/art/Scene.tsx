import { memo, useId } from 'react';

/*
 * The marsh at dusk, split into layers so the stage can slot the duck and the
 * hunter between them. All layers share the viewBox 0 0 1000 560.
 */

const STARS: [number, number, number, number][] = [
  [90, 60, 1.4, 0],
  [240, 110, 1, -1],
  [410, 48, 1.6, 1.1],
  [530, 130, 1, -1],
  [660, 70, 1.3, 2],
  [820, 40, 1.1, -1],
  [930, 120, 1.5, 0.6],
  [350, 170, 0.9, -1],
  [760, 160, 0.9, -1],
  [300, 30, 1.2, 1.6],
  [880, 90, 1, 2.4],
];

export const SceneSky = memo(function SceneSky() {
  const id = useId().replace(/:/g, '');
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#060b1e" />
          <stop offset=".36" stopColor="#1a2350" />
          <stop offset=".6" stopColor="#58396a" />
          <stop offset=".77" stopColor="#c25e5a" />
          <stop offset=".88" stopColor="#f29a52" />
          <stop offset="1" stopColor="#ffd27a" />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#ffe7b0" stopOpacity=".95" />
          <stop offset=".35" stopColor="#ffb36b" stopOpacity=".35" />
          <stop offset="1" stopColor="#ff8a4c" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-moon`} cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#f6eed8" stopOpacity=".45" />
          <stop offset="1" stopColor="#f6eed8" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="1000" height="560" fill={`url(#${id}-sky)`} />
      <g fill="#fff">
        {STARS.map(([x, y, r, d], i) =>
          d < 0 ? (
            <circle key={i} cx={x} cy={y} r={r} opacity=".55" />
          ) : (
            <circle key={i} cx={x} cy={y} r={r} className="twinkle" style={{ animationDelay: `${d}s` }} />
          ),
        )}
      </g>
      <circle cx="160" cy="92" r="46" fill={`url(#${id}-moon)`} />
      <path d="M160 72 A20 20 0 1 0 176 106 A16 16 0 1 1 160 72 Z" fill="#f6eed8" opacity=".92" />
      <g className="sunrays" fill="#ffe7b0" opacity=".07">
        {Array.from({ length: 12 }, (_, i) => (
          <path key={i} d="M730 452 L722 0 L738 0 Z" transform={`rotate(${i * 30} 730 452)`} />
        ))}
      </g>
      <circle cx="730" cy="440" r="290" fill={`url(#${id}-glow)`} />
      <circle cx="730" cy="452" r="64" fill="#ffd98a" />
      <circle cx="730" cy="452" r="64" fill="none" stroke="#fff3cf" strokeWidth="2" opacity=".6" />
      <g fill="none" stroke="#1a1428" strokeWidth="2" strokeLinecap="round" opacity=".7">
        <path d="M600 210 q6 -5 12 0 q6 -5 12 0" />
        <path d="M640 196 q4 -4 8 0 q4 -4 8 0" />
        <path d="M668 214 q4 -4 8 0 q4 -4 8 0" />
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

function Cloud({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="0" cy="0" rx="72" ry="14" fill="#3b2e57" opacity=".55" />
      <ellipse cx="-24" cy="-9" rx="34" ry="14" fill="#4a3a68" opacity=".55" />
      <ellipse cx="18" cy="-13" rx="30" ry="16" fill="#4a3a68" opacity=".5" />
      <ellipse cx="0" cy="6" rx="66" ry="7" fill="#ffcf9a" opacity=".38" />
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

export const SceneLand = memo(function SceneLand() {
  const id = useId().replace(/:/g, '');
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-water`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#43375a" />
          <stop offset="1" stopColor="#0a0d18" />
        </linearGradient>
        <linearGradient id={`${id}-mist`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset=".5" stopColor="#ffe9d0" stopOpacity=".16" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* far hills, trees and the manor */}
      <path d="M0 432 C120 404 220 414 320 426 C430 440 520 398 640 410 C760 424 860 398 1000 418 L1000 470 L0 470 Z" fill="#4a3150" opacity=".92" />
      <g fill="#33243f">
        <circle cx="408" cy="420" r="11" />
        <circle cx="424" cy="414" r="14" />
        <circle cx="442" cy="418" r="11" />
        <circle cx="460" cy="412" r="13" />
        <ellipse cx="640" cy="396" rx="5" ry="18" />
        <ellipse cx="652" cy="394" rx="5" ry="21" />
        <ellipse cx="664" cy="398" rx="4.5" ry="16" />
        <circle cx="842" cy="402" r="12" />
        <circle cx="860" cy="396" r="15" />
        <circle cx="880" cy="404" r="11" />
      </g>
      <g fill="#2a1d3a">
        <rect x="512" y="380" width="64" height="26" />
        <path d="M508 381 L544 363 L580 381 Z" />
        <rect x="496" y="388" width="18" height="18" />
        <path d="M494 389 L505 380 L516 389 Z" />
        <rect x="570" y="364" width="13" height="42" />
        <path d="M568 365 L576.5 352 L585 365 Z" />
        <rect x="520" y="360" width="4" height="14" />
        <rect x="556" y="357" width="4" height="14" />
        <path d="M576.5 352 L576.5 344" stroke="#2a1d3a" strokeWidth="1.2" />
        <path d="M576.5 344 L582 346 L576.5 348 Z" />
      </g>
      <g fill="#ffcf6b">
        <rect x="518" y="388" width="3" height="5" className="window-glow" />
        <rect x="528" y="388" width="3" height="5" />
        <rect x="538" y="388" width="3" height="5" />
        <rect x="550" y="388" width="3" height="5" className="window-glow" style={{ animationDelay: '1.3s' }} />
        <rect x="560" y="388" width="3" height="5" />
        <rect x="574" y="374" width="3" height="5" />
        <rect x="502" y="394" width="3" height="5" />
        <rect x="530" y="397" width="3" height="5" opacity=".7" />
      </g>
      <path
        d="M0 452 C40 438 70 446 100 440 C130 432 150 448 190 444 C240 438 270 452 320 448 C380 442 420 454 480 450 C560 444 600 456 680 452 C760 448 820 458 900 450 C940 446 970 452 1000 448 L1000 472 L0 472 Z"
        fill="#221a30"
      />

      {/* water */}
      <rect x="0" y="466" width="1000" height="94" fill={`url(#${id}-water)`} />
      <g stroke="#ffcf80" strokeLinecap="round" opacity=".6">
        <line className="shimmer" x1="676" y1="476" x2="784" y2="476" strokeWidth="3" />
        <line className="shimmer" x1="694" y1="489" x2="766" y2="489" strokeWidth="2.5" style={{ animationDelay: '.5s' }} />
        <line className="shimmer" x1="706" y1="502" x2="754" y2="502" strokeWidth="2" style={{ animationDelay: '1s' }} />
        <line className="shimmer" x1="716" y1="516" x2="744" y2="516" strokeWidth="1.6" style={{ animationDelay: '1.5s' }} />
        <line className="shimmer" x1="722" y1="530" x2="738" y2="530" strokeWidth="1.2" style={{ animationDelay: '2s' }} />
        <line x1="480" y1="496" x2="530" y2="496" strokeWidth="1.2" opacity=".4" />
        <line x1="880" y1="508" x2="930" y2="508" strokeWidth="1.2" opacity=".4" />
      </g>
      <g fill="#2c4630">
        <path d="M470 528 a14 5 0 1 0 1 0 l-8 3 Z" />
        <ellipse cx="520" cy="546" rx="12" ry="4" />
        <ellipse cx="905" cy="534" rx="15" ry="5" />
      </g>
      <circle cx="907" cy="531" r="3" fill="#f2d7e6" />
      <rect className="mist" x="-120" y="452" width="1240" height="34" fill={`url(#${id}-mist)`} />

      {/* reeds on the far bank, swaying */}
      <g className="sway" stroke="#2a2235" strokeWidth="3" strokeLinecap="round" fill="none">
        <path d="M860 470 C862 430 858 410 866 380" />
        <path d="M876 470 C878 440 884 420 880 396" />
        <path d="M900 470 C898 444 906 424 912 404" />
        <path d="M944 470 C940 440 950 420 948 392" />
        <path d="M970 470 C972 444 966 426 976 410" />
      </g>
      <g className="sway" fill="#3a2618">
        <rect x="861" y="376" width="9" height="26" rx="4.5" />
        <rect x="907" y="400" width="9" height="24" rx="4.5" />
        <rect x="943" y="388" width="9" height="26" rx="4.5" />
      </g>
      <g fill="#ffe7a6">
        <circle className="twinkle" cx="520" cy="430" r="1.8" style={{ animationDelay: '.4s' }} />
        <circle className="twinkle" cx="610" cy="412" r="1.5" style={{ animationDelay: '1.7s' }} />
        <circle className="twinkle" cx="820" cy="420" r="1.8" style={{ animationDelay: '2.4s' }} />
        <circle className="twinkle" cx="350" cy="470" r="1.6" style={{ animationDelay: '3s' }} />
      </g>
    </g>
  );
});

const COPING = Array.from({ length: 26 }, (_, i) => i * 13);

/** The bank the hunter stands on, with a dry-stone wall behind him. */
export const SceneBank = memo(function SceneBank() {
  const id = useId().replace(/:/g, '');
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-bank`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#26301f" />
          <stop offset="1" stopColor="#0d110d" />
        </linearGradient>
      </defs>
      <path d="M0 482 L336 494 L336 518 L0 510 Z" fill="#3a3740" />
      <g fill="none" stroke="#28262e" strokeWidth="1.2">
        <path d="M0 494 L336 504 M20 482 L22 494 M60 484 L58 496 M104 485 L106 497 M150 487 L148 498 M196 488 L198 500 M240 490 L238 501 M290 492 L292 503" />
        <path d="M40 496 L42 508 M84 497 L82 509 M128 498 L130 510 M174 500 L172 511 M218 501 L220 513 M266 503 L264 514 M312 504 L314 515" />
      </g>
      <g fill="#4a4652">
        {COPING.map((x) => (
          <rect key={x} x={x} y={480 + x * 0.036} width="9" height="8" rx="2" />
        ))}
      </g>
      <path d="M0 506 C90 486 250 490 390 518 L390 560 L0 560 Z" fill={`url(#${id}-bank)`} />
      <path d="M0 506 C90 486 250 490 390 518" stroke="#3b4a33" strokeWidth="2" fill="none" />
      <g stroke="#3e5232" strokeWidth="2" strokeLinecap="round" fill="none">
        <path d="M60 500 l-4 -12 M64 500 l2 -14 M68 500 l6 -10" />
        <path d="M262 504 l-4 -12 M266 504 l2 -14 M270 504 l6 -10" />
        <path d="M330 512 l-3 -10 M334 512 l2 -12 M338 512 l5 -9" />
      </g>
      <g fill="#e8d27a">
        <circle cx="74" cy="492" r="2" />
        <circle cx="276" cy="496" r="2" />
        <circle cx="96" cy="504" r="1.6" fill="#f2efe6" />
      </g>
    </g>
  );
});

/** Dark reeds that frame the front of the shot. */
export const SceneForeground = memo(function SceneForeground() {
  return (
    <g>
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
    </g>
  );
});
