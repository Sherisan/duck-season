import { useId } from 'react';

/*
 * The crocodile in the lake: its eyes and snout lurking at the surface, and its head lunging out
 * with the jaws open. Both face right and are drawn around the origin in scene units.
 */

const SKIN_DARK = '#1e3219';
const SCUTE = '#2a4421';
const IVORY = '#fbf4dc';

/** Upper teeth along the jaw line: [x, length]; the longest are the canines. */
const UPPER_TEETH: [number, number][] = [
  [9, 5],
  [18, 6],
  [27, 7],
  [37, 7],
  [47, 10],
  [57, 7],
  [67, 6],
  [77, 7],
  [87, 6],
  [97, 10],
  [106, 7],
  [114, 5],
];
/** Lower teeth: [x, length]; the fourth (at 30) is the big one that shows even with the jaws shut. */
const LOWER_TEETH: [number, number][] = [
  [12, 5],
  [21, 6],
  [30, 12],
  [40, 6],
  [50, 7],
  [60, 6],
  [70, 7],
  [80, 6],
  [90, 6],
  [100, 7],
  [109, 5],
];

/** One conical tooth from the jaw line at (x, 0), `dir` 1 pointing down, -1 up. */
function tooth(x: number, len: number, dir: 1 | -1) {
  const w = len > 9 ? 3.4 : 2.6;
  return `M${x - w} 0 Q${x - w * 0.3} ${(len * 0.75 * dir).toFixed(1)} ${x + 0.5} ${len * dir} Q${x + w * 0.5} ${(len * 0.55 * dir).toFixed(1)} ${x + w} 0 Z`;
}

/** Keeled scutes in a row along a back: bumps from x0 to x1 at height y, of size s. */
function scutes(x0: number, x1: number, y: number, s: number) {
  let d = '';
  for (let x = x0; x < x1; x += s * 1.7) d += `M${x} ${y} q${s * 0.85} ${-s * 1.25} ${s * 1.7} 0 Z`;
  return d;
}

/** Eye on its raised socket at (x, y): gold iris, slit pupil, a glint, and the brow ridge above. */
function Eye({ x, y, r, iris }: { x: number; y: number; r: number; iris: string }) {
  return (
    <g>
      <ellipse cx={x} cy={y + r * 0.1} rx={r * 1.9} ry={r * 1.45} fill={SCUTE} />
      <ellipse cx={x} cy={y} rx={r} ry={r * 0.82} fill={iris} />
      <ellipse cx={x} cy={y} rx={r * 0.2} ry={r * 0.78} fill="#140e04" />
      <circle cx={x - r * 0.35} cy={y - r * 0.32} r={r * 0.22} fill="#fff" opacity=".9" />
      <path
        d={`M${x - r * 1.6} ${y - r * 0.7} Q${x} ${y - r * 1.9} ${x + r * 1.6} ${y - r * 0.8}`}
        stroke={SKIN_DARK}
        strokeWidth={r * 0.45}
        strokeLinecap="round"
        fill="none"
      />
    </g>
  );
}

