import { fmt, fmtSigned, fmtX } from '../game/format';
import type { BetRow } from '../game/types';

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
