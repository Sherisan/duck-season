import { useId } from 'react';

/*
 * The crocodile that leaps out of the lake for a fallen duck: a body that bends along its arc,
 * and a head with jaws that open. Both face right and are drawn around the origin in scene units.
 */

const SKIN_DARK = '#1e3219';
const SCUTE = '#2a4421';
const IVORY = '#fbf4dc';

/** Little bumps (papillae) on the tongue: [x, how far up its surface, 0 to 1]. */
const PAPILLAE: [number, number][] = [
  [8, 0.4], [14, 0.7], [20, 0.35], [26, 0.62], [32, 0.3], [38, 0.72], [44, 0.45], [50, 0.25], [56, 0.6], [62, 0.38], [68, 0.55],
];

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

/* ---- the leaping crocodile: a body built along a bending spine ----------------------------- */

/** Length of the body and tail, neck to tail tip, and how many slices it is built from. */
const LENGTH = 510;
const SLICES = 40;
/** The leaper's head is drawn this much larger than the lunging one, so it reads at its smaller size on stage. */
export const LEAPER_HEAD = 1.3;

/** Height of the back above the spine, and depth of the belly below it, along the body (0 neck, 1 tail tip). */
const TOP: [number, number][] = [
  [0, 33],
  [0.1, 42],
  [0.33, 56],
  [0.5, 50],
  [0.64, 38],
  [0.78, 24],
  [0.9, 11],
  [1, 1.2],
];
const BOT: [number, number][] = [
  [0, 27],
  [0.1, 40],
  [0.32, 60],
  [0.48, 55],
  [0.62, 41],
  [0.76, 26],
  [0.88, 13],
  [1, 1.2],
];

/** A smooth value through knots [s, v] at s (Hermite, with Catmull-Rom slopes). */
function profile(k: [number, number][], s: number) {
  const n = k.length;
  let i = 0;
  while (i < n - 2 && s > k[i + 1][0]) i++;
  const slope = (j: number) => {
    const a = k[Math.max(0, j - 1)];
    const b = k[Math.min(n - 1, j + 1)];
    return (b[1] - a[1]) / (b[0] - a[0]);
  };
  const [s1, v1] = k[i];
  const [s2, v2] = k[i + 1];
  const h = s2 - s1;
  const u = Math.min(1, Math.max(0, (s - s1) / h));
  const u2 = u * u;
  const u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * v1 + (u3 - 2 * u2 + u) * h * slope(i) + (3 * u2 - 2 * u3) * v2 + (u3 - u2) * h * slope(i + 1);
}

/** One slice of the body: its point on the spine, the way to the tail (d), the way to the back (u), and its size. */
type Slice = { s: number; x: number; y: number; dx: number; dy: number; ux: number; uy: number; top: number; bot: number };

const TOPS = Array.from({ length: SLICES + 1 }, (_, i) => profile(TOP, i / SLICES));
const BOTS = Array.from({ length: SLICES + 1 }, (_, i) => profile(BOT, i / SLICES));

/**
 * The spine from the neck back to the tail tip. It runs straight back from the head and curls down
 * by `bend` degrees over its length, with the tail whipping by `swish` (radians) on top of that.
 */
function buildSpine(bend: number, t: number, swish: number): Slice[] {
  const b = (bend * Math.PI) / 180;
  const heading = (s: number) => Math.PI - b * s - swish * Math.sin(t * 13 - s * 6) * s * s;
  const out: Slice[] = [];
  let x = 4;
  let y = 1;
  for (let i = 0; i <= SLICES; i++) {
    const s = i / SLICES;
    const th = heading(s);
    const dx = Math.cos(th);
    const dy = Math.sin(th);
    out.push({ s, x, y, dx, dy, ux: -dy, uy: dx, top: TOPS[i], bot: BOTS[i] });
    const mid = heading(s + 0.5 / SLICES);
    x += Math.cos(mid) * (LENGTH / SLICES);
    y += Math.sin(mid) * (LENGTH / SLICES);
  }
  return out;
}

