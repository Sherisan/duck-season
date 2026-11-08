import { useEffect, useRef, useSyncExternalStore } from 'react';
import { GameEngine } from './GameEngine';
import { CROC_LEAP_START, CROC_LEAP_TIME, HUNTER_SCALE, HUNTER_SCALE_WIDE, fallTime, splashDelay } from './engine';
import { LocalDemoProvider } from './fairness';
import { DELIVERY, line } from './lines';
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
        // the hunter is drawn larger on phones (see Stage), which changes the line of the shot
        const k = window.matchMedia('(max-width: 560px)').matches ? HUNTER_SCALE : HUNTER_SCALE_WIDE;
        const landIn = st.cause === 'faint' ? fallTime(st.crashY, 0) : splashDelay(st.crashX, st.crashY, k);
        const kind = st.cause === 'faint' ? 'faint' : 'hit';
        if (st.cause === 'faint') sfx.faint(landIn);
        else sfx.crash(landIn);
        // a sad trombone if a bet of the player's went down with the duck
        if (st.slots.some((sl) => sl.result && !sl.result.win)) sfx.sting('lose', 0.35);
        sfx.say(line(kind, st.nonce), 0.25, DELIVERY[kind]);
        // then the croc leaps out of the lake and takes the duck
        const diveIn = landIn + CROC_LEAP_START + CROC_LEAP_TIME;
        sfx.crocLeap(landIn + CROC_LEAP_START + 0.05, diveIn);
        sfx.say(line('stolen', st.nonce), diveIn + 0.2, DELIVERY.stolen);
      },
      miss: () => {
        sfx.miss();
        // fires before the miss is recorded, so one earlier miss makes this the second
        const st = engine.getSnapshot();
        const kind = st.misses.length > 0 ? 'missAgain' : 'miss';
        sfx.say(line(kind, st.nonce + st.misses.length), 0.2, DELIVERY[kind]);
      },
      cashout: () => {
        sfx.cashout();
        sfx.sting('win', 0.05);
        sfx.say(line('cashout', engine.getSnapshot().nonce), 0.3, DELIVERY.cashout);
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
