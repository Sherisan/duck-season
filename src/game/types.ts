export type Phase = 'waiting' | 'flying' | 'crashed';

export interface Bet {
  amount: number;
  /** Auto cash-out multiplier, or null to cash out by hand. */
  target: number | null;
  cashedAt: number | null;
  auto: boolean;
}

export interface SlotResult {
  win: boolean;
  text: string;
}

/** One of the two bet panels. String fields hold what the player typed. */
export interface Slot {
  amountStr: string;
  targetStr: string;
  cashOn: boolean;
  autoOn: boolean;
  bet: Bet | null;
  queued: boolean;
  result: SlotResult | null;
}

export type RoundsOption = 10 | 25 | 50 | 100 | 'inf';

export interface AutoLimits {
  rounds: RoundsOption;
  left: number;
  profitStr: string;
  lossStr: string;
  net: number;
  active: boolean;
  lastNonce: number;
}

export interface Stats {
  rounds: number;
  wagered: number;
  profit: number;
  best: number;
}

export interface BetRow {
  id: number;
  round: number;
  slot: number;
  bet: number;
  at: number;
  win: boolean;
  profit: number;
}

export interface Celebration {
  label: string;
  total: number;
  at: number;
  mult: number;
}

export interface FlightPoint {
  t: number;
  m: number;
  /** Where the duck was, for the flight trail. */
  x: number;
  y: number;
}

/** A shot the hunter fired and missed: where he aimed, and when. */
export interface Miss {
  at: number;
  x: number;
  y: number;
}

export interface RevealedRound {
  nonce: number;
  serverSeed: string;
  /** Multiplier of his first shot, fixed by the seeds. */
  crash: number;
  /** Where the duck was actually hit (higher than crash if the player dodged). */
  hitAt: number;
}

export interface GameState {
  phase: Phase;
  /** performance.now() of the latest frame. */
  now: number;
  waitEnd: number;
  t0: number;
  mult: number;
  crashAt: number;
  crashX: number;
  crashY: number;
  /** The duck in flight (steered by the player, or on its default path). */
  duckX: number;
  duckY: number;
  /** Duck velocity, for tilting and facing it the way it is going. */
  duckVX: number;
  duckVY: number;
  /** Centre of the hunter's sight, which chases the duck. */
  aimX: number;
  aimY: number;
  /** True once the player has steered the duck this round. */
  steering: boolean;
  /** Shots he has missed this round, latest last. */
  misses: Miss[];
  points: FlightPoint[];
  history: number[];
  nonce: number;
  nextHash: string;
  clientSeed: string;
  revealed: RevealedRound | null;
  balance: number;
  slots: Slot[];
  lim: AutoLimits;
  stats: Stats;
  rows: BetRow[];
  rowId: number;
  toast: string | null;
  celebrate: Celebration | null;
  burstAt: number;
  lastCashAt: number;
  soundOn: boolean;
  cloudX: number;
}