/** Eyes, brow ridges, snout tip and back scutes just breaking the water, with the body a shadow below. */
export function CrocLurk() {
  const id = useId().replace(/:/g, '');
  const u = (n: string) => `url(#${id}-${n})`;
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-iris`} cx=".45" cy=".4" r=".6">
          <stop offset="0" stopColor="#fff2a8" />
          <stop offset=".55" stopColor="#f4c03a" />
          <stop offset="1" stopColor="#b9780f" />
        </radialGradient>
        <linearGradient id={`${id}-skin`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5e8a46" />
          <stop offset="1" stopColor="#2c4824" />
        </linearGradient>
      </defs>
      {/* the long body, a dark shape under the surface */}
      <path
        d="M-120 5 C-90 1 -40 0 10 2 C40 3 58 4 64 6 C40 12 -40 14 -120 11 Z"
        fill="#06120c"
        opacity=".38"
      />
      {/* back scutes breaking the surface */}
      <path d={scutes(-96, -34, 1.5, 4)} fill={u('skin')} />
      <path d={scutes(-90, -40, 1.5, 2.6)} fill={SKIN_DARK} opacity=".5" />
      {/* the top of the skull between the eyes */}
      <path d="M-18 1.5 C-16 -4 -4 -6 6 -6 C16 -6 26 -4 28 1.5 Z" fill={u('skin')} />
      <Eye x={-7} y={-5} r={3.4} iris={u('iris')} />
      <Eye x={17} y={-5} r={3.4} iris={u('iris')} />
      {/* snout tip with its nostril dome, out ahead */}
      <path d="M44 1.5 C44 -5 50 -7.5 55 -7.5 C61 -7.5 66 -5 66 1.5 Z" fill={u('skin')} />
      <path
        d="M50 -4 q2 -1.4 4 0 M57 -4 q2 -1.4 4 0"
        stroke={SKIN_DARK}
        strokeWidth="1.3"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M47 -5 Q55 -9 63 -5" stroke="#a8cf86" strokeWidth=".9" fill="none" opacity=".55" />
      {/* the water line, and a little wake around each part */}
      <path d="M-104 1.8 H72" stroke="#cfe6ff" strokeWidth="1.1" strokeLinecap="round" opacity=".5" />
      <g stroke="#cfe6ff" strokeWidth=".9" fill="none" opacity=".4" strokeLinecap="round">
        <path d="M-22 3.5 q10 3 22 3 q12 0 32 -3" />
        <path d="M40 3.5 q14 3 30 -1" />
      </g>
    </g>
  );
}

/** A point on a cubic Bézier [x0 y0 x1 y1 x2 y2 x3 y3] at t. */
function bez(s: number[], tt: number) {
  const m = 1 - tt;
  const a = m * m * m,
    b = 3 * m * m * tt,
    c = 3 * m * tt * tt,
    d = tt * tt * tt;
  return { x: a * s[0] + b * s[2] + c * s[4] + d * s[6], y: a * s[1] + b * s[3] + c * s[5] + d * s[7] };
}

/** The leaper's back, neck to tail tip, as three cubic segments (the body outline follows them). */
const BACK = [
  [-6, -30, -40, -44, -110, -56, -190, -54],
  [-190, -54, -260, -52, -330, -40, -390, -26],
  [-390, -26, -430, -18, -470, -8, -510, 0],
];
const BODY =
  'M-6 -30 C-40 -44 -110 -56 -190 -54 C-260 -52 -330 -40 -390 -26 C-430 -18 -470 -8 -510 0 ' +
  'C-470 9 -430 18 -390 28 C-336 42 -270 58 -190 60 C-120 62 -56 50 -6 24 Z';

/** Keeled scutes along the back: rows of bumps set on the outline (`dy` below it), largest on the tail crest. */
const BACK_SCUTES = (() => {
  const rows = ['', '', ''];
  BACK.forEach((seg, si) => {
    const n = si === 2 ? 9 : 11;
    for (let i = 0; i < n; i++) {
      const pt = bez(seg, (i + 0.5) / n);
      if (pt.x > -24) continue;
      const tail = pt.x < -380;
      const s = tail ? 6.5 - (i / n) * 3 : 5.2;
      rows[0] += `M${(pt.x - s).toFixed(1)} ${(pt.y + 1.5).toFixed(1)} l${s.toFixed(1)} ${(-s * (tail ? 1.9 : 1.3)).toFixed(1)} l${s.toFixed(1)} ${(s * (tail ? 1.9 : 1.3)).toFixed(1)} Z`;
      if (!tail) {
        rows[1] += `M${(pt.x - 4).toFixed(1)} ${(pt.y + 10).toFixed(1)} q4 -5 8 0 Z`;
        rows[2] += `M${(pt.x - 3).toFixed(1)} ${(pt.y + 18).toFixed(1)} q3 -4 6 0 Z`;
      }
    }
  });
  return rows;
})();

/** One splayed leg with a clawed foot: `d` is the limb, the claws are drawn at its toes. */
function Leg({ d, toes, fill }: { d: string; toes: [number, number][]; fill: string }) {
  return (
    <g>
      <path d={d} fill={fill} />
      {toes.map(([x, y]) => (
        <path
          key={`${x},${y}`}
          d={`M${x} ${y} l-5 3`}
          stroke={IVORY}
          strokeWidth="2"
          strokeLinecap="round"
          opacity=".85"
        />
      ))}
    </g>
  );
}

/**
 * The whole crocodile leaping, facing right with the jaw hinge at the origin: a heavy armoured
 * body with a humped back, a thick crested tail and big splayed legs behind the head.
 */
export function CrocLeaper({ open }: { open: number }) {
  const id = useId().replace(/:/g, '');
  const u = (n: string) => `url(#${id}-${n})`;
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6e9e50" />
          <stop offset=".38" stopColor="#3c602d" />
          <stop offset=".62" stopColor="#5d6a3a" />
          <stop offset=".8" stopColor="#bdb47c" />
          <stop offset="1" stopColor="#e6ddaa" />
        </linearGradient>
        <linearGradient id={`${id}-leg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4d7638" />
          <stop offset="1" stopColor="#25391d" />
        </linearGradient>
        <pattern id={`${id}-scales`} width="13" height="9" patternUnits="userSpaceOnUse">
          <rect
            x="1"
            y="1"
            width="11"
            height="7"
            rx="3"
            fill="none"
            stroke={SKIN_DARK}
            strokeWidth=".9"
            opacity=".4"
          />
        </pattern>
      </defs>

      {/* far legs, splayed out behind the body */}
      <Leg
        d="M-108 18 C-104 42 -116 62 -138 76 L-152 80 L-146 71 L-156 69 L-145 63 L-152 58 L-138 57 C-128 50 -124 38 -130 20 Z"
        toes={[
          [-152, 80],
          [-156, 69],
          [-152, 58],
        ]}
        fill={SKIN_DARK}
      />
      <Leg
        d="M-306 16 C-304 42 -322 64 -350 78 L-366 80 L-358 71 L-370 68 L-357 62 L-364 57 L-348 56 C-334 48 -328 34 -332 14 Z"
        toes={[
          [-366, 80],
          [-370, 68],
          [-364, 57],
        ]}
        fill={SKIN_DARK}
      />

      {/* the body and tail: green back, darker flanks, pale ribbed belly */}
      <path d={BODY} fill={u('body')} />
      <path d={BODY} fill={u('scales')} />
      <g stroke="#a99f69" strokeWidth="1.1" opacity=".6">
        {[-40, -66, -92, -118, -144, -170, -196, -222, -248, -274, -300, -326].map((x) => {
          const y = x > -190 ? 40 + (x + 190) * -0.1 : 40 + (x + 190) * 0.09;
          return <path key={x} d={`M${x} ${y.toFixed(1)} v${(14 - Math.abs(x + 180) * 0.025).toFixed(1)}`} />;
        })}
      </g>
      {/* three rows of armour down the back, rising into the tail's double crest */}
      <path d={BACK_SCUTES[2]} fill={SKIN_DARK} opacity=".45" />
      <path d={BACK_SCUTES[1]} fill={SCUTE} opacity=".8" />
      <path d={BACK_SCUTES[0]} fill={SCUTE} />
      {/* wet sheen along the back */}
      <path
        d="M-20 -36 C-60 -48 -120 -56 -190 -54 C-250 -53 -310 -44 -360 -32"
        stroke="#a9d68a"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
        opacity=".4"
      />

      {/* near legs, over the body, with clawed feet */}
      <Leg
        d="M-86 6 C-74 28 -80 50 -100 66 C-108 72 -120 77 -134 80 L-150 85 L-143 76 L-155 73 L-141 68 L-149 62 L-133 61 C-118 55 -112 40 -116 14 Z"
        toes={[
          [-150, 85],
          [-155, 73],
          [-149, 62],
        ]}
        fill={u('leg')}
      />
      <Leg
        d="M-262 4 C-240 26 -248 56 -274 74 C-286 81 -302 85 -318 87 L-336 92 L-328 82 L-341 79 L-326 73 L-335 67 L-316 66 C-298 60 -290 44 -296 10 Z"
        toes={[
          [-336, 92],
          [-341, 79],
          [-335, 67],
        ]}
        fill={u('leg')}
      />

      <CrocHead open={open} neck={false} />
    </g>
  );
}

/**
 * The head, facing right with the jaw hinge at the origin; `open` is the gape in degrees. The
 * neck runs back to the left, into the water (left off when the leaper's body takes its place).
 */
export function CrocHead({ open, neck = true }: { open: number; neck?: boolean }) {
  const id = useId().replace(/:/g, '');
  const u = (n: string) => `url(#${id}-${n})`;
  const half = open / 2;
  const r = (deg: number) => (deg * Math.PI) / 180;
  // the open mouth: a pink wedge between the inner edges of the two jaws
  const L = 104;
  const ux = L * Math.cos(r(-half));
  const uy = L * Math.sin(r(-half));
  const lx = L * Math.cos(r(half));
  const ly = L * Math.sin(r(half));
  // the front edge curves well back towards the throat, so the gape opens onto the sky
  const mouth = `M-6 0 L${ux.toFixed(1)} ${uy.toFixed(1)} Q${((ux + lx) / 2 - 48).toFixed(1)} ${((uy + ly) / 2).toFixed(1)} ${lx.toFixed(1)} ${ly.toFixed(1)} Z`;

  return (
    <g>
      <defs>
        <linearGradient id={`${id}-skin`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6b9a4f" />
          <stop offset=".45" stopColor="#40652f" />
          <stop offset="1" stopColor="#24391c" />
        </linearGradient>
        <linearGradient id={`${id}-neck`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#557f3e" />
          <stop offset=".55" stopColor="#35552a" />
          <stop offset=".78" stopColor="#8e8a55" />
          <stop offset="1" stopColor="#d8cd96" />
        </linearGradient>
        <linearGradient id={`${id}-jaw`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4a7236" />
          <stop offset=".5" stopColor="#7e8450" />
          <stop offset="1" stopColor="#e2d7a2" />
        </linearGradient>
        <radialGradient id={`${id}-mouth`} cx=".1" cy=".5" r=".95">
          <stop offset="0" stopColor="#5a1820" />
          <stop offset=".5" stopColor="#a83c45" />
          <stop offset="1" stopColor="#e07c78" />
        </radialGradient>
        <linearGradient id={`${id}-tooth`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={IVORY} />
          <stop offset="1" stopColor="#d6c896" />
        </linearGradient>
        <radialGradient id={`${id}-iris`} cx=".45" cy=".4" r=".6">
          <stop offset="0" stopColor="#fff2a8" />
          <stop offset=".55" stopColor="#f4c03a" />
          <stop offset="1" stopColor="#b9780f" />
        </radialGradient>
        <pattern id={`${id}-scales`} width="9" height="7" patternUnits="userSpaceOnUse">
          <rect
            x=".8"
            y=".8"
            width="7.4"
            height="5.4"
            rx="2.2"
            fill="none"
            stroke={SKIN_DARK}
            strokeWidth=".8"
            opacity=".45"
          />
        </pattern>
      </defs>

      {/* neck and shoulders, scaly, with the pale throat underneath */}
      {neck && (
        <g>
          <path d="M2 -24 C-24 -32 -70 -32 -140 -24 L-140 32 C-80 36 -36 34 4 22 Z" fill={u('neck')} />
          <path d="M2 -24 C-24 -32 -70 -32 -140 -24 L-140 32 C-80 36 -36 34 4 22 Z" fill={u('scales')} />
          <path d="M-130 24 C-90 27 -50 26 -6 17" stroke="#b8ad78" strokeWidth="1" fill="none" opacity=".7" />
          <g stroke="#9c935f" strokeWidth=".9" opacity=".6">
            {[-118, -102, -86, -70, -54, -38, -22].map((x) => (
              <path key={x} d={`M${x} ${24 + (x + 140) * 0.01} v9`} />
            ))}
          </g>
          {/* two rows of armoured scutes down the back of the neck */}
          <path d={scutes(-136, -10, -28, 5)} fill={SCUTE} />
          <path d={scutes(-132, -16, -23, 3.6)} fill={SKIN_DARK} opacity=".55" />
          <path
            d="M-136 -27 C-90 -33 -40 -33 0 -26"
            stroke="#8fbd70"
            strokeWidth="1"
            fill="none"
            opacity=".35"
          />
        </g>
      )}

      {/* the open mouth behind the jaws, with the tongue */}
      <path d={mouth} fill={u('mouth')} />
      <g transform={`rotate(${half})`}>
        <path d="M2 -1 C14 -6 40 -6 58 -2 C40 0 16 1 2 1 Z" fill="#d86f74" opacity=".9" />
      </g>

      {/* lower jaw: scaly side, pale underside, teeth pointing up */}
      <g transform={`rotate(${half})`}>
        <path
          d="M-12 0 C10 1 40 -1 70 0 C90 1 104 -1 116 0 C122 1 124 5 120 8 C110 13 80 16 50 18 C26 20 6 22 -12 20 Z"
          fill={u('jaw')}
        />
        <path
          d="M-12 0 C10 1 40 -1 70 0 C90 1 104 -1 116 0 C122 1 124 5 120 8 C110 13 80 16 50 18 C26 20 6 22 -12 20 Z"
          fill={u('scales')}
          opacity=".6"
        />
        <path d="M-10 4 C30 3 80 3 118 3" stroke={SKIN_DARK} strokeWidth="1.2" fill="none" opacity=".5" />
        {LOWER_TEETH.map(([x, len]) => (
          <path key={x} d={tooth(x, len, -1)} fill={u('tooth')} stroke="#a89a68" strokeWidth=".4" />
        ))}
      </g>

      {/* upper jaw and skull: the eye on its socket, the long snout, the nostril dome, teeth pointing down */}
      <g transform={`rotate(${-half})`}>
        {UPPER_TEETH.map(([x, len]) => (
          <path key={x} d={tooth(x, len, 1)} fill={u('tooth')} stroke="#a89a68" strokeWidth=".4" />
        ))}
        <path
          d="M-14 -24 C-6 -30 2 -31 8 -33 C14 -42 32 -42 36 -31 C50 -25 74 -23 98 -19 C104 -18 108 -22 114 -21 C121 -20 126 -13 124 -6 C123 -2 120 0 116 1 C102 1 96 3 84 2 C70 1 60 3 48 2 C34 1 18 3 2 3 L-14 3 Z"
          fill={u('skin')}
        />
        <path
          d="M-14 -24 C-6 -30 2 -31 8 -33 C14 -42 32 -42 36 -31 C50 -25 74 -23 98 -19 C104 -18 108 -22 114 -21 C121 -20 126 -13 124 -6 C123 -2 120 0 116 1 C102 1 96 3 84 2 C70 1 60 3 48 2 C34 1 18 3 2 3 L-14 3 Z"
          fill={u('scales')}
          opacity=".7"
        />
        {/* the lip line, darker, waving over the big teeth */}
        <path
          d="M2 1.5 C18 1.5 34 -0.5 48 0.5 C60 1.5 70 -0.5 84 0.5 C96 1.5 104 -0.5 116 -0.5"
          stroke={SKIN_DARK}
          strokeWidth="1.6"
          fill="none"
        />
        {/* knobbly scales along the top of the snout */}
        <g fill={SKIN_DARK} opacity=".5">
          {[44, 54, 64, 74, 84, 94].map((x, i) => (
            <ellipse key={x} cx={x} cy={-21 + i * 0.4} rx="3" ry="1.6" />
          ))}
          {[50, 62, 74, 86].map((x) => (
            <ellipse key={x} cx={x} cy={-12} rx="2.4" ry="1.3" />
          ))}
        </g>
        {/* nostril dome at the tip */}
        <path d="M106 -21 C108 -27 120 -27 122 -20 Z" fill="#4f7a3d" />
        <path
          d="M110 -23 q2 -1.5 4 0 M116 -23 q2 -1.5 4 0"
          stroke={SKIN_DARK}
          strokeWidth="1.2"
          strokeLinecap="round"
          fill="none"
        />
        {/* wet highlights along the skull and snout */}
        <path
          d="M-10 -26 C0 -31 6 -32 10 -34 M38 -29 C56 -24 78 -22 100 -19"
          stroke="#b7e09a"
          strokeWidth="1.3"
          strokeLinecap="round"
          fill="none"
          opacity=".5"
        />
        {/* the eye on its raised socket, and a scute row over the back of the skull */}
        <Eye x={22} y={-32} r={4.6} iris={u('iris')} />
        <path d={scutes(-12, 4, -27, 3.4)} fill={SCUTE} />
      </g>
    </g>
  );
}
