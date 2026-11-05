import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { AIR_SECONDS, CROC_SECONDS, HOLD_MS, HOUSE_EDGE, MAX_MULT, MIN_BET, MIN_CASHOUT, WAIT_MS } from '../game/engine';
import { verifyRound } from '../game/fairness';
import { fmt, fmtX } from '../game/format';
import type { GameState } from '../game/types';
import { HowToPlaySteps } from './HowToPlay';
import { BookIcon, CloseIcon, LimitsIcon, NextIcon, PrevIcon, RulesIcon, ShieldIcon, TicketIcon } from './icons';
import { BetHistory } from './Sidebar';

type Page = 'bets' | 'howto' | 'rules' | 'fair' | 'limits';

const ITEMS: { id: Page; label: string; tone: string; icon: ReactNode }[] = [
  { id: 'bets', label: 'My bets', tone: '#ff7aa8', icon: <TicketIcon size={18} /> },
  { id: 'howto', label: 'How to play', tone: '#6cc4ff', icon: <BookIcon size={18} /> },
  { id: 'rules', label: 'Game rules', tone: '#f4d78e', icon: <RulesIcon size={18} /> },
  { id: 'fair', label: 'Provably fair', tone: '#5fd3a0', icon: <ShieldIcon size={18} /> },
  { id: 'limits', label: 'Game limits', tone: '#f2b84b', icon: <LimitsIcon size={18} /> },
];

/** Whole credits, e.g. 10 000. */
const whole = (n: number) => fmt(n).replace(/,00$/, '');

const RULES = [
  'Each round a duck takes off from the marsh and the multiplier climbs from 1.00×.',
  `Bets are placed in the ${WAIT_MS / 1000}-second window before take-off. A bet placed during a flight joins the next round.`,
  'You can play Bet 1, Bet 2 or both in the same round. Each is settled on its own.',
  'Sir Reginald fires at the duck every second or two. A shot hits only if the duck is inside his inner sight ring, so you can steer the duck to dodge.',
  "At the round's crash point, fixed by the seeds before it starts, he never misses.",
  `Fly too high, into the dark night sky above the thin-air line, and the duck runs short of air. It has ${AIR_SECONDS} seconds to come back down; if it runs out, it faints and falls, and that ends the round like a hit.`,
  `Fly too low over the lake, below the croc-water mark, and a crocodile starts to stir. After ${CROC_SECONDS} seconds down there it leaps out and snaps the duck up, which also ends the round like a hit.`,
  'Cash out before the duck is hit to win your stake × the multiplier at that moment. A bet still in the air when the duck is hit is lost.',
  `Auto cash-out collects for you at your chosen multiplier (${fmtX(MIN_CASHOUT)} or more). Auto bet repeats your bet each round until a limit in the Auto play panel is reached.`,
  `The game returns ${100 - HOUSE_EDGE * 100}% of stakes on average (a ${HOUSE_EDGE * 100}% house edge).`,
  'This demo uses demo credits only. They have no cash value.',
];

