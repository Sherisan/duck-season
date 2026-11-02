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
}

export interface RevealedRound {
  nonce: number;
  serverSeed: string;
  crash: number;
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