/** The slice at any s, between the built ones. */
function sliceAt(sp: Slice[], s: number): Slice {
  const f = Math.min(SLICES - 1e-6, Math.max(0, s * SLICES));
  const i = Math.floor(f);
  const k = f - i;
  const a = sp[i];
  const b = sp[i + 1];
  const mix = (p: number, q: number) => p + (q - p) * k;
  return {
    s,
    x: mix(a.x, b.x),
    y: mix(a.y, b.y),
    dx: mix(a.dx, b.dx),
    dy: mix(a.dy, b.dy),
    ux: mix(a.ux, b.ux),
    uy: mix(a.uy, b.uy),
    top: mix(a.top, b.top),
    bot: mix(a.bot, b.bot),
  };
}

type Pt = [number, number];
const n1 = (v: number) => v.toFixed(1);
/** The point `off` from the spine at a slice: up towards the back if positive, down to the belly if negative. */
const at = (f: Slice, off: number, along = 0): Pt => [f.x + f.ux * off + f.dx * along, f.y + f.uy * off + f.dy * along];

/** A smooth path through points (Catmull-Rom), closed or open. */
function smooth(pts: Pt[], close = true) {
  const n = pts.length;
  const p = (i: number) => pts[close ? (i + n) % n : Math.max(0, Math.min(n - 1, i))];
  let d = `M${n1(pts[0][0])} ${n1(pts[0][1])}`;
  for (let i = 0; i < (close ? n : n - 1); i++) {
    const p0 = p(i - 1);
    const p1 = p(i);
    const p2 = p(i + 1);
    const p3 = p(i + 2);
    d += ` C${n1(p1[0] + (p2[0] - p0[0]) / 6)} ${n1(p1[1] + (p2[1] - p0[1]) / 6)} ${n1(p2[0] - (p3[0] - p1[0]) / 6)} ${n1(p2[1] - (p3[1] - p1[1]) / 6)} ${n1(p2[0])} ${n1(p2[1])}`;
  }
  return close ? `${d} Z` : d;
}

/** A band along the body between two offsets from the spine (each a function of the slice), from s0 to s1. */
function band(sp: Slice[], a: (f: Slice) => number, b: (f: Slice) => number, s0 = 0, s1 = 1) {
  const fs = sp.filter((f) => f.s >= s0 - 1e-6 && f.s <= s1 + 1e-6);
  return smooth([...fs.map((f) => at(f, a(f))), ...fs.reverse().map((f) => at(f, b(f)))]);
}

const poly = (pts: Pt[]) => `M${pts.map(([x, y]) => `${n1(x)} ${n1(y)}`).join(' L')} Z`;

/** A leg drawn in the body's rest pose, swung about its shoulder `a`; `s` and `off` place the shoulder on the body. */
type LegDef = { d: string; a: Pt; s: number; off: number; toes: Pt[] };

const FRONT_NEAR: LegDef = {
  d: 'M-86 6 C-74 28 -80 50 -100 66 C-108 72 -120 77 -134 80 L-150 85 L-143 76 L-155 73 L-141 68 L-149 62 L-133 61 C-118 55 -112 40 -116 14 Z',
  a: [-101, 10],
  s: 0.206,
  off: -9,
  toes: [
    [-150, 85],
    [-155, 73],
    [-149, 62],
  ],
};
const FRONT_FAR: LegDef = {
  d: 'M-108 18 C-104 42 -116 62 -138 76 L-152 80 L-146 71 L-156 69 L-145 63 L-152 58 L-138 57 C-128 50 -124 38 -130 20 Z',
  a: [-119, 19],
  s: 0.241,
  off: -16,
  toes: [
    [-152, 80],
    [-156, 69],
    [-152, 58],
  ],
};
const HIND_NEAR: LegDef = {
  d: 'M-262 4 C-240 26 -248 56 -274 74 C-286 81 -302 85 -318 87 L-336 92 L-328 82 L-341 79 L-326 73 L-335 67 L-316 66 C-298 60 -290 44 -296 10 Z',
  a: [-279, 7],
  s: 0.555,
  off: -6,
  toes: [
    [-336, 92],
    [-341, 79],
    [-335, 67],
  ],
};
const HIND_FAR: LegDef = {
  d: 'M-306 16 C-304 42 -322 64 -350 78 L-366 80 L-358 71 L-370 68 L-357 62 L-364 57 L-348 56 C-334 48 -328 34 -332 14 Z',
  a: [-319, 15],
  s: 0.633,
  off: -12,
  toes: [
    [-366, 80],
    [-370, 68],
    [-364, 57],
  ],
};

