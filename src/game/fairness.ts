import { crashFromHash, crashFromUniform } from './engine';

export interface RoundResult {
  nonce: number;
  /** SHA-256 of the server seed, shown before bets close. */
  hash: string;
  /** Revealed after the round. */
  serverSeed: string;
  crash: number;
}

/**
 * Where round results come from. The demo computes them in the browser.
 * For real play, implement this against your server so the crash point is
 * decided (and kept secret) server-side; the client only gets it at the crash.
 */
export interface RoundProvider {
  next(nonce: number, clientSeed: string): Promise<RoundResult>;
}

export function randomHex(bytes = 32): string {
  const a = new Uint8Array(bytes);
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(a);
  else for (let i = 0; i < bytes; i++) a[i] = Math.floor(Math.random() * 256);
  return Array.from(a, (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function sha256Hex(text: string): Promise<string> {
  if (!globalThis.crypto?.subtle) throw new Error('SubtleCrypto needs https or localhost');
  const buf = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Recomputes a crash point from revealed seeds. */
export async function verifyRound(serverSeed: string, clientSeed: string, nonce: number): Promise<number> {
  return crashFromHash(await sha256Hex(`${serverSeed}:${clientSeed}:${nonce}`));
}

export class LocalDemoProvider implements RoundProvider {
  async next(nonce: number, clientSeed: string): Promise<RoundResult> {
    const serverSeed = randomHex(32);
    try {
      const hash = await sha256Hex(serverSeed);
      const crash = await verifyRound(serverSeed, clientSeed, nonce);
      return { nonce, hash, serverSeed, crash };
    } catch {
      return {
        nonce,
        hash: 'Hashing needs https or localhost; this round used a local random draw.',
        serverSeed,
        crash: crashFromUniform(Math.random()),
      };
    }
  }
}
