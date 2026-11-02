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

const SKIN_LINE = '#b77a5e';
const WHISKER = '#f3efe7';
const WHISKER_LINE = '#cdc5b8';
const GOLD = '#e6c46a';

/**
 * Sir Reginald, drawn in scene coordinates (viewBox 0 0 1000 560): feet on y≈547,
 * gun pivot at (205, 372). Use <HunterArt> for a standalone SVG.
 */
export function Hunter({ mood, aim, recoil = 0, flash = false, smoke = -1, bubble = null, accent = '#6cc4ff' }: HunterProps) {
  const id = useId().replace(/:/g, '');
  const u = (n: string) => `url(#${id}-${n})`;
  const pipe = mood !== 'cheer';

  return (
    <g className="hunter">
      <defs>
        <pattern id={`${id}-tw`} width="6" height="6" patternUnits="userSpaceOnUse">
          <rect width="6" height="6" fill="#7b5e3e" />
          <path d="M0 6 L6 0" stroke="#664c31" strokeWidth="1.2" />
          <path d="M0 0 L6 6" stroke="#9a7b54" strokeWidth=".6" opacity=".7" />
          <path d="M0 3 H6" stroke="#9c3b32" strokeWidth=".35" opacity=".55" />
        </pattern>
        <pattern id={`${id}-twd`} width="5" height="5" patternUnits="userSpaceOnUse">
          <rect width="5" height="5" fill="#57432d" />
          <path d="M0 5 L5 0" stroke="#43331f" strokeWidth="1.1" />
          <path d="M0 0 L5 5" stroke="#7a6243" strokeWidth=".5" opacity=".7" />
        </pattern>
        <radialGradient id={`${id}-waist`} cx=".7" cy=".28" r=".85">
          <stop offset="0" stopColor="#f2c96c" />
          <stop offset=".45" stopColor="#b9862f" />
          <stop offset="1" stopColor="#5e4214" />
        </radialGradient>
        <radialGradient id={`${id}-skin`} cx=".64" cy=".36" r=".78">
          <stop offset="0" stopColor="#fde3cb" />
          <stop offset=".6" stopColor="#efbd9b" />
          <stop offset="1" stopColor="#d18c6a" />
        </radialGradient>
        <radialGradient id={`${id}-nose`} cx=".55" cy=".35" r=".7">
          <stop offset="0" stopColor="#f9b9a3" />
          <stop offset="1" stopColor="#cf5f4b" />
        </radialGradient>
        <linearGradient id={`${id}-wood`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b5793f" />
          <stop offset="1" stopColor="#5a3317" />
        </linearGradient>
        <linearGradient id={`${id}-steel`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d6dde6" />
          <stop offset=".45" stopColor="#6a7383" />
          <stop offset="1" stopColor="#262b34" />
        </linearGradient>
        <linearGradient id={`${id}-boot`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5f3a20" />
          <stop offset="1" stopColor="#24140a" />
        </linearGradient>
        <linearGradient id={`${id}-cravat`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#9a2a38" />
          <stop offset="1" stopColor="#5e1520" />
        </linearGradient>
      </defs>

      {/* ground shadow */}
      <ellipse cx="182" cy="548" rx="96" ry="9" fill="#000" opacity=".45" />

      {/* game bag behind the hip */}
      <path d="M100 404 L140 398 L146 450 C132 458 110 458 100 450 Z" fill="#6b4423" stroke="#3e260f" strokeWidth="1.2" />
      <path d="M108 424 L140 421 M106 434 L142 431 M104 444 L144 441" stroke="#4a2c12" strokeWidth="1" />
      <path d="M100 404 L140 398 L141 415 C128 421 110 421 101 417 Z" fill="#5a3818" />
      <rect x="117" y="413" width="6" height="5" rx="1" fill="#d9b45a" />

      {/* jacket back tail */}
      <path d="M152 332 C124 350 110 404 116 462 L156 470 L160 360 Z" fill={u('twd')} />

      {/* far leg */}
      <path d="M137 474 L157 474 L156 524 L139 524 Z" fill="#46603a" />
      <path d="M147 480 l5 7 l-5 7 l-5 -7 Z M147 496 l5 7 l-5 7 l-5 -7 Z" fill="#6f8f55" />
      <path d="M134 520 L158 520 L160 533 C173 533 182 537 182 547 L130 547 C129 538 131 528 134 520 Z" fill={u('boot')} />
      <path d="M124 416 C114 440 118 466 130 478 C142 486 160 482 164 472 L170 418 Z" fill={u('tw')} />
      <path d="M124 416 C114 440 118 466 130 478 C142 486 160 482 164 472 L170 418 Z" fill="#000" opacity=".25" />

      {/* near leg */}
      <path d="M184 474 L207 474 L208 524 L187 524 Z" fill="#4f6b3c" />
      <path d="M196 480 l6 7 l-6 7 l-6 -7 Z M196 496 l6 7 l-6 7 l-6 -7 Z" fill="#7c9c5f" />
      <path d="M186 480 L206 514 M206 480 L186 514" stroke="#d9b45a" strokeWidth=".8" opacity=".6" />
      <path d="M205 474 h5 l1 15 l-3.5 -3 l-3.5 3 Z" fill="#b8323a" />
      <path d="M183 520 L208 520 L210 533 C224 533 234 537 234 547 L180 547 C179 538 180 528 183 520 Z" fill={u('boot')} />
      <path d="M198 537 C206 533 216 533 224 537" stroke="#8a5a36" strokeWidth="1.4" strokeDasharray="1.2 2.4" fill="none" />
      <path d="M216 538 C224 538 229 540 231 544" stroke="#e0a874" strokeWidth="1.6" fill="none" strokeLinecap="round" opacity=".75" />
      <rect x="179" y="545" width="57" height="3.5" rx="1.5" fill="#160c05" />
      <path d="M170 418 L176 470 C182 484 206 486 214 474 C222 458 220 434 214 414 Z" fill={u('tw')} />
      <path d="M186 430 C190 446 190 458 186 468 M202 428 C206 444 206 458 202 470" stroke="#5a4430" strokeWidth="1.2" fill="none" opacity=".7" />
      <path d="M214 418 C220 436 222 456 214 474" stroke="#ffcf8a" strokeOpacity=".55" strokeWidth="2" fill="none" />
      <rect x="178" y="469" width="35" height="6" rx="2" fill="#4a3826" />
      <rect x="205" y="468.5" width="6" height="7" rx="1" fill="#d9b45a" />

      {/* the famous waistcoat */}
      <g className="hunter-belly">
        <ellipse cx="190" cy="394" rx="62" ry="58" fill={u('waist')} stroke={accent} strokeOpacity=".35" strokeWidth="1.2" />
        <path d="M206 446 L214 464 L225 447 Z M227 437 L238 455 L243 431 Z" fill="#8a6420" />
        <path d="M223 364 c3 2.5 7 2.5 10 0 M235 388 c3 2.5 7 2.5 10 0 M235 412 c3 2.5 7 2.5 10 0" stroke="#7a561c" strokeWidth="1.1" fill="none" />
        {[
          [221, 354],
          [234, 376],
          [240, 400],
          [235, 424],
        ].map(([x, y]) => (
          <g key={`${x}-${y}`}>
            <circle cx={x} cy={y} r="3.8" fill="#f0d27a" stroke="#8a6420" strokeWidth=".8" />
            <circle cx={x - 1} cy={y - 1.2} r="1.1" fill="#fff8de" />
          </g>
        ))}
        <path d="M196 404 L212 400" stroke="#6e4f1a" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M240 400 C232 418 214 418 206 404" stroke={GOLD} strokeWidth="1.8" fill="none" />
        <circle cx="206" cy="404" r="3" fill={GOLD} stroke="#8a6420" strokeWidth=".8" />
        <path d="M234 353 A62 58 0 0 1 238 432" stroke="#ffd79a" strokeWidth="2.5" fill="none" opacity=".6" />
      </g>

      {/* Norfolk jacket */}
      <path d="M152 326 C126 342 112 386 118 440 C136 456 162 456 178 448 C160 410 162 362 184 332 Z" fill={u('tw')} />
      <path d="M140 350 C132 380 132 420 136 446 M160 346 C152 380 152 418 158 448" stroke="#5c4630" strokeWidth="1.5" fill="none" />
      <path d="M118 432 C136 444 160 446 178 440 L180 451 C160 457 136 455 118 444 Z" fill={u('twd')} />
      <rect x="140" y="440" width="9" height="12" rx="1.5" fill="none" stroke="#d9b45a" strokeWidth="1.4" />
      <path d="M124 408 L156 404 L158 417 L126 421 Z" fill={u('twd')} />
      <path d="M184 332 L201 338 L190 374 Z" fill={u('twd')} />
      <path d="M210 330 C226 336 238 346 244 356 L238 361 C230 350 220 342 206 338 Z" fill={u('tw')} />
      <path d="M204 330 C214 326 226 330 232 340 C224 346 212 346 204 342 Z" fill="#6b4423" />
      <path d="M206 331 C186 352 160 382 134 405" stroke="#4a2c12" strokeWidth="7" strokeLinecap="round" fill="none" />
      <path d="M206 331 C186 352 160 382 134 405" stroke="#7a4a24" strokeWidth="1.2" strokeDasharray="3 3" fill="none" />

      {/* collar and cravat */}
      <path d="M174 320 L196 332 L214 320 L210 337 L196 342 L180 337 Z" fill="#f2efe6" />
      <path d="M190 334 C196 332 204 332 208 336 L210 351 C206 363 198 367 192 359 Z" fill={u('cravat')} />
      <g fill="#f0c9cf" opacity=".75">
        <circle cx="196" cy="340" r="1" />
        <circle cx="203" cy="345" r="1" />
        <circle cx="197" cy="352" r="1" />
        <circle cx="205" cy="356" r="1" />
      </g>
      <circle cx="200" cy="346" r="2.2" fill={GOLD} stroke="#8a6420" strokeWidth=".6" />

      {/* head */}
      <ellipse cx="174" cy="302" rx="7" ry="10.5" fill="#e3a987" />
      <path d="M176 296 C172 300 172 306 176 309" stroke="#c98a6c" strokeWidth="1.4" fill="none" />
      <path
        d="M166 296 C166 270 184 260 202 262 C224 264 234 280 234 298 C234 318 224 332 206 336 C188 338 168 326 166 296 Z"
        fill={u('skin')}
      />
      <path d="M186 334 C198 344 216 342 226 330 C222 341 210 349 196 347 C190 345 186 341 186 334 Z" fill="#e2a37f" />
      <path d="M226 270 C233 280 236 292 234 304" stroke="#ffd79a" strokeWidth="2" fill="none" opacity=".55" />
      <path d="M168 284 C160 300 162 324 178 336 C186 340 192 336 190 328 C182 318 180 300 182 286 Z" fill={WHISKER} />
      <path d="M172 296 C170 308 174 320 182 328 M177 292 C176 304 178 316 186 326" stroke={WHISKER_LINE} strokeWidth="1" fill="none" />
      <circle cx="213" cy="310" r={mood === 'annoyed' ? 10 : 8.5} fill="#ef8a78" opacity={mood === 'annoyed' ? 0.75 : 0.5} />
      <path d="M192 271 C202 268 214 268 224 272 M195 277 C204 275 214 275 223 279" stroke="#d7957a" strokeWidth="1.2" fill="none" opacity=".7" />
      <path d="M220 294 L224 296 M219 298 L223 301" stroke="#cf9274" strokeWidth="1" />

      {/* mouth / pipe sit under the moustache */}
      {mood === 'cheer' && (
        <g>
          <path d="M216 325 C222 343 242 343 248 325 Z" fill="#5a1a1a" />
          <path d="M218 326 L246 326 L244 331 L220 331 Z" fill="#fff" />
          <ellipse cx="232" cy="337" rx="7" ry="3.5" fill="#d4575a" />
        </g>
      )}
      {mood === 'annoyed' && <path d="M220 335 C227 330 237 330 242 335" stroke="#8a4a3a" strokeWidth="2.2" fill="none" strokeLinecap="round" />}
      {pipe && (
        <g>
          <path d="M236 324 C246 329 254 333 258 337" stroke="#2a1a0e" strokeWidth="3.6" strokeLinecap="round" fill="none" />
          <path d="M253 333 L266 333 L264 348 C262 352 255 352 253 348 Z" fill="#6b3d1e" />
          <path d="M256 336 L257 347" stroke="#9a6234" strokeWidth="1.2" />
          <ellipse cx="259.5" cy="333" rx="6.5" ry="2" fill="#3a200e" />
          <ellipse cx="259.5" cy="332.8" rx="4.5" ry="1.3" fill="#ff8a3c" className="pipe-ember" />
          <g className="pipe-smoke" fill="#e9e4da">
            <circle cx="260" cy="326" r="3" />
            <circle cx="262" cy="326" r="2.4" />
            <circle cx="258" cy="326" r="2" />
          </g>
        </g>
      )}

      {/* nose and moustache */}
      <ellipse cx="234" cy="303" rx="11" ry="9.5" fill={u('nose')} />
      <circle cx="237" cy="299.5" r="2.2" fill="#fff" opacity=".55" />
      <path
        d="M204 307 C212 298 238 298 248 309 C254 320 247 330 239 325 C235 331 226 331 222 325 C214 331 203 329 199 321 C195 315 198 310 204 307 Z"
        fill={WHISKER}
        stroke={WHISKER_LINE}
        strokeWidth="1"
      />
      <path d="M210 312 L208 322 M218 312 L217 325 M228 312 L230 325 M238 312 L241 322" stroke={WHISKER_LINE} strokeWidth="1" />

      {/* eyes, brows, monocle */}
      {mood === 'idle' && (
        <g>
          <ellipse cx="210" cy="291" rx="4.2" ry="4.8" fill="#fff" />
          <circle cx="211.5" cy="291.5" r="2.7" fill="#2a1d14" />
          <circle cx="212.4" cy="290.4" r=".9" fill="#fff" />
          <path d="M205.5 288 C208 285.5 213 285.5 214.5 288" stroke={SKIN_LINE} strokeWidth="1.2" fill="none" />
          <ellipse cx="227" cy="289.5" rx="2.6" ry="4" fill="#fff" />
          <circle cx="228" cy="290" r="1.9" fill="#2a1d14" />
          <path d="M201 283 C207 276.5 218 277.5 222 283.5 C215 282.5 208 283.5 201 287 Z" fill={WHISKER} />
          <path d="M224 282 C228 278.5 233 279.5 236 283 C231 282.5 227 283 224 285 Z" fill={WHISKER} />
        </g>
      )}
      {mood === 'aim' && (
        <g>
          <ellipse cx="210" cy="291" rx="5" ry="5.4" fill="#fff" />
          <circle cx="212" cy="291.5" r="3.2" fill="#2a1d14" />
          <circle cx="213" cy="290.2" r="1" fill="#fff" />
          <path d="M223 289 C226 286.5 230 286.5 232 289" stroke="#3a2a20" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <path d="M232 286 L236 284 M232 290 L236 291" stroke="#c9876a" strokeWidth="1" />
          <path d="M200 281 C207 279 216 282 222 289 C215 286.5 207 286 200 287 Z" fill={WHISKER} />
          <path d="M223 287 C227 282 232 281 236 283 C231 284 227 286 223 289 Z" fill={WHISKER} />
        </g>
      )}
      {mood === 'annoyed' && (
        <g>
          <ellipse cx="210" cy="292" rx="3.8" ry="3" fill="#fff" />
          <circle cx="211" cy="292" r="2.2" fill="#2a1d14" />
          <ellipse cx="227.5" cy="290.5" rx="2.4" ry="2.6" fill="#fff" />
          <circle cx="228" cy="290.8" r="1.6" fill="#2a1d14" />
          <path d="M200 280 C208 281 216 284 222 290 C214 288 207 287 200 285 Z" fill={WHISKER} />
          <path d="M223 290 C227 284 232 281 236 280 C233 283 229 287 224 292 Z" fill={WHISKER} />
          <path d="M240 262 c3 -4 7 -4 9 0 M246 254 c3 -4 7 -4 9 0" stroke="#e9e4da" strokeWidth="2" fill="none" strokeLinecap="round" opacity=".8" />
        </g>
      )}
      {mood === 'cheer' && (
        <g>
          <path d="M205 292 C208 287.5 213 287.5 216 292" stroke="#3a2a20" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <path d="M223.5 291 C226 287.5 230 287.5 232 291" stroke="#3a2a20" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <path d="M201 279 C207 271 218 272 222 278 C215 277.5 208 278.5 201 282 Z" fill={WHISKER} />
          <path d="M224 277 C228 273 233 274 236 278 C231 277.5 227 278 224 280 Z" fill={WHISKER} />
        </g>
      )}
      {mood === 'cheer' ? (
        <g>
          <path d="M196 342 C198 350 202 356 205 360" stroke={GOLD} strokeWidth="1" strokeDasharray="1.6 1.4" fill="none" />
          <circle cx="205.5" cy="367" r="7" fill="rgba(210,235,255,.25)" stroke={GOLD} strokeWidth="1.8" />
        </g>
      ) : (
        <g>
          <path d="M203 296 C194 312 190 328 196 342" stroke={GOLD} strokeWidth="1" strokeDasharray="1.6 1.4" fill="none" />
          <circle cx="210" cy="291" r="8" fill="rgba(210,235,255,.18)" stroke={GOLD} strokeWidth="1.9" />
          <path d="M205 287 A6 6 0 0 1 209 284.5" stroke="#fff" strokeWidth="1.2" fill="none" opacity=".8" />
        </g>
      )}

      {/* tweed hat with pheasant feather and a fishing fly */}
      <g transform="rotate(-7 198 270)">
        <ellipse cx="198" cy="272" rx="49" ry="10" fill="#3e2f1c" />
        <ellipse cx="198" cy="270.5" rx="47" ry="7.5" fill={u('twd')} />
        <path d="M166 271 C165 249 173 233 198 233 C223 233 231 249 231 271 Z" fill={u('twd')} />
        <path d="M181 240 C191 248 205 248 215 240" stroke="#2f2416" strokeWidth="2" fill="none" />
        <path d="M176 246 C178 252 178 258 176 264" stroke="#3a2b19" strokeWidth="1.5" fill="none" opacity=".6" />
        <path d="M166 263 C188 268 210 268 231 263 L231 271 C210 276 188 276 166 271 Z" fill="#2a1e13" />
        <path d="M224 238 C229 246 231 256 231 268" stroke="#ffd79a" strokeWidth="1.8" fill="none" opacity=".5" />
        <path d="M171 267 C156 247 155 226 167 210 C173 228 176 248 176 267 Z" fill="#b5652a" />
        <path d="M161 230 L171 234 M159 240 L172 244 M160 250 L173 253 M163 258 L174 261" stroke="#4a2810" strokeWidth="1.4" />
        <path d="M174 266 C170 246 168 228 167 212" stroke="#e9cf9a" strokeWidth=".8" fill="none" />
        <circle cx="214" cy="268" r="2.6" fill="#2f7de1" />
        <path d="M216 266 l6 -4 l-1 5 Z" fill="#f4d78e" />
        <path d="M212 270 c-1 4 3 6 5 3" stroke="#c8ccd6" strokeWidth=".9" fill="none" />
      </g>

      {/* arms and the side-by-side shotgun */}
      {/* pivot at the chest (205, 372) so the gun passes under the moustache when he aims high */}
      <g transform={`rotate(${aim.toFixed(2)} 205 372) translate(${recoil.toFixed(2)} 0)`}>
        <g transform="translate(0 24)">
        <path d="M172 336 C214 384 268 380 300 362" stroke={u('twd')} strokeWidth="17" strokeLinecap="round" fill="none" />
        <path d="M164 342 L238 334 L242 357 L176 370 C165 366 161 352 164 342 Z" fill={u('wood')} stroke="#3e220d" strokeWidth="1" />
        <path d="M176 352 C196 348 214 346 236 344 M178 360 C198 356 216 352 238 350" stroke="#7a4a24" strokeWidth=".9" fill="none" opacity=".7" />
        <rect x="160" y="340" width="7" height="30" rx="2" fill="#2a1a0e" transform="rotate(-6 163 355)" />
        <rect x="238" y="333.5" width="30" height="20" rx="3" fill="#c3cad3" />
        <path d="M242 340 C246 336 250 344 254 340 C257 337 261 341 263 344 M243 348 C248 345 252 351 258 347" stroke="#7b8492" strokeWidth=".9" fill="none" />
        <path d="M246 333 L256 329 L258 331 L250 335 Z" fill="#8a94a3" />
        <path d="M246 353 C246 366 264 366 264 353" stroke="#2c313b" strokeWidth="2" fill="none" />
        <path d="M252 353 L251 360 M257 353 L256 360" stroke="#2c313b" strokeWidth="1.6" />
        <rect x="266" y="336" width="182" height="6.5" rx="2" fill={u('steel')} />
        <rect x="266" y="343" width="182" height="6" rx="2" fill="#2b313c" />
        <rect x="266" y="334.6" width="182" height="1.6" fill="#e1e7ee" />
        <rect x="444" y="335" width="4" height="14" rx="1" fill="#1b1f26" />
        <circle cx="447" cy="334" r="1.6" fill="#f4f6f9" />
        <path d="M268 350 L326 350 L322 360 L270 360 Z" fill={u('wood')} />
        <path d="M278 351 L284 359 M286 351 L292 359 M294 351 L300 359 M302 351 L308 359" stroke="#5a3317" strokeWidth=".7" />
        <ellipse cx="304" cy="358" rx="12" ry="8.5" fill="#5e3a1c" />
        <path d="M297 351 C300 346 306 346 311 349" stroke="#5e3a1c" strokeWidth="4" strokeLinecap="round" fill="none" />
        <path d="M216 314 C200 340 208 374 234 374 L252 366" stroke={u('tw')} strokeWidth="19" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <ellipse cx="207" cy="356" rx="8" ry="10" fill="#6b4423" opacity=".9" transform="rotate(-20 207 356)" />
        <ellipse cx="254" cy="364" rx="10" ry="8.5" fill="#6b4423" />
        <path d="M256 358 C258 355 258 352 255 351" stroke="#6b4423" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        {flash && (
          <g>
            <circle cx="452" cy="341" r="24" fill="#ffd27a" opacity=".5" />
            <path d="M450 341 L484 324 L474 338 L502 342 L474 347 L490 364 L456 350 Z" fill="#ffe7a6" />
            <path d="M450 341 L470 334 L466 341 L478 345 L462 347 Z" fill="#fff" />
          </g>
        )}
        {smoke >= 0 &&
          [0, 1, 2].map((k) => (
            <circle
              key={k}
              cx={456 + smoke * 50 + k * 12}
              cy={338 - smoke * 22 - k * 6}
              r={6 + smoke * 22 - k * 3}
              fill="#d9d4cc"
              opacity={Math.max(0, (1 - smoke) * (0.5 - k * 0.12))}
            />
          ))}
        </g>
      </g>

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