/** A leg on the bending body: its shoulder rides the spine and it turns with it, plus its own `swing` (degrees). */
function Leg({ sp, leg, swing, fill }: { sp: Slice[]; leg: LegDef; swing: number; fill: string }) {
  const f = sliceAt(sp, leg.s);
  const [px, py] = at(f, leg.off);
  // the body's turn at the shoulder, from the rest pose where the tail points straight back
  const turn = (Math.atan2(-f.dy, -f.dx) * 180) / Math.PI;
  return (
    <g transform={`translate(${n1(px)} ${n1(py)}) rotate(${n1(turn + swing)}) translate(${-leg.a[0]} ${-leg.a[1]})`}>
      <path d={leg.d} fill={fill} />
      <path d={leg.d} fill="none" stroke={SKIN_DARK} strokeWidth="1" opacity=".5" />
      {leg.toes.map(([x, y]) => (
        <path key={`${x},${y}`} d={`M${x} ${y} l-6 3.5`} stroke={IVORY} strokeWidth="2.2" strokeLinecap="round" opacity=".9" />
      ))}
    </g>
  );
}

/**
 * The whole crocodile leaping, facing right with the jaw hinge at the origin. Its body is built
 * along a spine, so it can bend: `bend` (degrees) curls the body and tail down behind the head,
 * as when it follows its arc through the air; `t` (seconds) drives the whipping tail, paddling legs
 * and dripping water; `reach` (0 to 1) swings the legs from tucked back to reaching forward; `wet`
 * (0 to 1) is how much water still streams off it; `open` is the jaws' gape in degrees.
 */
