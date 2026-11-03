import { useEffect, useRef, useSyncExternalStore } from 'react';
import { GameEngine } from './GameEngine';
import { splashDelay } from './engine';
import { LocalDemoProvider } from './fairness';
import { LINES } from './lines';
import { SoundFx } from './sound';

export interface GameHandle {
  engine: GameEngine;
  sfx: SoundFx;
}

/** Creates one engine for the app, runs its loop while mounted, and wires sounds. */
export function useEngine(): GameHandle {
  const ref = useRef<GameHandle | null>(null);
  if (!ref.current) {
    const engine = new GameEngine(new LocalDemoProvider());
    const sfx = new SoundFx();
    // each moment's sound, plus Sir Reginald saying what his speech bubble shows
    engine.events = {
      launch: () => sfx.launch(),
      crash: () => {
        const st = engine.getSnapshot();
        sfx.crash(splashDelay(st.crashX, st.crashY));
        sfx.say(LINES.hit, 0.25);
      },
      miss: () => {
        sfx.miss();
        // fires before the miss is recorded, so one earlier miss makes this the second
        sfx.say(engine.getSnapshot().misses.length > 0 ? LINES.missAgain : LINES.miss, 0.2);
      },
      cashout: () => {
        sfx.cashout();
        sfx.say(LINES.cashout, 0.15);
      },
    };
    // the heartbeat and wingbeats follow the round; everything follows the sound toggle
    engine.subscribe(() => {
      const st = engine.getSnapshot();
      sfx.setEnabled(st.soundOn);
      sfx.setPhase(st.phase, st.mult);
    });
    ref.current = { engine, sfx };
  }
  const { engine } = ref.current;
  useEffect(() => {
    engine.start();
    return () => engine.stop();
  }, [engine]);
  return ref.current;
}

export function useGameState(engine: GameEngine) {
  return useSyncExternalStore(engine.subscribe, engine.getSnapshot);
}
