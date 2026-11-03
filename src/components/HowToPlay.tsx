import { useEffect, useRef } from 'react';
import { DuckArt } from '../art/Duck';
import { HunterArt } from '../art/Hunter';
import { CloseIcon } from './icons';

const STEPS = [
  { title: 'Place a bet', text: 'Set an amount in Bet 1, Bet 2 or both before the duck takes off. Chips add to the amount.' },
  { title: 'Watch it climb', text: 'The multiplier rises while the duck flies. Your stake is worth stake × multiplier.' },
  { title: 'Dodge his shots', text: 'Move your cursor to steer the duck. If it is outside his inner sight ring when he fires, he misses. At the crash point he never misses.' },
  { title: 'Cash out in time', text: 'Hit Cash out before Sir Reginald hits the duck. If he hits it first, that bet is lost.' },
];

export function HowToPlay({ onClose }: { onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="howto-title" onClick={onClose}>
      <div className="modal__card" onClick={(e) => e.stopPropagation()}>
        <button ref={closeRef} className="icon-btn modal__close" aria-label="Close" onClick={onClose}>
          <CloseIcon />
        </button>
        <div className="modal__art" aria-hidden="true">
          <HunterArt mood="aim" width={230} />
          <DuckArt state="fly" width={120} />
        </div>
        <h2 id="howto-title">How to play Duck Season</h2>
        <ol className="steps">
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <span className="steps__n">{i + 1}</span>
              <div>
                <strong>{s.title}</strong>
                <p>{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="muted small">
          Auto cash-out collects for you at a set multiplier. Auto bet repeats your bet each round until a limit in the Auto play
          panel is reached. Every round is provably fair, and the game returns 99% on average.
        </p>
        <button className="big-btn big-btn--gold modal__cta" onClick={onClose}>
          <span className="big-btn__label">Got it</span>
        </button>
      </div>
    </div>
  );
}
