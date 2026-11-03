import type { GameEngine } from '../game/GameEngine';
import { fmt, fmtSigned, fmtX } from '../game/format';
import type { BetRow, GameState, RoundsOption, Stats } from '../game/types';
import { AutoIcon } from './icons';

export function SessionStats({ stats }: { stats: Stats }) {
  const tone = stats.profit > 0 ? 'text-win' : stats.profit < 0 ? 'text-loss' : '';
  return (
    <section className="stats" aria-label="Session">
      <div className="stat">
        <span className="label">Rounds played</span>
        <span className="stat__value num">{stats.rounds}</span>
      </div>
      <div className="stat">
        <span className="label">Wagered</span>
        <span className="stat__value num">{fmt(stats.wagered)}</span>
      </div>
      <div className="stat">
        <span className="label">Profit</span>
        <span className={`stat__value num ${tone}`}>{fmtSigned(stats.profit)}</span>
      </div>
      <div className="stat">
        <span className="label">Best cash-out</span>
        <span className="stat__value num text-gold">{stats.best ? fmtX(stats.best) : '—'}</span>
      </div>
    </section>
  );
}

const ROUND_OPTIONS: RoundsOption[] = [10, 25, 50, 100, 'inf'];

export function AutoPlayPanel({ s, engine }: { s: GameState; engine: GameEngine }) {
  const L = s.lim;
  const status = L.active
    ? `${L.rounds === 'inf' ? '∞' : L.left} left · net ${L.net >= 0 ? '+' : ''}${fmt(L.net)}`
    : 'Off';
  return (
    <section className="panel" aria-label="Auto play">
      <div className="panel__head">
        <AutoIcon size={18} className="text-gold" />
        <h2>Auto play</h2>
        <span className={`panel__meta num ${L.active ? 'text-win' : ''}`}>{status}</span>
      </div>
      <div className="stack-6">
        <span className="label" id="rounds-label">
          Rounds
        </span>
        <div className="segmented" role="group" aria-labelledby="rounds-label">
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
        <div className="stack-6">
          <label className="label" htmlFor="stop-profit">
            Stop on profit
          </label>
          <input
            id="stop-profit"
            className="input num"
            inputMode="decimal"
            placeholder="Off"
            value={L.profitStr}
            onChange={(e) => engine.setLimit('profitStr', e.target.value)}
          />
        </div>
        <div className="stack-6">
          <label className="label" htmlFor="stop-loss">
            Stop on loss
          </label>
          <input
            id="stop-loss"
            className="input num"
            inputMode="decimal"
            placeholder="Off"
            value={L.lossStr}
            onChange={(e) => engine.setLimit('lossStr', e.target.value)}
          />
        </div>
      </div>
      <p className="muted small">
        Switch on <strong>Auto bet</strong> in a bet panel to start. Both panels share these limits.
      </p>
      {L.active && (
        <button className="btn-stop" onClick={() => engine.stopAuto()}>
          Stop auto play
        </button>
      )}
    </section>
  );
}

export function BetHistory({ rows }: { rows: BetRow[] }) {
  return (
    <section className="panel panel--flush" aria-label="Your bets">
      <div className="panel__head panel__head--pad">
        <h2>Your last bets</h2>
        <span className="panel__meta">Last {rows.length || 12}</span>
      </div>
      {rows.length === 0 ? (
        <p className="muted small pad">No bets yet. Place one and watch the duck fly.</p>
      ) : (
        <ul className="bet-rows">
          {rows.map((r) => (
            <li key={r.id} className="bet-row">
              <span className={`bet-row__at num ${r.win ? 'text-win' : 'text-loss'}`}>{fmtX(r.at)}</span>
              <span className="bet-row__mid">
                <span>{r.win ? 'Cashed out' : 'Shot down'}</span>
                <span className="muted small num">
                  #{r.round} · Bet {r.slot} · {fmt(r.bet)}
                </span>
              </span>
              <span className={`bet-row__profit num ${r.win ? 'text-win' : 'text-loss'}`}>{fmtSigned(r.profit)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
