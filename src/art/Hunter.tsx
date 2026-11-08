import { useId } from 'react';

export type HunterMood = 'idle' | 'aim' | 'cheer' | 'annoyed';

export interface HunterProps {
  mood: HunterMood;
  /** Gun angle in degrees around the chest pivot (205, 372). Negative = up. */
  aim: number;
  recoil?: number;
  flash?: boolean;
  /** 0..1 progress of the muzzle smoke, or -1 for none. */
  smoke?: number;
  bubble?: string | null;
  /** Rim-light colour from the sky. */
  accent?: string;
}

type Pt = { x: number; y: number };

const PIVOT = { x: 205, y: 372 };
/** The gun is drawn level along y = 372, muzzle at (466, 372); this turns it so the muzzle lands on (465.9, 364.5). */
const GUN_TILT = -1.64;
const SUN = '#ffc79a';
const SKIN_SHADE = '#c98a6c';
const WHISKER = '#f2eee7';
const WHISKER_SHADE = '#cfc7ba';
const BRASS = '#e2bf68';

/** Shells in the cartridge belt: x, and the top of the belt there. */
const SHELLS = Array.from({ length: 8 }, (_, i) => {
  const x = 172 + i * 6.6;
  return { x, y: 403.5 - 0.0022 * (x - 195) * (x - 195) };
});

/** Posts holding the ventilated rib above the barrels. */
const RIB_POSTS = Array.from({ length: 16 }, (_, i) => 282 + i * 11.6);

const NEAR_SHOULDER = { x: 180, y: 347 };
const FAR_SHOULDER = { x: 214, y: 346 };

function rot(p: Pt, deg: number, c: Pt = PIVOT): Pt {
  const a = (deg * Math.PI) / 180;
  const dx = p.x - c.x;
  const dy = p.y - c.y;
  return { x: c.x + dx * Math.cos(a) - dy * Math.sin(a), y: c.y + dx * Math.sin(a) + dy * Math.cos(a) };
}

/** Two-bone arm: where the elbow sits for a shoulder, a wrist and the bone lengths. `side` picks the bend. */
function elbow(s: Pt, w: Pt, l1: number, l2: number, side: 1 | -1): Pt {
  const dx = w.x - s.x;
  const dy = w.y - s.y;
  const d = Math.min(Math.hypot(dx, dy), l1 + l2 - 0.5);
  const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  const ux = dx / Math.hypot(dx, dy);
  const uy = dy / Math.hypot(dx, dy);
  return { x: s.x + ux * a - uy * h * side, y: s.y + uy * a + ux * h * side };
}

/** A tapered limb from a (radius ra) to b (radius rb) with rounded ends. */
function limb(a: Pt, b: Pt, ra: number, rb: number): string {
  const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  const nx = -(b.y - a.y) / len;
  const ny = (b.x - a.x) / len;
  const f = (n: number) => n.toFixed(1);
  return [
    `M${f(a.x + nx * ra)} ${f(a.y + ny * ra)}`,
    `L${f(b.x + nx * rb)} ${f(b.y + ny * rb)}`,
    `A${rb} ${rb} 0 0 0 ${f(b.x - nx * rb)} ${f(b.y - ny * rb)}`,
    `L${f(a.x - nx * ra)} ${f(a.y - ny * ra)}`,
    `A${ra} ${ra} 0 0 0 ${f(a.x + nx * ra)} ${f(a.y + ny * ra)}`,
    'Z',
  ].join(' ');
}

