// Shared short-code — framework-free.
// Ported from convex/shortLink.ts (FNV-1a → base62). Deterministic per paper
// id so re-sharing the same paper reuses its code. Re-implemented here (not
// imported) because convex/* must never ship to any client bundle.

export const SHORT_CODE_CHARS =
  '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const SHORT_CODE_LENGTH = 7;

export function codeFromSeed(seed: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  let value = hash >>> 0;
  let code = '';
  for (let i = 0; i < SHORT_CODE_LENGTH; i++) {
    code += SHORT_CODE_CHARS[value % SHORT_CODE_CHARS.length];
    value = Math.floor(value / SHORT_CODE_CHARS.length);
  }
  return code;
}
