import { Duck, type DuckState } from '../art/Duck';
import { Hunter, type HunterMood } from '../art/Hunter';
import { Clouds, SceneBank, SceneForeground, SceneLand, SceneSky } from '../art/Scene';
import { WAIT_MS, HOLD_MS, aimAngle, duckPosition } from '../game/engine';
import { fmt, fmtX } from '../game/format';
import type { GameState } from '../game/types';
import { HistoryIcon, ShieldIcon } from './icons';

function historyTone(m: number) {
  if (m < 2) return 'pill--low';
  if (m >= 10) return 'pill--high';
  return 'pill--mid';
}

export function Stage({ s }: { s: GameState }) {
  const { phase: ph, now, mult: m } = s;
  const t = ph === 'flying' ? (now - s.t0) / 1000 : 0;
  const e = ph === 'crashed' ? (now - s.crashAt) / 1000 : 0;
  const waitLeft = Math.max(0, (s.waitEnd - now) / 1000);

  // --- duck ---------------------------------------------------------------
  let dx: number, dy: number, rot: number, duckState: DuckState;
  if (ph === 'waiting') {
    dx = 620;
    dy = 468 + Math.sin(now / 380) * 2.5;
    rot = 0;
    duckState = 'float';
  } else if (ph === 'flying') {
    const p = duckPosition(m, t);
    dx = p.x;
    dy = p.y;
    rot = -14;
    duckState = 'fly';
  } else {
    dx = s.crashX + e * 70;
    dy = Math.min(500, s.crashY + 340 * e * e);
    rot = Math.min(190, -14 + e * 420);
    duckState = 'hit';
  }

  // --- hunter -------------------------------------------------------------
  const aim = ph === 'waiting' ? -10 : ph === 'flying' ? aimAngle(dx, dy) : aimAngle(s.crashX, s.crashY);
  const kick = ph === 'crashed' && e < 0.2 ? 1 - e / 0.2 : 0;
  let mood: HunterMood = 'idle';
  let bubble: string | null = null;
  if (ph === 'crashed') {
    mood = 'cheer';
    if (e > 0.15 && e < 2.8) bubble = 'Tally-ho!';
  } else if (ph === 'flying') {
    const sinceCash = (now - s.lastCashAt) / 1000;
    if (s.lastCashAt > s.t0 && sinceCash < 1.5) {
      mood = 'annoyed';
      bubble = 'Confound it!';
    } else mood = 'aim';
  }

  const trail =
    ph === 'waiting'
      ? ''
      : s.points
          .map((q) => {
            const p = duckPosition(q.m, q.t);
            return `${p.x.toFixed(0)},${p.y.toFixed(0)}`;
          })
          .join(' ');

  const feathers =
    ph === 'crashed' && e < 1.6
      ? Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2 + 0.4;
          return {
            x: s.crashX + Math.cos(a) * e * 90,
            y: s.crashY + Math.sin(a) * e * 55 + e * e * 70,
            r: i * 45 + e * 240,
            o: Math.max(0, 1 - e / 1.6),
          };
        })
      : [];

  const shake = ph === 'crashed' && e < 0.45 ? 1 - e / 0.45 : 0;
  const shakeX = shake ? (Math.random() - 0.5) * 16 * shake : 0;
  const shakeY = shake ? (Math.random() - 0.5) * 12 * shake : 0;
  const danger = ph === 'flying' ? Math.min(0.42, (Math.log(m) / Math.log(60)) * 0.42) : 0;

  // --- overlay copy ---------------------------------------------------------
  const live = s.slots.filter((x) => x.bet && x.bet.cashedAt === null);
  const stake = live.reduce((sum, x) => sum + (x.bet?.amount ?? 0), 0);
  let kicker: string, kickerClass: string, sub: string;
  if (ph === 'waiting') {
    kicker = 'Place your bets';
    kickerClass = 'kicker--gold';
    sub = `The duck takes off in ${waitLeft.toFixed(1)}s`;
  } else if (ph === 'flying') {
    kicker = 'Duck in flight';
    kickerClass = 'kicker--game';
    sub = live.length ? `Your ${fmt(stake)} is worth ${fmt(stake * m)}` : 'Watching this round';
  } else {
    kicker = 'Shot down';
    kickerClass = 'kicker--loss';
    sub = `Next round in ${Math.max(0, HOLD_MS / 1000 - e).toFixed(1)}s`;
  }
  const results = ph === 'waiting' ? [] : s.slots.filter((x) => x.result).map((x) => x.result!);

  const be = (now - s.burstAt) / 1300;
  const coins =
    s.burstAt && be >= 0 && be < 1
      ? Array.from({ length: 16 }, (_, j) => {
          const a = (j / 16) * Math.PI * 2 + 0.3;
          const d = (70 + (j % 4) * 30) * Math.min(1, be * 2.4);
          return { x: Math.cos(a) * d, y: Math.sin(a) * d * 0.7 + 240 * be * be, o: 1 - be, r: (j * 47 + be * 720) % 360 };
        })
      : [];
  const cel = s.celebrate && now - s.celebrate.at < 3000 ? s.celebrate : null;

  const showCurve = (ph === 'flying' && t > 1) || ph === 'crashed';
  let curve = '';
  let curveTime = '';
  if (showCurve && s.points.length > 1) {
    const lp = s.points[s.points.length - 1];
    const tmax = Math.max(6, lp.t);
    const mmax = Math.max(2, lp.m);
    curve = s.points
      .map((q) => `${((q.t / tmax) * 204 + 1).toFixed(1)},${(60 - (Math.log(q.m) / Math.log(mmax)) * 56).toFixed(1)}`)
      .join(' ');
    curveTime = `${lp.t.toFixed(1)}s`;
  }
  const gauge = Math.min(100, (Math.log(Math.max(1, m)) / Math.log(100)) * 100);

  return (
    <section className="stage" aria-label="Game stage">
      <div className="stage__camera" style={{ transform: `translate(${shakeX}px, ${shakeY}px)` }}>
        <svg
          className="stage__svg"
          viewBox="0 0 1000 560"
          preserveAspectRatio="xMidYMax slice"
          role="img"
          aria-label="Sir Reginald, a portly English gentleman, aims his shotgun at a duck over a marsh at sunset"
        >
          <SceneSky />
          <Clouds x={s.cloudX} />
          <SceneLand />
          {trail && (
            <polyline points={trail} fill="none" stroke="#ffe7b0" strokeWidth="2" strokeDasharray="2 8" strokeLinecap="round" opacity=".55" />
          )}
          {ph === 'waiting' && (
            <g>
              <ellipse className="ripple" cx="620" cy="476" rx="46" ry="5" fill="none" stroke="#ffcf80" strokeWidth="1.5" />
              <ellipse className="ripple" cx="620" cy="476" rx="46" ry="5" fill="none" stroke="#ffcf80" strokeWidth="1.5" style={{ animationDelay: '1.2s' }} />
            </g>
          )}
          {ph === 'flying' && m > 3 && (
            <g stroke="#fff3d6" strokeLinecap="round" opacity={Math.min(0.6, (m - 3) / 10)}>
              <path d={`M${dx - 70} ${dy - 6} h-40 M${dx - 64} ${dy + 6} h-56 M${dx - 76} ${dy + 16} h-30`} strokeWidth="2" />
            </g>
          )}
          <g transform={`translate(${dx.toFixed(1)} ${dy.toFixed(1)}) rotate(${rot.toFixed(1)})`}>
            <Duck state={duckState} />
          </g>
          {ph === 'flying' && (
            <g transform={`translate(${dx.toFixed(1)} ${(dy - 8).toFixed(1)})`} opacity=".85">
              <g className="reticle">
                <circle r="44" fill="none" style={{ stroke: 'var(--game)' }} strokeWidth="1.6" strokeDasharray="14 10" />
              </g>
              <path d="M-58 0 H-46 M46 0 H58 M0 -58 V-46 M0 46 V58" stroke="#fff1c4" strokeWidth="2" strokeLinecap="round" />
            </g>
          )}
          {feathers.map((f, i) => (
            <g key={i} transform={`translate(${f.x.toFixed(1)} ${f.y.toFixed(1)}) rotate(${f.r.toFixed(0)})`} opacity={f.o}>
              <path d="M-9 0 C-4 -5 6 -5 10 0 C6 4 -4 4 -9 0 Z" fill="#c2a07a" />
              <path d="M-9 0 L10 0" stroke="#6b4c31" strokeWidth="1" />
            </g>
          ))}
          {ph === 'crashed' && e < 0.7 && (
            <circle cx={s.crashX} cy={s.crashY} r={12 + e * 120} fill="none" stroke="#fff1c4" strokeWidth="3" opacity={1 - e / 0.7} />
          )}
          <SceneBank />
          <Hunter
            mood={mood}
            aim={aim - kick * 4}
            recoil={-9 * kick}
            flash={ph === 'crashed' && e < 0.16}
            smoke={ph === 'crashed' && e < 1.4 ? e / 1.4 : -1}
            bubble={bubble}
            accent="#6cc4ff"
          />
          <SceneForeground />
        </svg>
      </div>

      <div className="stage__vignette" aria-hidden="true" />
      <div className="stage__danger" aria-hidden="true" style={{ opacity: danger }} />
      <div className="stage__flash" aria-hidden="true" style={{ opacity: ph === 'crashed' && e < 0.25 ? 0.45 * (1 - e / 0.25) : 0 }} />

      <div className="stage__top">
        <span className="stage__icon">
          <HistoryIcon size={16} />
        </span>
        <div className="stage__history">
          {s.history.length === 0 && <span className="stage__hint">Round results appear here</span>}
          {s.history.slice(0, 14).map((h, i) => (
            <span key={`${s.nonce}-${i}`} className={`pill num ${historyTone(h)}`}>
              {fmtX(h)}
            </span>
          ))}
        </div>
        <span className="stage__round num">
          <ShieldIcon size={14} /> Round #{s.nonce}
        </span>
      </div>

      <div className="stage__center">
        <span className={`stage__kicker ${kickerClass}`}>{kicker}</span>
        <span className={`stage__mult num stage__mult--${ph}`}>{ph === 'waiting' ? '1.00×' : fmtX(m)}</span>
        {ph === 'waiting' && (
          <div className="countdown" aria-hidden="true">
            <div className="countdown__fill" style={{ width: `${100 - (waitLeft / (WAIT_MS / 1000)) * 100}%` }} />
          </div>
        )}
        <span className="stage__sub num">{sub}</span>
        {results.map((r, i) => (
          <span key={i} className={`result num ${r.win ? 'result--win' : 'result--loss'}`}>
            {r.text}
          </span>
        ))}
      </div>

      {coins.map((c, i) => (
        <svg
          key={i}
          className="coin-burst"
          width="22"
          height="22"
          viewBox="0 0 22 22"
          aria-hidden="true"
          style={{ left: `calc(50% + ${c.x - 11}px)`, top: `calc(26% + ${c.y}px)`, opacity: c.o, transform: `rotate(${c.r}deg)` }}
        >
          <circle cx="11" cy="11" r="10" fill="#e9c46a" stroke="#8a6420" strokeWidth="1.4" />
          <circle cx="11" cy="11" r="6.4" fill="none" stroke="#fff1c4" strokeWidth="1.2" />
          <circle cx="8" cy="7" r="1.6" fill="#fff8de" />
        </svg>
      ))}

      {cel && (
        <div className="celebrate" aria-live="polite">
          <svg className="celebrate__rays" width="440" height="440" viewBox="0 0 420 420" aria-hidden="true">
            <g fill="#f4d78e" opacity=".35">
              {Array.from({ length: 8 }, (_, i) => (
                <path key={i} d="M210 210 L200 0 L220 0 Z" transform={`rotate(${i * 45} 210 210)`} />
              ))}
            </g>
          </svg>
          <div className="celebrate__plaque">
            <span className="celebrate__label">{cel.label}</span>
            <span className="celebrate__total num">+{fmt(cel.total * Math.min(1, (now - cel.at) / 1000))}</span>
            <span className="celebrate__at">collected at {fmtX(cel.mult)}</span>
          </div>
        </div>
      )}

      {showCurve && (
        <div className="curve">
          <div className="curve__head">
            <span>Flight curve</span>
            <span className="num">{curveTime}</span>
          </div>
          <svg width="206" height="62" viewBox="0 0 206 62" aria-hidden="true">
            <line x1="0" y1="61" x2="206" y2="61" stroke="#343c4f" />
            <line x1="0" y1="31" x2="206" y2="31" stroke="#262d3c" strokeDasharray="3 4" />
            <polyline points={curve} fill="none" stroke={ph === 'crashed' ? '#ff6a5c' : '#f4d78e'} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
          </svg>
        </div>
      )}

      <div className="gauge">
        <span className="gauge__label">Altitude</span>
        <div className="gauge__track">
          <div className="gauge__fill" style={{ width: `${gauge}%` }} />
          <span className="gauge__tick" style={{ left: '15%' }} />
          <span className="gauge__tick" style={{ left: '50%' }} />
        </div>
        <span className="gauge__scale num">2× · 10× · 100×</span>
      </div>
    </section>
  );
}