const deg = (a: Pt, b: Pt) => (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;

/**
 * Sir Reginald, drawn in scene coordinates (viewBox 0 0 1000 560): feet on y≈547,
 * gun pivot at (205, 372). Use <HunterArt> for a standalone SVG.
 */
export function Hunter({ mood, aim, recoil = 0, flash = false, smoke = -1, bubble = null, accent = '#6cc4ff' }: HunterProps) {
  const id = useId().replace(/:/g, '');
  const u = (n: string) => `url(#${id}-${n})`;
  const pipe = mood !== 'cheer';

  // the gun group: aim about the chest, recoil along the barrels, then level the drawing
  const gunT = `rotate(${aim.toFixed(2)} ${PIVOT.x} ${PIVOT.y}) translate(${recoil.toFixed(2)} 0) rotate(${GUN_TILT} ${PIVOT.x} ${PIVOT.y})`;
  const onGun = (x: number, y: number) => {
    const p = rot({ x, y }, GUN_TILT);
    return rot({ x: p.x + recoil, y: p.y }, aim);
  };

  // arms reach from fixed shoulders to hands that ride on the gun
  const nearWrist = onGun(212, 378);
  const nearElbow = elbow(NEAR_SHOULDER, nearWrist, 46, 42, 1);
  const farWrist = onGun(287, 389);
  const farElbow = elbow(FAR_SHOULDER, farWrist, 45, 45, 1);

  // the sling hangs from its swivels, sagging under its own weight whatever the gun angle
  const slingA = onGun(184.2, 392);
  const slingB = onGun(368.2, 383);
  const sling = `M${slingA.x.toFixed(1)} ${slingA.y.toFixed(1)} Q${((slingA.x + slingB.x) / 2).toFixed(1)} ${(Math.max(slingA.y, slingB.y) + 36).toFixed(1)} ${slingB.x.toFixed(1)} ${slingB.y.toFixed(1)}`;

  // he tips his head back a little to follow a high bird
  const tilt = Math.max(-11, Math.min(2, (aim + 10) * 0.22));
  const look = Math.max(-2.2, Math.min(0.6, (aim + 10) * 0.05));

  const cloth = (d: string, pattern = 'tw', key?: string) => (
    <g key={key}>
      <path d={d} fill={u(pattern)} />
      <path d={d} fill={u('check')} />
      <path d={d} fill={u('shade')} />
    </g>
  );

  const cuff = (w: Pt, e: Pt, r: number) => (
    <g transform={`translate(${w.x.toFixed(1)} ${w.y.toFixed(1)}) rotate(${deg(e, w).toFixed(1)})`}>
      <rect x={-7} y={-r - 0.5} width={7} height={r * 2 + 1} rx={2.5} fill={u('twd')} />
      <rect x={-7} y={-r - 0.5} width={7} height={r * 2 + 1} rx={2.5} fill="#000" opacity=".22" />
      <path d={`M-1.5 ${-r} V${r}`} stroke={SUN} strokeOpacity=".25" strokeWidth="1" />
    </g>
  );

  return (
    <g className="hunter">
      <defs>
        {/* herringbone tweed with a faint rust overcheck */}
        <pattern id={`${id}-tw`} width="8" height="8" patternUnits="userSpaceOnUse">
          <rect width="8" height="8" fill="#716744" />
          <path d="M0 0 L4 4 L0 8 M4 0 L8 4 L4 8" stroke="#5c5335" strokeWidth="1.2" fill="none" />
          <path d="M2 0 L6 4 L2 8 M6 0 L10 4 L6 8" stroke="#8a7f58" strokeWidth=".6" fill="none" />
        </pattern>
        {/* sleeves get their own offset weave so they separate from the body */}
        <pattern id={`${id}-tws`} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="translate(3 5)">
          <rect width="8" height="8" fill="#7a6f4a" />
          <path d="M0 0 L4 4 L0 8 M4 0 L8 4 L4 8" stroke="#5c5335" strokeWidth="1.2" fill="none" />
          <path d="M2 0 L6 4 L2 8 M6 0 L10 4 L6 8" stroke="#92875e" strokeWidth=".6" fill="none" />
        </pattern>
        <pattern id={`${id}-twd`} width="7" height="7" patternUnits="userSpaceOnUse">
          <rect width="7" height="7" fill="#574e33" />
          <path d="M0 0 L3.5 3.5 L0 7 M3.5 0 L7 3.5 L3.5 7" stroke="#463e27" strokeWidth="1.1" fill="none" />
          <path d="M1.8 0 L5.3 3.5 L1.8 7" stroke="#6c6242" strokeWidth=".5" fill="none" />
        </pattern>
        <pattern id={`${id}-hat`} width="6" height="6" patternUnits="userSpaceOnUse">
          <rect width="6" height="6" fill="#5b4a33" />
          <path d="M0 0 L3 3 L0 6 M3 0 L6 3 L3 6" stroke="#4a3b27" strokeWidth="1" fill="none" />
          <path d="M1.5 0 L4.5 3 L1.5 6" stroke="#73603f" strokeWidth=".5" fill="none" />
        </pattern>
        <pattern id={`${id}-check`} width="22" height="22" patternUnits="userSpaceOnUse">
          <path d="M0 11 H22 M11 0 V22" stroke="#b0582f" strokeWidth=".7" opacity=".5" />
        </pattern>
        <pattern id={`${id}-tatt`} width="7" height="7" patternUnits="userSpaceOnUse">
          <rect width="7" height="7" fill="#d1a64a" />
          <path d="M0 2 H7 M2 0 V7" stroke="#8a3b26" strokeWidth=".7" />
          <path d="M0 5.5 H7 M5.5 0 V7" stroke="#2f5040" strokeWidth=".6" />
        </pattern>
        <pattern id={`${id}-hatch`} width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <path d="M0 0 V3 M0 0 H3" stroke="#2b1607" strokeWidth=".6" opacity=".6" />
        </pattern>
        {/* light from the low sun on his right, cool sky behind */}
        <linearGradient id={`${id}-shade`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#0b0818" stopOpacity=".5" />
          <stop offset=".5" stopColor="#0b0818" stopOpacity=".12" />
          <stop offset=".82" stopColor="#ffc79a" stopOpacity="0" />
          <stop offset="1" stopColor="#ffc79a" stopOpacity=".26" />
        </linearGradient>
        <linearGradient id={`${id}-limb`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#0b0818" stopOpacity=".42" />
          <stop offset=".6" stopColor="#0b0818" stopOpacity=".05" />
          <stop offset="1" stopColor="#ffc79a" stopOpacity=".22" />
        </linearGradient>
        <radialGradient id={`${id}-skin`} cx=".72" cy=".38" r=".8">
          <stop offset="0" stopColor="#ffe2cb" />
          <stop offset=".55" stopColor="#f0bf9d" />
          <stop offset="1" stopColor="#c7866a" />
        </radialGradient>
        <radialGradient id={`${id}-hand`} cx=".7" cy=".3" r=".9">
          <stop offset="0" stopColor="#f6cdb0" />
          <stop offset="1" stopColor="#bf7f63" />
        </radialGradient>
        <radialGradient id={`${id}-nose`} cx=".6" cy=".35" r=".75">
          <stop offset="0" stopColor="#ffd8c2" />
          <stop offset="1" stopColor="#de917a" />
        </radialGradient>
        <linearGradient id={`${id}-wood`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b2733c" />
          <stop offset=".45" stopColor="#7a431e" />
          <stop offset="1" stopColor="#40200b" />
        </linearGradient>
        <linearGradient id={`${id}-silver`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f1f3f6" />
          <stop offset=".45" stopColor="#a9b1bc" />
          <stop offset="1" stopColor="#59616d" />
        </linearGradient>
        <linearGradient id={`${id}-blue`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9aa8bd" />
          <stop offset=".3" stopColor="#4a5568" />
          <stop offset="1" stopColor="#141922" />
        </linearGradient>
        <linearGradient id={`${id}-boot`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8a5530" />
          <stop offset=".6" stopColor="#4f2c15" />
          <stop offset="1" stopColor="#24130a" />
        </linearGradient>
        <linearGradient id={`${id}-sock`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#2c4330" />
          <stop offset="1" stopColor="#4d6d48" />
        </linearGradient>
        <linearGradient id={`${id}-tie`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8f2836" />
          <stop offset="1" stopColor="#521420" />
        </linearGradient>
        <linearGradient id={`${id}-leather`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8d5a31" />
          <stop offset="1" stopColor="#4a2a13" />
        </linearGradient>
      </defs>

      {/* ground shadow */}
      <ellipse cx="192" cy="548" rx="92" ry="8" fill="#000" opacity=".45" />

      {/* leather cartridge bag hanging behind the hip */}
      <path d="M116 412 L150 406 L154 452 C140 459 124 459 116 452 Z" fill={u('leather')} />
      <path d="M116 412 L150 406 L151 424 C138 429 124 429 117 426 Z" fill="#5d371a" />
      <path d="M117 426 C126 429 140 428 151 424" stroke="#a87443" strokeWidth=".9" strokeDasharray="1.6 1.6" fill="none" />
      <rect x="130" y="421" width="7" height="6" rx="1.2" fill={BRASS} />

      {/* far arm, reaching under the barrels (behind the body) */}
      <path d={limb(FAR_SHOULDER, farElbow, 9, 8.5)} fill={u('twd')} />
      <path d={limb(farElbow, farWrist, 8.5, 7)} fill={u('twd')} />
      <path d={limb(FAR_SHOULDER, farElbow, 9, 8.5)} fill="#0b0818" opacity=".25" />
      <path d={limb(farElbow, farWrist, 8.5, 7)} fill="#0b0818" opacity=".2" />
      {cuff(farWrist, farElbow, 7)}

      {/* far leg: knickerbockers, sock, brogue */}
      <g>
        {cloth('M190 426 C196 448 200 470 202 488 C203 498 212 503 225 501 C235 499 238 491 236 481 C234 461 230 442 226 424 Z', 'twd')}
        <path d="M203 492 L235 491 L234 500 L204 501 Z" fill="#3e3720" />
        <path d="M205 499 C202 511 204 522 208 532 L228 532 C232 520 233 508 232 499 Z" fill={u('sock')} />
        <path d="M205 499 C202 511 204 522 208 532 L228 532 C232 520 233 508 232 499 Z" fill="#000" opacity=".25" />
        <path d="M206 527 L229 527 C231 533 238 535 246 537 C254 539 258 542 257 547 L202 547 C201 540 203 533 206 527 Z" fill={u('boot')} />
        <path d="M206 527 L229 527 C231 533 238 535 246 537 C254 539 258 542 257 547 L202 547 C201 540 203 533 206 527 Z" fill="#000" opacity=".2" />
        <rect x="200" y="545" width="58" height="3.5" rx="1.5" fill="#140a04" />
        <path d="M232 531 l5 3 M236 530 l4 4" stroke="#d8b48a" strokeWidth=".9" opacity=".7" />
      </g>

      {/* near leg */}
      <g>
        {cloth('M150 424 C146 446 144 468 144 486 C144 497 152 502 164 501 C176 500 181 494 181 485 C183 465 187 445 191 426 Z')}
        <path d="M181 486 C183 466 187 446 191 428" stroke={SUN} strokeOpacity=".35" strokeWidth="1.6" fill="none" />
        <path d="M156 440 C156 456 157 470 160 484 M171 438 C170 456 170 470 172 484" stroke="#4a4229" strokeWidth="1" fill="none" opacity=".6" />
        <path d="M145 488 L180 488 L179 497 L146 497 Z" fill="#4c4428" />
        {/* sock with a turned cuff and red garter flashes */}
        <path d="M147 499 C143 510 141 521 142 532 L164 532 C168 520 174 508 177 499 Z" fill={u('sock')} />
        <path d="M151 505 L148 530 M157 505 L155 531 M163 505 L161 531 M169 505 L165 529" stroke="#24382a" strokeWidth=".8" opacity=".55" />
        <path d="M146 495 L179 495 L177 505 L145 505 Z" fill="#557a4f" />
        <path d="M146 495 L179 495 L178.5 497 L146 497 Z" fill="#6f9466" />
        <path d="M166 503 h5 v12 l-2.5 -2.5 l-2.5 2.5 Z M172 503 h5 v10 l-2.5 -2.5 l-2.5 2.5 Z" fill="#b8323a" />
        {/* chestnut brogue */}
        <path d="M141 527 L165 527 C168 533 175 535 183 537 C191 539 194 542 193 547 L136 547 C135 540 137 533 141 527 Z" fill={u('boot')} />
        <path d="M172 536 C177 539 183 541 190 542" stroke="#2a160a" strokeWidth=".9" fill="none" />
        <path d="M171 538 C176 541 182 543 189 544" stroke="#c99a6c" strokeWidth=".8" strokeDasharray="1 1.6" fill="none" />
        <path d="M150 530 C156 532 162 533 167 532" stroke="#c99a6c" strokeWidth=".8" strokeDasharray="1 1.6" fill="none" opacity=".8" />
        <path d="M166 530 l5 3 M169 529 l4 4 M163 531 l5 2" stroke="#e7c9a2" strokeWidth=".9" />
        <path d="M184 538 C189 539 192 541 193 544" stroke="#ffd2a6" strokeWidth="1.4" fill="none" strokeLinecap="round" opacity=".7" />
        <rect x="134" y="545" width="60" height="3.5" rx="1.5" fill="#140a04" />
      </g>

      {/* Norfolk jacket */}
      <g className="hunter-belly">
        {cloth('M186 323 C172 327 158 333 150 341 C140 355 138 380 144 404 C140 422 136 440 134 456 C160 464 206 462 234 452 C238 438 240 424 240 410 C249 396 249 375 238 359 C232 347 224 337 214 329 Z')}
        {/* box pleats front and back, under the belt */}
        <path d="M222 342 C226 372 226 420 222 456 M160 342 C155 374 154 420 156 460" stroke="#4a4229" strokeWidth="1.6" fill="none" opacity=".75" />
        <path d="M225 344 C229 374 229 420 225 455 M163 342 C158 374 157 420 159 460" stroke="#a39770" strokeWidth=".8" fill="none" opacity=".5" />
        {/* waistcoat and tie in the open neck */}
        <path d="M206 330 L229 343 C232 350 233 356 232 362 L222 372 Z" fill={u('tatt')} />
        <path d="M206 330 L229 343 C232 350 233 356 232 362 L222 372 Z" fill={u('shade')} />
        <circle cx="226.5" cy="356" r="1.5" fill="#efe2bd" stroke="#6b4c18" strokeWidth=".5" />
        <circle cx="228" cy="365" r="1.5" fill="#efe2bd" stroke="#6b4c18" strokeWidth=".5" />
        <path d="M212 333 L222 337 L221 354 L216.5 357 L214 341 Z" fill={u('tie')} />
        <path d="M211 331 L221 335 L219.5 340.5 L213 338 Z" fill="#a33244" />
        {/* lapel */}
        {cloth('M195 327 L206 330 L222 372 C214 364 206 354 200 345 L203 340 L194 334 Z')}
        <path d="M206 330 L222 372" stroke="#3f3822" strokeWidth="1" fill="none" />
        <path d="M207.5 331 L223 370" stroke="#a39770" strokeWidth=".6" fill="none" opacity=".6" />
        {/* suede shooting patch where the stock sits */}
        <path d="M186 344 C194 340 204 344 207 352 L209 368 C202 372 192 372 186 366 Z" fill="#7b5634" />
        <path d="M188 347 C195 344 202 347 205 353 L206 366 C200 369 193 369 188 364 Z" stroke="#c39a6a" strokeWidth=".7" strokeDasharray="1.2 1.4" fill="none" opacity=".8" />
        {/* leather cartridge belt: red shells with brass heads in their loops, and a brass buckle */}
        <path d="M144 398 C176 404 210 405 243 401 L242 413 C210 417 176 416 145 410 Z" fill={u('leather')} />
        <path d="M144 398 C176 404 210 405 243 401" stroke="#b07a48" strokeWidth=".8" fill="none" />
        <path d="M145 409 C176 414.6 210 415.6 242 411.6" stroke="#c39a6a" strokeWidth=".6" strokeDasharray="1.4 1.4" fill="none" opacity=".7" />
        {SHELLS.map(({ x, y }) => (
          <g key={x}>
            <rect x={x - 2.6} y={y - 6} width="5.2" height="11" rx="1" fill="#b8282f" />
            <rect x={x - 2.6} y={y - 6} width="1.6" height="11" fill="#e2585c" opacity=".7" />
            <rect x={x - 2.9} y={y - 8.4} width="5.8" height="3.2" rx=".8" fill={BRASS} />
            <path d={`M${x - 2.6} ${y - 7.6} h5.2`} stroke="#fff3c4" strokeWidth=".6" opacity=".8" />
            <rect x={x - 3.4} y={y + 0.6} width="6.8" height="5" rx="1" fill="#5d371a" />
          </g>
        ))}
        <rect x="223" y="399.5" width="11" height="15" rx="2" fill="none" stroke={BRASS} strokeWidth="2.2" />
        <path d="M225 407 H240" stroke={BRASS} strokeWidth="1.3" />
        {/* hunting knife at the back of the hip: stag handle, brass guard, stitched leather sheath */}
        <g transform="rotate(9 157 405)">
          <path d="M152 411 L162 411 L161 444 C160 449 154 449 153 444 Z" fill={u('leather')} />
          <path d="M154.2 413 L154.6 443 M159.8 413 L159.4 443" stroke="#c39a6a" strokeWidth=".6" strokeDasharray="1.2 1.4" />
          <path d="M153 442.5 L161 442.5 L159.6 448.6 C158.4 450.6 155.6 450.6 154.4 448.6 Z" fill={BRASS} />
          <path d="M153 410.5 C152 402 152.6 396 155 391.5 C157.6 390.4 160.2 391 161.2 392.6 C162.4 398 162.4 404 161.4 410.5 Z" fill="#d9c8a4" />
          <path d="M155 395 l1.6 .8 M158.6 399 l1.6 .6 M154.6 403 l1.6 .8 M158.4 406.4 l1.4 .6" stroke="#7a6446" strokeWidth="1" strokeLinecap="round" />
          <path d="M160.6 393 C161.6 398 161.6 404 160.8 410" stroke="#fff3dc" strokeWidth=".7" fill="none" opacity=".7" />
          <rect x="150.6" y="409.2" width="13" height="3.4" rx="1.2" fill={BRASS} />
        </g>
        {/* bellows pocket */}
        <path d="M186 422 L222 420 L224 450 C212 454 196 454 188 451 Z" fill={u('tw')} />
        <path d="M186 422 L222 420 L224 450 C212 454 196 454 188 451 Z" fill="#000" opacity=".12" />
        <path d="M184 419 L224 416 L225 427 C212 430 196 430 185 429 Z" fill={u('twd')} />
        <circle cx="205" cy="425" r="2" fill="#3a2a17" />
        {/* hem shadow and the sun along his front */}
        <path d="M134 456 C160 464 206 462 234 452" stroke="#2c2716" strokeWidth="2" fill="none" />
        <path d="M216 331 C226 340 234 350 239 360 C249 376 249 396 241 410 C240 426 238 440 234 452" stroke={SUN} strokeWidth="2.2" strokeOpacity=".55" fill="none" strokeLinecap="round" />
        <path d="M184 324 C170 328 157 334 150 342 C142 352 139 368 141 384" stroke={accent} strokeOpacity=".35" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        {/* dark green corduroy collar, turned up at the back of the neck */}
        <path d="M178 334 C182 324 192 317 202 318 L206 330 C198 330 190 334 184 341 Z" fill="#33452b" />
        <path d="M182 332 C186 325 193 321 200 321 M184 336 C188 329 195 325 202 325" stroke="#4f6a42" strokeWidth=".8" fill="none" />
        <path d="M184 326 C189 320 195 318 201 318.5" stroke={accent} strokeOpacity=".4" strokeWidth="1" fill="none" strokeLinecap="round" />
      </g>

      {/* head, tipped to follow the bird */}
      <g transform={`rotate(${tilt.toFixed(2)} 204 326)`}>
        {/* neck and shirt collar */}
        <path d="M196 312 C200 322 210 330 220 330 L218 338 C208 338 198 332 192 324 Z" fill="#d79c7d" />
        <path d="M200 324 L212 332 L221 329 L223 337 L211 340 Z" fill="#f4efe4" />
        <path d="M196 320 L205 331 L201 335 L193 326 Z" fill="#e2dccf" />

        {/* skull and face */}
        <path d="M196 270 C206 262 224 264 230 274 C234 280 235 286 236 291 C236 300 236 308 234 314 C233 320 230 326 224 329 C216 333 204 332 196 324 C186 316 180 304 180 292 C180 282 186 274 196 270 Z" fill={u('skin')} />
        <path d="M196 270 C186 274 180 282 180 292 C180 304 186 316 196 324 C200 327 205 329 210 330 C200 320 194 306 194 292 C194 282 197 275 196 270 Z" fill="#9c5f48" opacity=".28" />
        <path d="M231 276 C234 282 236 290 236 298" stroke={SUN} strokeWidth="1.8" strokeOpacity=".6" fill="none" strokeLinecap="round" />
        {/* white hair at the back and temple */}
        <path d="M184 282 C180 290 180 302 186 310 C189 304 190 296 194 290 C196 284 198 280 200 276 C194 276 188 278 184 282 Z" fill={WHISKER} />
        <path d="M185 290 C184 296 185 302 187 306 M189 286 C188 292 189 298 191 302" stroke={WHISKER_SHADE} strokeWidth=".8" fill="none" />
        {/* ear */}
        <path d="M188 289 C183 290 182 298 185 304 C187 308 192 308 194 305 C195 299 194 292 188 289 Z" fill="#e6aa8a" />
        <path d="M188 293 C186 296 186 300 188 303" stroke={SKIN_SHADE} strokeWidth="1.1" fill="none" />
        {/* mutton-chop whiskers joining the moustache */}
        <path d="M196 288 C200 294 203 302 207 309 C211 315 219 317 227 314 L228 321 C220 329 206 330 197 322 C190 314 189 300 196 288 Z" fill={WHISKER} />
        <path d="M196 288 C190 300 190 314 197 322 C201 325 205 327 209 328 C201 320 197 306 196 288 Z" fill={WHISKER_SHADE} opacity=".7" />
        <path d="M199 298 C200 306 203 313 208 318 M203 300 C205 308 209 314 214 318 M196 306 C197 313 200 318 204 322" stroke={WHISKER_SHADE} strokeWidth=".8" fill="none" />
        {/* chin */}
        <path d="M222 320 C228 318 232 320 233 323 C231 328 226 331 220 330 Z" fill="#e7ad8d" />
        {/* cheek, crow's feet, brow line */}
        <ellipse cx="222" cy="302" rx="6.5" ry="4.2" fill="#ec8f7c" opacity={mood === 'annoyed' ? 0.75 : 0.45} />
        <path d="M209 290 l-3 -1 M209 293 l-3 1" stroke={SKIN_SHADE} strokeWidth=".8" opacity=".8" />
        <path d="M212 278 C218 276 226 277 231 280" stroke={SKIN_SHADE} strokeWidth=".8" fill="none" opacity=".6" />

        {/* mouth or pipe under the moustache */}
        {mood === 'cheer' && (
          <g>
            <path d="M224 314 C226 325 238 326 241 314 Z" fill="#5a1a1a" />
            <path d="M225 314.5 L240.5 314.5 L239.5 317.5 L226 317.5 Z" fill="#fff" />
            <ellipse cx="233" cy="321.5" rx="4.5" ry="2" fill="#d4575a" />
          </g>
        )}
        {mood === 'annoyed' && <path d="M225 319 C229 316 235 316 239 319" stroke="#8a4a3a" strokeWidth="1.8" fill="none" strokeLinecap="round" />}
        {pipe && (
          <g>
            <path d="M233 316 C240 319 246 322 250 326" stroke="#1d130b" strokeWidth="2.6" strokeLinecap="round" fill="none" />
            <path d="M246 323 L259 323 L258 336 C256 341 249 341 247 336 Z" fill="#6b3d1e" />
            <path d="M246 323 L249 323 L249.5 338 C248 338 247 337 247 336 Z" fill="#3a200e" opacity=".6" />
            <path d="M256 325 L255.5 336" stroke="#a46a3a" strokeWidth="1.1" />
            <ellipse cx="252.5" cy="323" rx="6.5" ry="1.9" fill="#3a200e" />
            <ellipse cx="252.5" cy="322.8" rx="4.5" ry="1.2" fill="#ff8a3c" className="pipe-ember" />
            <g className="pipe-smoke" fill="#e9e4da">
              <circle cx="253" cy="316" r="3" />
              <circle cx="255" cy="316" r="2.4" />
              <circle cx="251" cy="316" r="2" />
            </g>
          </g>
        )}

        {/* nose */}
        <path d="M231 283 C236 288 241 294 245 299 C248 303 246 308 241 308 C238 308.5 235 307 232 305 Z" fill={u('nose')} />
        <path d="M235 304 C237 307 240 308 242 307" stroke="#b9604c" strokeWidth=".9" fill="none" />
        <circle cx="241" cy="299" r="1.5" fill="#fff" opacity=".5" />

        {/* handlebar moustache */}
        <path
          d="M238 305 C230 304 222 306 216 311 C212 314 207 314 205 310 C205 317 212 321 220 319 C228 317 234 313 239 313 C243 314 247 315 250 312 C253 309 253 304 250 302 C250 306 248 308 245 307 C242 305 240 305 238 305 Z"
          fill={WHISKER}
        />
        <path d="M216 311 C222 309 230 309 236 311 M220 316 C226 314 232 313 237 312" stroke={WHISKER_SHADE} strokeWidth=".8" fill="none" />
        <path d="M205 310 C205 317 212 321 220 319 C228 317 234 313 239 313" stroke={WHISKER_SHADE} strokeWidth="1" fill="none" />

        {/* eye, brow and monocle */}
        {mood === 'cheer' ? (
          <g>
            <path d="M215 292 C218 288 224 288 227 292" stroke="#3a2a20" strokeWidth="1.8" fill="none" strokeLinecap="round" />
            <path d="M210 284 C215 278 225 278 231 282 C225 282 217 283 211 287 Z" fill={WHISKER} />
          </g>
        ) : (
          <g>
            {mood === 'aim' ? (
              <path d="M215 291 C218 289.5 223 289 227 290.5 C224 292.5 219 293 215 291 Z" fill="#fbf6ee" />
            ) : (
              <path d="M215 291 C217 287.5 223 286.5 227 290 C224 293.5 219 294 215 291 Z" fill="#fbf6ee" />
            )}
            <circle cx={222.5 + look * 0.4} cy={290.6 + look} r={mood === 'aim' ? 1.8 : 2.3} fill="#56718c" />
            <circle cx={222.8 + look * 0.4} cy={290.6 + look} r={mood === 'aim' ? 1 : 1.2} fill="#14100c" />
            <circle cx={223.4 + look * 0.4} cy={289.8 + look} r=".6" fill="#fff" />
            <path
              d={mood === 'aim' ? 'M214.5 290.8 C218 288.6 223 288.2 227.5 290' : 'M214.5 290.8 C217 286.8 223 286 227.5 289.6'}
              stroke="#5a3a2a"
              strokeWidth="1.2"
              fill="none"
              strokeLinecap="round"
            />
            <path d="M216 293.6 C219 295 223 294.8 226 293" stroke={SKIN_SHADE} strokeWidth=".7" fill="none" />
            {mood === 'annoyed' ? (
              <path d="M209 281 C216 281 224 284 231 289 C224 287.5 216 287 210 286 Z" fill={WHISKER} />
            ) : mood === 'aim' ? (
              <path d="M209 284 C216 282 224 283 231 288 C224 286.5 216 286.5 210 288 Z" fill={WHISKER} />
            ) : (
              <path d="M209 284 C215 279 225 279 231 283.5 C225 283 217 283.5 210 287.5 Z" fill={WHISKER} />
            )}
            {mood === 'annoyed' && (
              <path d="M240 262 c3 -4 7 -4 9 0 M246 254 c3 -4 7 -4 9 0" stroke="#e9e4da" strokeWidth="2" fill="none" strokeLinecap="round" opacity=".8" />
            )}
          </g>
        )}
        {mood === 'cheer' ? (
          <g>
            {/* the monocle pops out and swings on its chain */}
            <path d="M216 296 C214 310 212 322 214 334" stroke={BRASS} strokeWidth=".9" strokeDasharray="1.4 1.2" fill="none" />
            <circle cx="215" cy="340" r="5.5" fill="rgba(210,235,255,.25)" stroke={BRASS} strokeWidth="1.5" />
          </g>
        ) : (
          <g>
            <path d="M216.5 296 C211 306 209 318 212 330" stroke={BRASS} strokeWidth=".9" strokeDasharray="1.4 1.2" fill="none" />
            <circle cx="221.5" cy="290.6" r="6.2" fill="rgba(210,235,255,.16)" stroke={BRASS} strokeWidth="1.5" />
            <path d="M217.5 287.5 A4.6 4.6 0 0 1 221 285.6" stroke="#fff" strokeWidth="1" fill="none" opacity=".8" />
          </g>
        )}

        {/* tweed trilby with a pheasant feather and a fishing fly */}
        <g transform="rotate(-5 206 270)">
          <path d="M176 279 C190 283 214 284 232 280 L230 285 C212 288 192 287 178 284 Z" fill="#000" opacity=".22" />
          {/* a barred blue jay feather behind the pheasant one */}
          <path d="M193 266 C188 254 186 242 186 230 C191 240 196 252 197 265 Z" fill="#2f6fc9" />
          <path d="M187.6 238 l4 -1 M188.2 244 l4.4 -1 M189.4 250 l4.4 -1 M191 256 l4 -.8" stroke="#0d1830" strokeWidth="1.3" />
          <path d="M186.6 231 C187 236 187.4 240 188 244" stroke="#e8f2ff" strokeWidth=".9" fill="none" />
          {/* feather tucked into the band, sweeping back */}
          <path d="M190 266 C180 252 172 238 166 224 C176 232 186 248 194 264 Z" fill="#b8642a" />
          <path d="M190 266 C181 252 174 239 167 226" stroke="#f0d6a2" strokeWidth=".7" fill="none" />
          <path d="M171 232 L176 234 M174 240 L180 241 M178 247 L184 248 M182 254 L188 255" stroke="#3e200c" strokeWidth="1.3" />
          <path d="M184 270 C182 254 186 242 196 237 C204 233 216 234 224 238 C231 244 233 256 233 268 Z" fill={u('hat')} />
          <path d="M184 270 C182 254 186 242 196 237 C192 246 191 258 192 270 Z" fill="#000" opacity=".22" />
          <path d="M197 238 C202 243 208 245 214 245" stroke="#3a2c1b" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <path d="M224 239 C230 245 232 256 233 266" stroke={SUN} strokeWidth="1.6" strokeOpacity=".55" fill="none" strokeLinecap="round" />
          <path d="M190 240 C198 234 212 233 222 237" stroke={accent} strokeWidth="1.2" strokeOpacity=".4" fill="none" strokeLinecap="round" />
          <path d="M184 262 C200 266 218 265 233 260 L233 269 C218 273 200 273 184 270 Z" fill="#2a2a1c" />
          <path d="M184 262 C200 266 218 265 233 260" stroke="#4a4a33" strokeWidth=".8" fill="none" />
          {/* twisted cord round the band, and a silver edelweiss badge */}
          <path d="M184 268.4 C200 272 218 271 233 266.6" stroke="#8a6f44" strokeWidth="2" strokeDasharray="2.2 1.2" fill="none" />
          <g transform="translate(205 266)">
            {[0, 60, 120, 180, 240, 300].map((a) => (
              <ellipse key={a} cx="0" cy="-2.6" rx="1.3" ry="2.4" fill="#eef1f4" stroke="#8d96a3" strokeWidth=".4" transform={`rotate(${a})`} />
            ))}
            <circle r="1.5" fill={BRASS} />
          </g>
          <path d="M171 272 C182 268 220 266 242 271 C246 274 241 278 232 278 C212 276 192 277 178 280 C170 281 166 276 171 272 Z" fill={u('hat')} />
          <path d="M171 272 C182 268 220 266 242 271 C246 274 241 278 232 278 C212 276 192 277 178 280 C170 281 166 276 171 272 Z" fill={u('shade')} />
          <path d="M178 280 C192 277 212 276 232 278 C238 278 243 276 243 273" stroke="#2e2416" strokeWidth="1.2" fill="none" />
          <path d="M222 268.5 C226 268 230 269 236 270.5" stroke={SUN} strokeWidth="1.2" strokeOpacity=".5" fill="none" />
          <circle cx="222" cy="265.5" r="2.4" fill="#2f7de1" />
          <path d="M224 264 l5.5 -3.5 l-1 4.5 Z" fill="#f4d78e" />
          <path d="M220 267.5 c-1 3.5 2.5 5 4.5 2.5" stroke="#c8ccd6" strokeWidth=".8" fill="none" />
        </g>
      </g>

      {/* the leather sling, hanging from its two swivels under the gun */}
      <g fill="none" strokeLinecap="round">
        <path d={sling} stroke="#24140a" strokeWidth="5.4" />
        <path d={sling} stroke="#7a4a26" strokeWidth="3.8" />
        <path d={sling} stroke="#c39a6a" strokeWidth=".7" strokeDasharray="1.6 1.6" opacity=".8" />
      </g>

      {/* the over-and-under, held at the chest */}
      <g transform={gunT}>
        {/* barrels: two, one over the other, blued, under a ventilated rib with a gold bead */}
        <path d="M274 361.4 L466 363 L466 369.6 L274 370 Z" fill={u('blue')} />
        <path d="M274 370 L466 369.6 L466 376.6 L274 378.4 Z" fill={u('blue')} />
        <path d="M276 362.9 L462 364.3" stroke="#d6dfeb" strokeWidth=".9" opacity=".75" />
        <path d="M276 371.6 L462 371" stroke="#9aa7bb" strokeWidth=".7" opacity=".55" />
        <path d="M274 370 L466 369.6" stroke="#06080c" strokeWidth="1.1" />
        <path d="M276 377.6 L464 375.9" stroke="#05070a" strokeWidth=".9" />
        <path d="M272 356.2 L466 358.6 L466 360.2 L272 357.8 Z" fill="#56627a" />
        <path d="M272 356.2 L466 358.6" stroke="#e3eaf3" strokeWidth=".7" />
        {RIB_POSTS.map((x) => (
          <rect key={x} x={x} y={357.6 + (x - 272) * 0.0124} width="1.8" height="4.2" fill="#3c4558" />
        ))}
        {/* muzzle: the choke band and both bores */}
        <path d="M455 362.9 L466 363 L466 376.6 L455 376.8 Z" fill="#262d3a" />
        <path d="M455 362.9 V376.8" stroke="#aeb9c9" strokeWidth=".6" />
        <ellipse cx="466" cy="366.3" rx="1.3" ry="2.4" fill="#020304" />
        <ellipse cx="466" cy="373.1" rx="1.3" ry="2.4" fill="#020304" />
        <circle cx="462.5" cy="357.4" r="1.6" fill="#f3d47c" />
        {/* barrel swivel for the sling */}
        <path d="M364 377.2 L372 377 L372 380.4 L364 380.6 Z" fill="#2a313d" />
        <path d="M366 380.4 v1.6 a2.2 2.2 0 0 0 4.4 0 v-1.6" stroke="#a9b2be" strokeWidth="1.1" fill="none" />

        {/* stock: figured walnut, a checkered grip, a gold oval and a red recoil pad */}
        <path d="M162 363.6 C186 362.8 214 363.6 236 364.6 L238 383 C232 383 226 382 220 382 C204 384 186 389 166 395 C163 395 161 393 161 390 Z" fill={u('wood')} />
        <path
          d="M168 370 C182 366 196 372 210 368 C218 366 226 368 232 370 M170 379 C184 375 196 381 208 376 C214 374 220 375 226 376 M176 387.5 C186 384.5 194 386.5 204 383.5"
          stroke="#3e1e0a"
          strokeWidth=".8"
          fill="none"
          opacity=".55"
        />
        <path d="M188 373.5 C192 370.5 200 371 202 374 C200 377 192 377.5 188 373.5 Z" fill="none" stroke="#3e1e0a" strokeWidth=".7" opacity=".45" />
        <path d="M163 364.6 C186 363.8 214 364.6 235 365.6" stroke="#f0b779" strokeWidth="1.1" fill="none" opacity=".75" />
        <path d="M218 365.8 L236 366.2 L237.6 382 L219 382 Z" fill={u('hatch')} />
        <ellipse cx="192" cy="385" rx="4.2" ry="2" fill={BRASS} stroke="#8a6a24" strokeWidth=".5" />
        <path d="M153 363.6 L161 363.6 L161 395.2 L154 394.4 C152 386 152 372 153 363.6 Z" fill="#5a1a14" />
        <path d="M161 363.6 V395.2" stroke="#0c0806" strokeWidth="1.6" />
        <path d="M154.6 368 v3 M154.2 376 v3 M154.2 384 v3" stroke="#2a0b08" strokeWidth=".9" />
        <path d="M182 388.6 v2.6 a2.2 2.2 0 0 0 4.4 0 v-2.6" stroke="#a9b2be" strokeWidth="1.1" fill="none" />

        {/* receiver: bright steel, gold-lined, with a gold duck inlaid and scroll engraving */}
        <path d="M228 362.2 L246 361 L246 364.4 L229 365.4 Z" fill={u('silver')} />
        <path d="M236 361.4 L276 360 L276 380 C272 386 262 389.5 250 389.5 L238 387.6 Z" fill={u('silver')} />
        <path d="M240.5 364.8 L272 363.8 L272 379 C268 383.4 260 385.8 250.5 385.8 L241.5 384.6 Z" fill="none" stroke={BRASS} strokeWidth=".8" />
        <path
          d="M243 369 c3 -3 6 1 4 3 c-2 2 -5 -1 -2 -3 M263 367.5 c3 -2 6 1 4 3 M244 381 c4 -2 8 2 12 0 c3 -1.6 6 0 8 1.4"
          stroke="#5a626e"
          strokeWidth=".6"
          fill="none"
        />
        <path
          d="M249 376 C251 373 254.5 372.4 256.6 373.4 L261.2 369.6 L260.6 373.4 C262.2 373.2 263.8 372.8 265 372.2 C264.6 374.2 262.8 375.4 260.2 376 C257 377.2 252.6 377.4 249 376 Z"
          fill={BRASS}
        />
        <circle cx="268.5" cy="379.5" r="1.6" fill="#6d7581" stroke="#c7cdd5" strokeWidth=".4" />
        <circle cx="245.5" cy="380.5" r="1.3" fill="#6d7581" stroke="#c7cdd5" strokeWidth=".4" />
        {/* top lever and the gold safety on the tang */}
        <path d="M238 361 C241 357.4 247 357 251 358.6 L251 360.8 L238 361.4 Z" fill="#8a929d" />
        <rect x="231" y="360.2" width="4.4" height="2.2" rx=".9" fill={BRASS} />
        {/* forend iron at the hinge */}
        <path d="M274 360.4 C277.5 360.4 279 362.4 279 365 L274 365 Z" fill="#8a929d" />

        {/* trigger guard and a gold trigger */}
        <path d="M239 387.6 C239 399.5 258 401 263.5 389" stroke="#1e232b" strokeWidth="2.3" fill="none" />
        <path d="M239.6 388.2 C240 398 257 399.8 262.6 389.4" stroke="#7d8692" strokeWidth=".6" fill="none" />
        <path d="M250 388.6 C250.6 392 249.6 394.6 247.6 396" stroke={BRASS} strokeWidth="1.9" fill="none" strokeLinecap="round" />

        {/* beavertail forend, checkered, under the barrels */}
        <path d="M278 378 L346 377 C353 377 357 380 355 384 L349 388.6 L282 390 C277 389 275 383 278 378 Z" fill={u('wood')} />
        <path d="M292 380.2 L340 379.4 L338 386.8 L294 387.8 Z" fill={u('hatch')} />
        <path d="M282 379.4 L346 378.4" stroke="#e0a56a" strokeWidth=".8" fill="none" opacity=".6" />
        <path d="M276 377.6 L284 377.6 L284 390 L279 389.6 C276 387 275 381 276 377.6 Z" fill={u('silver')} />

        {flash && (
          <g>
            <circle cx="474" cy="370" r="42" fill="#ffb347" opacity=".22" />
            <circle cx="471" cy="370" r="25" fill="#ffd27a" opacity=".5" />
            <path d="M466 370 L502 346 L491 364 L534 368 L493 375 L515 398 L479 380 L472 404 L468 378 Z" fill="#ffae45" />
            <path d="M466 370 L494 355 L485 367 L514 370 L485 375 L499 390 L473 377 Z" fill="#ffe7a6" />
            <path d="M466 370 L483 364.5 L479 370 L492 373 L473 375.5 Z" fill="#fff" />
            <g fill="#ffe7a6">
              <circle cx="520" cy="352" r="1.6" />
              <circle cx="530" cy="384" r="1.3" />
              <circle cx="507" cy="342" r="1.1" />
              <circle cx="540" cy="372" r="1.2" />
            </g>
          </g>
        )}
        {smoke >= 0 &&
          [0, 1, 2, 3].map((k) => (
            <circle
              key={k}
              cx={474 + smoke * 56 + k * 13}
              cy={369 - smoke * 24 - k * 6}
              r={7 + smoke * 24 - k * 3}
              fill="#d9d4cc"
              opacity={Math.max(0, (1 - smoke) * (0.52 - k * 0.11))}
            />
          ))}
      </g>

      {/* far hand wrapped round the fore-end */}
      <g transform={gunT}>
        <path d="M285 384 C291 393 308 395 317 388 L317 382 L285 382 Z" fill="#b97a5e" />
        {[292, 298, 304, 310].map((x, i) => (
          <g key={x}>
            <path d={`M${x} ${389 - i * 0.4} L${x + 0.6} ${378.5 + i * 0.3}`} stroke="#7d4a35" strokeWidth="6" strokeLinecap="round" />
            <path d={`M${x} ${389 - i * 0.4} L${x + 0.6} ${378.5 + i * 0.3}`} stroke={u('hand')} strokeWidth="4.6" strokeLinecap="round" />
          </g>
        ))}
      </g>

      {/* near arm: sleeve from the shoulder to the hand on the grip */}
      <g transform="translate(-3 4)" fill="#0b0818" opacity=".3">
        <path d={limb(NEAR_SHOULDER, nearElbow, 11.5, 10.5)} />
        <path d={limb(nearElbow, nearWrist, 10.5, 8.5)} />
      </g>
      {[limb(NEAR_SHOULDER, nearElbow, 11.5, 10.5), limb(nearElbow, nearWrist, 10.5, 8.5)].map((d) => (
        <g key={d}>
          <path d={d} fill="none" stroke="#2a2614" strokeWidth="2.4" />
          <path d={d} fill={u('tws')} />
          <path d={d} fill={u('check')} />
          <path d={d} fill={u('limb')} />
        </g>
      ))}
      <path
        d={`M${(NEAR_SHOULDER.x + 9).toFixed(1)} ${(NEAR_SHOULDER.y - 6).toFixed(1)} Q${(nearElbow.x + 14).toFixed(1)} ${((NEAR_SHOULDER.y + nearElbow.y) / 2).toFixed(1)} ${(nearElbow.x + 9).toFixed(1)} ${(nearElbow.y - 2).toFixed(1)}`}
        stroke={SUN}
        strokeOpacity=".4"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d={`M${(nearElbow.x - 6).toFixed(1)} ${(nearElbow.y - 4).toFixed(1)} q5 4 10 2 M${(nearElbow.x - 4).toFixed(1)} ${(nearElbow.y + 3).toFixed(1)} q4 2 8 0`}
        stroke="#3f3822"
        strokeWidth="1"
        fill="none"
        opacity=".7"
      />
      {/* suede elbow patch */}
      <g transform={`translate(${nearElbow.x.toFixed(1)} ${nearElbow.y.toFixed(1)}) rotate(${deg(NEAR_SHOULDER, nearElbow).toFixed(1)})`}>
        <ellipse cx="-3" cy="0" rx="8.5" ry="7.5" fill="#7b5634" />
        <ellipse cx="-3" cy="0" rx="7" ry="6" fill="none" stroke="#c39a6a" strokeWidth=".6" strokeDasharray="1.2 1.3" opacity=".85" />
        <ellipse cx="-3" cy="0" rx="8.5" ry="7.5" fill={u('limb')} />
      </g>
      {/* near hand on the grip, finger on the trigger */}
      <g transform={gunT}>
        <path d="M234 384 L248 390" stroke="#9a5f46" strokeWidth="5.4" strokeLinecap="round" />
        <path d="M234 384 L248 390" stroke={u('hand')} strokeWidth="4" strokeLinecap="round" />
        <path d="M211 366 C215 360 226 359 232 362 C236 365 238 371 236 377 C238 381 238 387 234 390 C228 392 219 391 213 388 C209 382 208 372 211 366 Z" fill={u('hand')} />
        <path d="M230 363 C234 368 236 374 235 381" stroke="#b5765b" strokeWidth=".9" fill="none" />
        <path d="M217 384.5 C223 385.5 229 385 235 383.5 M216 388 C222 389 228 388.5 233 387" stroke="#a5654c" strokeWidth=".8" fill="none" />
        <path d="M219 364 L233 361.5" stroke="#9a5f46" strokeWidth="5.4" strokeLinecap="round" />
        <path d="M219 364 L233 361.5" stroke={u('hand')} strokeWidth="4" strokeLinecap="round" />
        <path d="M226 361 C229 360 231 360 233 361" stroke="#fff" strokeWidth=".8" opacity=".35" fill="none" />
      </g>
      {cuff(nearWrist, nearElbow, 8.5)}

      {bubble && (
        <g transform="translate(244 196)">
          {/* inner group carries the CSS pop so it doesn't override the translate above */}
          <g key={bubble} className="hunter-bubble">
            <rect x="0" y="-40" width={bubble.length * 10.5 + 28} height="36" rx="14" fill="#fff6e0" stroke="#1b1408" strokeWidth="1.6" />
            <path d="M14 -6 L6 14 L30 -6 Z" fill="#fff6e0" stroke="#1b1408" strokeWidth="1.6" strokeLinejoin="round" />
            <rect x="12" y="-8" width="20" height="4" fill="#fff6e0" />
            <text x="14" y="-16" fontFamily="Oxanium, sans-serif" fontWeight="800" fontSize="17" fill="#1b1408" letterSpacing=".5">
              {bubble}
            </text>
          </g>
        </g>
      )}
    </g>
  );
}

/** Standalone SVG of the hunter, for lobby cards, marketing or export. */
export function HunterArt({ mood = 'idle', aim = -24, width = 380 }: { mood?: HunterMood; aim?: number; width?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="92 196 400 360" width={width} height={(width * 360) / 400} role="img" aria-label="Sir Reginald, a portly English gentleman hunter">
      <Hunter mood={mood} aim={aim} />
    </svg>
  );
}
