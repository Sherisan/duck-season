/**
 * What Sir Reginald says. The stage shows these in his speech bubble and the sound kit speaks them
 * aloud. Each moment has a few lines so he doesn't repeat himself; `line()` picks one from a seed
 * (the round number, plus the shot for misses), so the bubble and the voice always agree.
 */
export const LINES = {
  hit: ['Tally-ho!', 'Got you, you rascal!', 'Bagged it!', 'Splendid shot!'],
  miss: ['Blast! Missed!', 'Hold still, you rascal!', 'Drat that bird!'],
  missAgain: ['Blast it, again!', 'Dash it all!', 'Steady, old boy...'],
  cashout: ['Confound it!', 'Cheeky blighter!', 'Rotten luck!'],
  faint: ['Ha! Out of puff!', 'Too high for you, eh?'],
  stolen: ['I say! That was my duck!', 'Unhand my duck, brute!', 'Good heavens, a croc!'],
} as const;

export type LineKind = keyof typeof LINES;

/** How he delivers each kind of line: a triumphant shout, an exasperated grumble, or outrage. */
export const DELIVERY: Record<LineKind, 'triumph' | 'grumble' | 'outrage'> = {
  hit: 'triumph',
  faint: 'triumph',
  miss: 'grumble',
  missAgain: 'grumble',
  cashout: 'grumble',
  stolen: 'outrage',
};

export function line(kind: LineKind, seed: number): string {
  const list = LINES[kind];
  return list[Math.abs(Math.floor(seed)) % list.length];
}