function Fairness({ s }: { s: GameState }) {
  const [check, setCheck] = useState<{ nonce: number; text: string; ok: boolean } | null>(null);
  const rev = s.revealed;

  const verify = async () => {
    if (!rev) return;
    try {
      const crash = await verifyRound(rev.serverSeed, s.clientSeed, rev.nonce);
      const ok = crash === rev.crash;
      setCheck({ nonce: rev.nonce, ok, text: ok ? `Verified: the seeds give ${fmtX(crash)}` : `Mismatch: the seeds give ${fmtX(crash)}` });
    } catch {
      setCheck({ nonce: rev.nonce, ok: false, text: 'Verification needs https or localhost.' });
    }
  };

  return (
    <>
      <p className="menu-note">
        Each round's crash point is fixed before it starts. You see a hash of the server seed first; after the round the seed
        itself is revealed, so you can check the result was not changed.
      </p>
      <div className="stack-4">
        <span className="label">Server seed hash · round #{s.nonce}</span>
        <code className="seed">{s.nextHash || 'Generating…'}</code>
      </div>
      <div className="stack-4">
        <span className="label">Client seed</span>
        <code className="seed">{s.clientSeed}</code>
      </div>
      {rev ? (
        <div className="stack-4">
          <span className="label">
            Revealed server seed · round #{rev.nonce} · {fmtX(rev.crash)}
          </span>
          <code className="seed">{rev.serverSeed}</code>
          <div className="verify">
            <button className="btn-ghost btn-ghost--sm" onClick={verify}>
              Verify round #{rev.nonce}
            </button>
            {check && check.nonce === rev.nonce && (
              <span className={`small ${check.ok ? 'text-win' : 'text-loss'}`} role="status">
                {check.text}
              </span>
            )}
          </div>
        </div>
      ) : (
        <p className="muted small">The first seed is revealed when this round ends.</p>
      )}
      <p className="muted small">
        Result = SHA-256(server seed : client seed : nonce). Crash point = max(1, {1 - HOUSE_EDGE} ÷ (1 − r)), where r is the first
        52 bits of the result as a fraction.
      </p>
    </>
  );
}

function Limits({ balance }: { balance: number }) {
  const rows: [string, string][] = [
    ['Minimum bet', fmt(MIN_BET)],
    ['Maximum bet', `Your balance (${fmt(balance)})`],
    ['Bets per round', '2'],
    ['Lowest auto cash-out', fmtX(MIN_CASHOUT)],
    ['Maximum multiplier', `${whole(MAX_MULT)}×`],
    ['Maximum win per bet', `Stake × ${whole(MAX_MULT)}`],
    ['Betting window', `${WAIT_MS / 1000} seconds`],
    ['Pause between rounds', `${(HOLD_MS / 1000).toFixed(1).replace('.', ',')} seconds`],
    ['Return to player', `${100 - HOUSE_EDGE * 100}%`],
  ];
  return (
    <dl className="limits">
      {rows.map(([k, v]) => (
        <div key={k} className="limits__row">
          <dt>{k}</dt>
          <dd className="num">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/** The burger menu: a drawer from the left listing the game's information pages. */
export function GameMenu({ s, onClose }: { s: GameState; onClose: () => void }) {
  const [page, setPage] = useState<Page | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const item = ITEMS.find((it) => it.id === page);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);
  useEffect(() => {
    // Escape steps back to the list first, then closes the menu
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (page) setPage(null);
      else onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [page, onClose]);

  return (
    <div className="drawer" role="dialog" aria-modal="true" aria-labelledby="menu-title" onClick={onClose}>
      <nav className="drawer__card" onClick={(e) => e.stopPropagation()}>
        <header className="drawer__head">
          {item && (
            <button className="icon-btn drawer__back" aria-label="Back to menu" onClick={() => setPage(null)}>
              <PrevIcon size={18} />
            </button>
          )}
          <h2 id="menu-title">{item ? item.label : 'Menu'}</h2>
          <button ref={closeRef} className="icon-btn drawer__close" aria-label="Close menu" onClick={onClose}>
            <CloseIcon size={18} />
          </button>
        </header>

        <div className="drawer__body">
          {!item && (
            <ul className="menu-list">
              {ITEMS.map((it) => (
                <li key={it.id}>
                  <button className="menu-item" onClick={() => setPage(it.id)}>
                    <span className="menu-item__icon" style={{ '--tone': it.tone } as CSSProperties}>
                      {it.icon}
                    </span>
                    <span className="menu-item__label">{it.label}</span>
                    <NextIcon size={16} className="menu-item__chev" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {page === 'bets' && <BetHistory rows={s.rows} />}
          {page === 'howto' && <HowToPlaySteps />}
          {page === 'rules' && (
            <ol className="rules">
              {RULES.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ol>
          )}
          {page === 'fair' && <Fairness s={s} />}
          {page === 'limits' && <Limits balance={s.balance} />}
        </div>
      </nav>
    </div>
  );
}
