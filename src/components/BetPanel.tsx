import { useState } from 'react';
import { Chip, Coin, Shell } from '../art/Tokens';
import { MIN_CASHOUT, chanceFor } from '../game/engine';
import type { GameEngine } from '../game/GameEngine';
import { fmt, fmtX, parseAmount, parseNum } from '../game/format';
import type { GameState, RoundsOption } from '../game/types';
import { AutoIcon, CashOutIcon, CrosshairIcon } from './icons';

type Variant = 'gold' | 'win' | 'raised' | 'done';

interface ButtonState {
  label: string;
  sub: string;
  variant: Variant;
  disabled?: boolean;
}

type Tone = 'idle' | 'gold' | 'auto' | 'live' | 'win' | 'loss';

const CHIPS = [10, 50, 100, 500];
const ROUND_OPTIONS: RoundsOption[] = [10, 25, 50, 100, 'inf'];

export function BetPanel({ index, s, engine }: { index: number; s: GameState; engine: GameEngine }) {
  const sl = s.slots[index];
  // the Auto toggle opens this bet's auto play settings in the panel; the light shows it running
  const [autoOpen, setAutoOpen] = useState(false);
  const L = s.lim;
  const autoStatus = L.active ? `${L.rounds === 'inf' ? '∞' : L.left} left · net ${L.net >= 0 ? '+' : ''}${fmt(L.net)}` : 'Off';
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

  let status: { text: string; tone: Tone };
  if (live) status = { text: 'In flight', tone: 'live' };
  else if (b && b.cashedAt !== null) status = { text: `Collected at ${fmtX(b.cashedAt)}`, tone: 'win' };
  else if (b && ph === 'crashed') status = { text: s.cause === 'faint' ? 'Out of air' : 'Shot down', tone: 'loss' };
  else if (b) status = { text: 'Bet placed', tone: 'gold' };
  else if (sl.queued) status = { text: 'Queued for next round', tone: 'gold' };
  else if (sl.autoOn) status = { text: 'Auto bet on', tone: 'auto' };
  else status = { text: 'Ready', tone: 'idle' };

  const tg = parseNum(sl.targetStr);
  const odds =
    tg >= MIN_CASHOUT ? `Chance ${chanceFor(tg).toFixed(1)}% · pays ${fmtX(tg)} · wins ${fmt(a * tg)}` : `Enter ${fmtX(MIN_CASHOUT)} or more`;

  return (
    <section className={`bet-panel${live ? ' bet-panel--live' : ''}${sl.autoOn ? ' bet-panel--auto' : ''}`} aria-label={title}>
      <header className="bet-panel__head">
        <div className="bet-panel__title">
          <span className="bet-panel__shells" aria-hidden="true">
            {Array.from({ length: index + 1 }, (_, k) => (
              <Shell key={k} height={18} />
            ))}
          </span>
          <span className="bet-panel__name">
            <span className="bet-panel__label">{title}</span>
            <span className={`bet-panel__state bet-panel__state--${status.tone}`}>{status.text}</span>
          </span>
        </div>
        <div className="bet-panel__toggles">
          <button
            className={`toggle${sl.autoOn ? ' is-on' : ''}`}
            aria-expanded={autoOpen}
            aria-controls={`auto-${index}`}
            title="Auto play"
            onClick={() => setAutoOpen((o) => !o)}
          >
            <AutoIcon size={12} />
            Auto
          </button>
          <button
            className={`toggle toggle--cash${sl.cashOn ? ' is-on' : ''}`}
            aria-pressed={sl.cashOn}
            title="Auto cash-out"
            onClick={() => engine.toggleCashOut(index)}
          >
            <CashOutIcon size={12} />
            Cash-out
          </button>
        </div>
      </header>

      <div className="bet-panel__body">
        <div className="bet-panel__controls">
          <div className="amount">
            <Coin size={19} />
            <div className="amount__field">
              <label className="amount__label" htmlFor={`amt-${index}`}>
                Stake
              </label>
              <input
                id={`amt-${index}`}
                className="amount__input num"
                inputMode="decimal"
                value={sl.amountStr}
                onChange={(ev) => engine.setAmountText(index, ev.target.value)}
                onBlur={() => engine.normalizeAmount(index)}
              />
            </div>
            <div className="amount__steps">
              <button className="step" aria-label={`Halve ${title}`} onClick={() => engine.setAmount(index, engine.amountOf(index) / 2)}>
                ½
              </button>
              <button className="step" aria-label={`Double ${title}`} onClick={() => engine.setAmount(index, engine.amountOf(index) * 2)}>
                2×
              </button>
            </div>
          </div>
          <div className="chips">
            {CHIPS.map((v) => (
              <button key={v} className="chip" aria-label={`Add ${v}`} onClick={() => engine.setAmount(index, engine.amountOf(index) + v)}>
                <Chip value={v} size={28} />
              </button>
            ))}
            <button className="chip-max" aria-label="Bet maximum" onClick={() => engine.setAmount(index, s.balance)}>
              Max
            </button>
          </div>
        </div>
        <button className={`big-btn big-btn--${btn.variant}`} onClick={() => engine.mainAction(index)} disabled={btn.disabled}>
          <CrosshairIcon className="big-btn__mark" size={60} />
          <span className="big-btn__label">{btn.label}</span>
          <span className="big-btn__sub num">{btn.sub}</span>
        </button>
      </div>

      {autoOpen && (
        <div className="auto-row" id={`auto-${index}`}>
          <div className="auto-row__head">
            <span className="label">Auto play</span>
            <span className={`auto-row__status num${L.active ? ' text-win' : ''}`}>{autoStatus}</span>
          </div>
          <div className="auto-row__rounds">
            <span className="label" id={`rounds-${index}`}>
              Rounds
            </span>
            <div className="segmented" role="group" aria-labelledby={`rounds-${index}`}>
              {ROUND_OPTIONS.map((r) => (
                <button
                  key={String(r)}
                  className={`segmented__btn${L.rounds === r ? ' is-on' : ''}`}
                  aria-pressed={L.rounds === r}
                  disabled={L.active}
                  onClick={() => engine.setRounds(r)}
                >
                  {r === 'inf' ? '∞' : r}
                </button>
              ))}
            </div>
          </div>
          <div className="grid-2">
            <label className="auto-row__field">
              <span className="label">Stop on profit</span>
              <input className="input num" inputMode="decimal" placeholder="Off" value={L.profitStr} onChange={(e) => engine.setLimit('profitStr', e.target.value)} />
            </label>
            <label className="auto-row__field">
              <span className="label">Stop on loss</span>
              <input className="input num" inputMode="decimal" placeholder="Off" value={L.lossStr} onChange={(e) => engine.setLimit('lossStr', e.target.value)} />
            </label>
          </div>
          <button className={`auto-row__go ${sl.autoOn ? 'btn-stop' : 'btn-auto'}`} onClick={() => engine.toggleAuto(index)}>
            {sl.autoOn ? 'Stop auto play' : 'Start auto play'}
          </button>
        </div>
      )}

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
