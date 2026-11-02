import { Chip, Coin } from '../art/Tokens';
import { chanceFor } from '../game/engine';
import type { GameEngine } from '../game/GameEngine';
import { fmt, fmtX, parseAmount, parseNum } from '../game/format';
import type { GameState } from '../game/types';
import { Switch } from './Switch';

type Variant = 'gold' | 'win' | 'raised' | 'done';

interface ButtonState {
  label: string;
  sub: string;
  variant: Variant;
  disabled?: boolean;
}

const CHIPS = [10, 50, 100, 500];

export function BetPanel({ index, s, engine }: { index: number; s: GameState; engine: GameEngine }) {
  const sl = s.slots[index];
  const a = parseAmount(sl.amountStr);
  const b = sl.bet;
  const ph = s.phase;
  const waitLeft = Math.max(0, (s.waitEnd - s.now) / 1000).toFixed(1);
  const title = `Bet ${index + 1}`;

  let btn: ButtonState;
  if (b && ph === 'flying' && b.cashedAt === null) btn = { label: 'Cash out', sub: fmt(b.amount * s.mult), variant: 'win' };
  else if (b && b.cashedAt !== null && ph === 'flying' && !sl.autoOn)
    btn = sl.queued
      ? { label: 'Cancel queued', sub: `Collected at ${fmtX(b.cashedAt)}`, variant: 'raised' }
      : { label: 'Bet next round', sub: `Collected +${fmt(b.amount * b.cashedAt - b.amount)}`, variant: 'gold' };
  else if (b && b.cashedAt !== null)
    btn = { label: 'Collected', sub: `+${fmt(b.amount * b.cashedAt - b.amount)} at ${fmtX(b.cashedAt)}`, variant: 'done' };
  else if (b && ph === 'waiting')
    btn = { label: b.auto ? 'Cancel auto' : 'Cancel', sub: `${fmt(b.amount)} placed · launch in ${waitLeft}s`, variant: 'raised' };
  else if (sl.autoOn) btn = { label: 'Auto bet', sub: `${fmt(a)} next round`, variant: 'raised', disabled: true };
  else if (ph === 'waiting') btn = { label: 'Place bet', sub: `${fmt(a)} · launch in ${waitLeft}s`, variant: 'gold' };
  else if (sl.queued) btn = { label: 'Cancel queued', sub: `${fmt(a)} · next round`, variant: 'raised' };
  else btn = { label: 'Bet next round', sub: `${fmt(a)} · queue for launch`, variant: 'gold' };

  const live = !!b && ph === 'flying' && b.cashedAt === null;
  const tg = parseNum(sl.targetStr);
  const odds =
    tg >= 1.01 ? `Chance ${chanceFor(tg).toFixed(1)}% · pays ${fmtX(tg)} · wins ${fmt(a * tg)}` : 'Enter 1.01× or more';

  return (
    <section className={`bet-panel${live ? ' bet-panel--live' : ''}${sl.autoOn ? ' bet-panel--auto' : ''}`} aria-label={title}>
      <header className="bet-panel__head">
        <div className="bet-panel__title">
          <span>{title}</span>
          {sl.autoOn && <span className="tag tag--win">Auto play on</span>}
        </div>
        <div className="bet-panel__switches">
          <Switch label="Auto bet" checked={sl.autoOn} onChange={() => engine.toggleAuto(index)} />
          <Switch label="Auto cash-out" checked={sl.cashOn} onChange={() => engine.toggleCashOut(index)} />
        </div>
      </header>

      <div className="bet-panel__body">
        <div className="bet-panel__controls">
          <div className="amount">
            <label className="sr-only" htmlFor={`amt-${index}`}>
              {title} amount
            </label>
            <Coin size={24} />
            <input
              id={`amt-${index}`}
              className="amount__input num"
              inputMode="decimal"
              value={sl.amountStr}
              onChange={(ev) => engine.setAmountText(index, ev.target.value)}
              onBlur={() => engine.normalizeAmount(index)}
            />
            <button className="step" aria-label={`Halve ${title}`} onClick={() => engine.setAmount(index, engine.amountOf(index) / 2)}>
              ½
            </button>
            <button className="step" aria-label={`Double ${title}`} onClick={() => engine.setAmount(index, engine.amountOf(index) * 2)}>
              2×
            </button>
          </div>
          <div className="chips">
            {CHIPS.map((v) => (
              <button key={v} className="chip" aria-label={`Add ${v}`} onClick={() => engine.setAmount(index, engine.amountOf(index) + v)}>
                <Chip value={v} />
              </button>
            ))}
            <button className="chip chip--max" aria-label="Bet maximum" onClick={() => engine.setAmount(index, s.balance)}>
              MAX
            </button>
          </div>
        </div>
        <button className={`big-btn big-btn--${btn.variant}`} onClick={() => engine.mainAction(index)} disabled={btn.disabled}>
          <span className="big-btn__label">{btn.label}</span>
          <span className="big-btn__sub num">{btn.sub}</span>
        </button>
      </div>

      {sl.cashOn && (
        <div className="cashout-row">
          <label htmlFor={`tgt-${index}`} className="label">
            Cash out at
          </label>
          <div className="field field--small">
            <input
              id={`tgt-${index}`}
              className="num"
              inputMode="decimal"
              value={sl.targetStr}
              onChange={(ev) => engine.setTargetText(index, ev.target.value)}
            />
            <span className="field__suffix">×</span>
          </div>
          <span className="muted num">{odds}</span>
        </div>
      )}
    </section>
  );
}
