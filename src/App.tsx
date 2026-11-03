import { useCallback, useState } from 'react';
import { BetPanel } from './components/BetPanel';
import { Footer, Header } from './components/Header';
import { HowToPlay } from './components/HowToPlay';
import { AutoPlayPanel, BetHistory, SessionStats } from './components/Sidebar';
import { Stage } from './components/Stage';
import { useEngine, useGameState } from './game/useGame';

export default function App() {
  const { engine, sfx } = useEngine();
  const s = useGameState(engine);
  const [help, setHelp] = useState(false);
  const closeHelp = useCallback(() => setHelp(false), []);

  return (
    <div className="app">
      <div className="shell">
        <Header balance={s.balance} soundOn={s.soundOn} engine={engine} sfx={sfx} onHelp={() => setHelp(true)} />

        <div className="layout">
          <main className="layout__main">
            <Stage s={s} engine={engine} />
            {s.toast && (
              <div className="toast" role="status">
                <span>{s.toast}</span>
                <button className="btn-ghost btn-ghost--sm" onClick={() => engine.dismissToast()}>
                  Dismiss
                </button>
              </div>
            )}
          </main>

          <aside className="layout__side" aria-label="Bets, session and settings">
            <div className="slots">
              {s.slots.map((_, i) => (
                <BetPanel key={i} index={i} s={s} engine={engine} />
              ))}
            </div>
            <SessionStats stats={s.stats} />
            <AutoPlayPanel s={s} engine={engine} />
            <BetHistory rows={s.rows} />
          </aside>
        </div>

        <Footer />
      </div>
      {help && <HowToPlay onClose={closeHelp} />}
    </div>
  );
}
