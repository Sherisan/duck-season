import { useEffect, useRef, useSyncExternalStore } from 'react';
import { GameEngine } from './GameEngine';
import { LocalDemoProvider } from './fairness';
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
    const on = () => engine.getSnapshot().soundOn;
    engine.events = {
      launch: () => on() && sfx.quack(),
      crash: () => on() && sfx.shot(),
      cashout: () => on() && sfx.chime(),
    };
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
