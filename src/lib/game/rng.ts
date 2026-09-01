// Small seedable PRNG (mulberry32) so a simulated month can be replayed for
// debugging/tests. When no seed is supplied we seed from Math.random() once,
// which is indistinguishable from plain randomness during normal play.

export type RNG = () => number; // returns a float in [0, 1)

export function createRng(seed?: number): RNG {
  let a = (seed ?? Math.floor(Math.random() * 2 ** 31)) >>> 0;
  return function mulberry32() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rngInt(rng: RNG, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function rngPick<T>(rng: RNG, items: T[]): T {
  return items[Math.floor(rng() * items.length)];
}

export function chance(rng: RNG, probability: number): boolean {
  return rng() < probability;
}