export function CrocLeaper({
  open,
  bend = 0,
  t = 0,
  reach = 0,
  wet = 0,
  swish = 0.22,
}: {
  open: number;
  bend?: number;
  t?: number;
  reach?: number;
  wet?: number;
  swish?: number;
}) {
  const id = useId().replace(/:/g, '');
  const u = (n: string) => `url(#${id}-${n})`;
  const sp = buildSpine(bend, t, swish);

  // the outline, and the bands that shade it: lit back, dark flank, pale ribbed belly
  const body = band(sp, (f) => f.top, (f) => -f.bot);
  const back = band(sp, (f) => f.top * 0.97, (f) => f.top * 0.4, 0, 0.975);
  const backSoft = band(sp, (f) => f.top * 0.4, (f) => f.top * 0.05, 0, 0.9);
  const belly = band(sp, (f) => -f.bot * 0.34, (f) => -f.bot * 0.985, 0, 0.94);
  const bellyEdge = band(sp, (f) => -f.bot * 0.34, (f) => -f.bot * 0.5, 0, 0.9);
  const sheen = smooth(
    sp.filter((f) => f.s > 0.03 && f.s < 0.78).map((f) => at(f, f.top * 0.86)),
    false,
  );
  const flankLine = smooth(
    sp.filter((f) => f.s < 0.9).map((f) => at(f, -f.bot * 0.34)),
    false,
  );

  // ribs across the belly
  let ribs = '';
  for (let s = 0.05; s < 0.8; s += 0.032) {
    const f = sliceAt(sp, s);
    const [x1, y1] = at(f, -f.bot * 0.52);
    const [x2, y2] = at(f, -f.bot * 0.94);
    ribs += `M${n1(x1)} ${n1(y1)} L${n1(x2)} ${n1(y2)}`;
  }

  // dark chevron bands round the tail, and mottling on the flank
  const tailBands = [0.47, 0.555, 0.64, 0.72, 0.795, 0.865, 0.93].map((s, k) => {
    const w = 0.032 - k * 0.002;
    const a = sliceAt(sp, s);
    const b = sliceAt(sp, s + w);
    const m0 = sliceAt(sp, s + 0.014);
    const m1 = sliceAt(sp, s + w + 0.014);
    return poly([at(a, a.top), at(b, b.top), at(m1, 0), at(b, -b.bot * 0.32), at(a, -a.bot * 0.32), at(m0, 0)]);
  });
  const spots = [0.1, 0.15, 0.2, 0.26, 0.31, 0.37, 0.42].map((s, k) => {
    const f = sliceAt(sp, s);
    const [x, y] = at(f, f.top * (k % 2 ? 0.22 : 0.08));
    return { x, y, a: (Math.atan2(f.dy, f.dx) * 180) / Math.PI, r: 5 + (k % 3) };
  });

  // armour: keeled scutes on the back that rise into a double crest down the tail, and two inner rows
  let crest = '';
  let crest2 = '';
  let rowA = '';
  let rowB = '';
  for (let s = 0.05; s < 0.985; s += 0.026) {
    const f = sliceAt(sp, s);
    const tail = s > 0.6;
    const w = tail ? 6.5 - (s - 0.6) * 9 : 5;
    const h = tail ? 13 - (s - 0.6) * 18 : 6.5;
    const [bx, by] = at(f, f.top - 1.5);
    const [ax, ay] = at(f, f.top - 1.5 + h, w * 0.45);
    crest += `M${n1(bx - f.dx * w)} ${n1(by - f.dy * w)} L${n1(ax)} ${n1(ay)} L${n1(bx + f.dx * w)} ${n1(by + f.dy * w)} Z`;
    if (tail) {
      const g = sliceAt(sp, s + 0.013);
      const [cx, cy] = at(g, g.top - 2.5);
      const [tx, ty] = at(g, g.top - 2.5 + h * 0.8, w * 0.45);
      crest2 += `M${n1(cx - g.dx * w * 0.8)} ${n1(cy - g.dy * w * 0.8)} L${n1(tx)} ${n1(ty)} L${n1(cx + g.dx * w * 0.8)} ${n1(cy + g.dy * w * 0.8)} Z`;
    } else {
      const [x1, y1] = at(f, f.top * 0.76);
      const [q1x, q1y] = at(f, f.top * 0.76 + 6, 0);
      rowA += `M${n1(x1 - f.dx * 4.5)} ${n1(y1 - f.dy * 4.5)} Q${n1(q1x)} ${n1(q1y)} ${n1(x1 + f.dx * 4.5)} ${n1(y1 + f.dy * 4.5)} Z`;
      const [x2, y2] = at(f, f.top * 0.52, 6);
      const [q2x, q2y] = at(f, f.top * 0.52 + 4.5, 6);
      rowB += `M${n1(x2 - f.dx * 3.4)} ${n1(y2 - f.dy * 3.4)} Q${n1(q2x)} ${n1(q2y)} ${n1(x2 + f.dx * 3.4)} ${n1(y2 + f.dy * 3.4)} Z`;
    }
  }

  // the legs: swept back along the body for the jump, reaching forward for the landing, paddling as it goes
  const paddle = (phase: number) => Math.sin(t * 15 + phase) * 7 * (1 - reach);
  const frontSwing = 30 - 66 * reach;
  const hindSwing = 34 - 44 * reach;

  // water running off the belly and dripping from the tail
  const drips =
    wet > 0
      ? Array.from({ length: 11 }, (_, k) => {
          const s = 0.1 + k * 0.08;
          const f = sliceAt(sp, s);
          const p = (t * 2.6 + k * 0.37) % 1;
          const [x, y] = at(f, -f.bot - p * 30, p * 6);
          return { x, y, r: (k % 2 ? 1.8 : 2.4) * (1 - p * 0.6), o: (1 - p) * wet };
        })
      : [];

  return (
    <g>
      <defs>
        <linearGradient id={`${id}-leg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#527d3c" />
          <stop offset="1" stopColor="#25391d" />
        </linearGradient>
        <pattern id={`${id}-scales`} width="13" height="9" patternUnits="userSpaceOnUse">
          <rect x="1" y="1" width="11" height="7" rx="3" fill="none" stroke={SKIN_DARK} strokeWidth=".9" opacity=".4" />
        </pattern>
      </defs>

      {/* far legs, behind the body */}
      <Leg sp={sp} leg={FRONT_FAR} swing={frontSwing + 10 + paddle(1.6)} fill={SKIN_DARK} />
      <Leg sp={sp} leg={HIND_FAR} swing={hindSwing + 8 + paddle(3.8)} fill={SKIN_DARK} />

      {/* the body and tail */}
      <path d={body} fill="#3b5f2e" />
      <path d={backSoft} fill="#58833f" opacity=".55" />
      <path d={back} fill="#6c9c4f" opacity=".85" />
      <path d={belly} fill="#d8cd96" />
      <path d={bellyEdge} fill="#9f9862" opacity=".55" />
      <path d={ribs} fill="none" stroke="#a99f69" strokeWidth="1.2" opacity=".7" />
      <path d={flankLine} stroke="#2b4422" strokeWidth="1.4" fill="none" opacity=".55" />
      <path d={body} fill={u('scales')} />
      <g fill={SKIN_DARK} opacity=".42">
        {tailBands.map((d, k) => (
          <path key={k} d={d} />
        ))}
        {spots.map((p, k) => (
          <ellipse key={k} cx={p.x} cy={p.y} rx={p.r} ry={p.r * 0.55} transform={`rotate(${n1(p.a)} ${n1(p.x)} ${n1(p.y)})`} />
        ))}
      </g>

      {/* armour down the back, rising into the tail's double crest */}
      <path d={rowB} fill={SKIN_DARK} opacity=".45" />
      <path d={rowA} fill={SCUTE} opacity=".85" />
      <path d={crest2} fill={SKIN_DARK} />
      <path d={crest} fill={SCUTE} />
      <path d={sheen} stroke="#b4de94" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity=".45" />

      {/* near legs, over the body */}
      <Leg sp={sp} leg={FRONT_NEAR} swing={frontSwing + paddle(0)} fill={u('leg')} />
      <Leg sp={sp} leg={HIND_NEAR} swing={hindSwing + paddle(2.2)} fill={u('leg')} />

      {/* water streaming off it */}
      {drips.map((d, k) => (
        <circle key={k} cx={d.x} cy={d.y} r={d.r} fill="#e8f3ff" opacity={d.o} />
      ))}

      <g transform={`scale(${LEAPER_HEAD})`}>
        <CrocHead open={open} neck={false} />
      </g>
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
  // the gums only show once the jaws are apart
  const gum = Math.min(1, Math.max(0, (open - 6) / 14));
  const r = (deg: number) => (deg * Math.PI) / 180;
  // the open mouth: a pink wedge between the inner edges of the two jaws
  const L = 104;
  const ux = L * Math.cos(r(-half));
  const uy = L * Math.sin(r(-half));
  const lx = L * Math.cos(r(half));
  const ly = L * Math.sin(r(half));
  // the front edge curves well back towards the throat, so the gape opens onto the sky
  const mouth = `M-6 0 L${ux.toFixed(1)} ${uy.toFixed(1)} Q${((ux + lx) / 2 - 48).toFixed(1)} ${((uy + ly) / 2).toFixed(1)} ${lx.toFixed(1)} ${ly.toFixed(1)} Z`;

  // a point in the upper or lower jaw's own frame, in the head's frame
  const spin = (x: number, y: number, deg: number): Pt => {
    const a = r(deg);
    return [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
  };
  const upper = (x: number, y: number) => spin(x, y, -half);
  const lower = (x: number, y: number) => spin(x, y, half);
  const p2 = ([x, y]: Pt) => `${n1(x)} ${n1(y)}`;

  // the roof of the mouth hangs under the upper jaw, filling half the gape, with ridges across it
  const roof = r(half * 0.5);
  const palate = `M-4 1 L108 1.5 L${p2([108 * Math.cos(roof), 108 * Math.sin(roof)])} L0 0 Z`;
  const rugae = [18, 30, 42, 54, 66, 78, 90]
    .map((x) => `M${x} 2.4 Q${n1(x - 4)} ${n1((x * Math.sin(roof)) / 2 + 1)} ${p2([x * Math.cos(roof), x * Math.sin(roof)])}`)
    .join(' ');

  // the tongue: a fat pink mound along the floor of the lower jaw, rising with the gape
  const rise = Math.tan(r(half * 0.5));
  const top = (x: number) => -Math.min(14, 1.4 + x * rise);
  const tongue = smooth([
    [-2, 0.8],
    [0, top(0)],
    [14, top(14)],
    [30, top(30)],
    [46, top(46)],
    [60, top(60) * 0.92],
    [72, top(72) * 0.7],
    [80, -0.8],
    [72, 0.9],
    [36, 1.2],
  ]);
  const groove = `M6 ${n1(top(6) * 0.55)} C28 ${n1(top(28) * 0.52)} 50 ${n1(top(50) * 0.5)} 70 ${n1(top(70) * 0.38)}`;
  const shine = `M14 ${n1(top(14) * 0.86)} C26 ${n1(top(26) * 0.92)} 40 ${n1(top(40) * 0.92)} 52 ${n1(top(52) * 0.84)}`;

  // the fleshy valve that closes off the throat, arched across the back of the gape
  const valve = `M${p2(upper(10, 2.4))} Q${n1(22 + half * 0.1)} 0 ${p2(lower(10, -1.4))} Q14 0 ${p2(upper(10, 2.4))} Z`;

  // strings of spit between the jaws: they stretch as the mouth opens, and snap when it gapes wide
  const spit = Math.max(0, Math.min(1, (open - 10) / 10, (54 - open) / 14)) * 0.6;
  const strands = [34, 58, 84].map((x, i) => {
    const a = upper(x, 2.6);
    const b = lower(x + 3 + i, -1.6);
    return `M${p2(a)} Q${n1((a[0] + b[0]) / 2 - 7)} ${n1((a[1] + b[1]) / 2 + 3 + i)} ${p2(b)}`;
  });

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
          <stop offset="0" stopColor="#3a1c16" />
          <stop offset=".45" stopColor="#b47a68" />
          <stop offset="1" stopColor="#e6c4a6" />
        </radialGradient>
        <radialGradient id={`${id}-throat`} cx=".35" cy=".5" r=".6">
          <stop offset="0" stopColor="#120604" />
          <stop offset=".7" stopColor="#3a1a12" />
          <stop offset="1" stopColor="#3a1a12" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-tongue`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ecc2a8" />
          <stop offset=".6" stopColor="#d39c86" />
          <stop offset="1" stopColor="#a86e5e" />
        </linearGradient>
        <clipPath id={`${id}-inside`}>
          <path d={mouth} />
        </clipPath>
        <linearGradient id={`${id}-old`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#efe2b4" />
          <stop offset="1" stopColor="#c2a866" />
        </linearGradient>
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

      {/* inside the open mouth: the dark throat, the ridged roof, the fat tongue on the floor, and spit */}
      <path d={mouth} fill={u('mouth')} />
      <g clipPath={u('inside')}>
        <g transform={`rotate(${-half})`}>
          <path d={palate} fill="#ead2b6" />
          <path d={rugae} stroke="#bf9278" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity=".7" />
          <path d={rugae} stroke="#fff4e4" strokeWidth=".5" strokeLinecap="round" fill="none" opacity=".6" transform="translate(-1.2 -.4)" />
          <path d={`M10 ${n1(4 + half * 0.08)} C40 ${n1(5 + half * 0.2)} 70 ${n1(5 + half * 0.25)} 96 ${n1(4 + half * 0.22)}`} stroke="#fff8ee" strokeWidth="1.1" strokeLinecap="round" fill="none" opacity=".45" />
        </g>
        <ellipse cx="6" cy="0" rx="14" ry={Math.max(0.4, half * 0.44)} fill={u('throat')} />
        <path d={valve} fill="#f0cfb8" stroke="#b9806c" strokeWidth=".7" opacity={gum} />
        <g transform={`rotate(${half})`}>
          <path d={tongue} fill={u('tongue')} />
          <g fill="#b77d6b" opacity=".55">
            {PAPILLAE.map(([px, f]) => (
              <circle key={px} cx={px} cy={n1(top(px) * f)} r=".7" />
            ))}
          </g>
          <path d={groove} stroke="#a8705f" strokeWidth="1.1" strokeLinecap="round" fill="none" opacity=".7" />
          <path d={shine} stroke="#fff4ec" strokeWidth="1.3" strokeLinecap="round" fill="none" opacity=".6" />
        </g>
      </g>
      <g stroke="#f7eef0" strokeWidth=".8" fill="none" opacity={spit}>
        {strands.map((d) => (
          <path key={d} d={d} />
        ))}
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
        {/* the gum along the jaw, and sensory pits down its side */}
        <path d="M-4 0 C30 -1.6 80 -1.6 116 -0.6 L116 0.6 C80 0.6 30 0.8 -4 1.4 Z" fill="#c9877a" opacity={gum} />
        <g fill={SKIN_DARK} opacity=".45">
          {[14, 24, 34, 44, 54, 64, 74, 84, 94, 104].map((x, i) => (
            <circle key={x} cx={x} cy={7.5 + (i % 2) * 1.6} r=".8" />
          ))}
        </g>
        {LOWER_TEETH.map(([x, len]) => (
          <g key={x}>
            <ellipse cx={x + 0.5} cy="-0.6" rx={len > 9 ? 3.6 : 2.8} ry="1" fill="#a8665a" opacity={gum * 0.7} />
            <path d={tooth(x, len, -1)} fill={u(x % 3 === 0 ? 'old' : 'tooth')} stroke="#a89a68" strokeWidth=".4" />
          </g>
        ))}
      </g>

      {/* upper jaw and skull: the eye on its socket, the long snout, the nostril dome, teeth pointing down */}
      <g transform={`rotate(${-half})`}>
        <path d="M2 1 C30 3.4 80 3.4 116 1 L116 2.6 C80 5 30 5 2 3 Z" fill="#c9877a" opacity={gum} />
        {UPPER_TEETH.map(([x, len]) => (
          <g key={x}>
            <ellipse cx={x + 0.5} cy="1.8" rx={len > 9 ? 3.6 : 2.8} ry="1" fill="#a8665a" opacity={gum * 0.7} />
            <path d={tooth(x, len, 1)} fill={u(x % 4 === 1 ? 'old' : 'tooth')} stroke="#a89a68" strokeWidth=".4" />
          </g>
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
        {/* the big jaw muscle behind the eye, and dark mottling along the snout */}
        <path d="M-12 -2 C-12 -16 -2 -22 8 -20 C16 -18 18 -8 14 -1 Z" fill="#5b8a43" opacity=".5" />
        <g fill={SKIN_DARK} opacity=".32">
          <ellipse cx="2" cy="-12" rx="3" ry="2" />
          <ellipse cx="58" cy="-7" rx="4" ry="2.2" />
          <ellipse cx="78" cy="-6" rx="3.2" ry="1.8" />
          <ellipse cx="96" cy="-8" rx="2.6" ry="1.5" />
        </g>
        {/* the eye on its raised socket, and a scute row over the back of the skull */}
        <g fill={SKIN_DARK} opacity=".45">
          {[30, 38, 46, 54, 62, 70, 78, 86, 94, 102, 110].map((x, i) => (
            <circle key={x} cx={x} cy={-3.5 - (i % 2) * 1.4} r=".75" />
          ))}
        </g>
        <circle cx={22} cy={-32} r="9" fill="#f4c03a" opacity=".12" />
        <Eye x={22} y={-32} r={4.6} iris={u('iris')} />
        {/* a heavy bony brow, slanting down over the eye for a mean look */}
        <path d="M11.5 -37 C15 -42.5 27 -42 34 -34 C27 -35.6 19 -36.2 13 -33.6 Z" fill={SKIN_DARK} />
        <path d="M13 -38.6 C17 -42 26 -41.6 32.4 -35.6" stroke="#8fbd70" strokeWidth="1" strokeLinecap="round" fill="none" opacity=".55" />
        {/* bony plates on the skull behind the eyes */}
        <path d={scutes(-12, 6, -27, 3.4)} fill={SCUTE} />
        <path d="M-6 -22 l3 -2.6 l3 2.6 Z M2 -23 l3 -2.6 l3 2.6 Z" fill={SKIN_DARK} opacity=".6" />
      </g>
    </g>
  );
}
