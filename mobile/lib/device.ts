// Device identity — random install-id persisted in MMKV (NOT a fingerprint).
// Used as deviceHash for votes/reports/submissions dedupe. Privacy-safe:
// uninstall resets it; no hardware identifiers ever read.
import { getKV, type KV } from './storage';

const storage: KV = getKV('bellsnotes-device');
const KEY = 'device.hash';

function randomHex(bytes: number): string {
  // CSPRNG-backed: React Native 0.86 ships getRandomValues in the JS runtime.
  const arr = new Uint8Array(bytes);
  globalThis.crypto.getRandomValues(arr);
  let s = '';
  for (const b of arr) s += b.toString(16).padStart(2, '0');
  return s;
}

export function getDeviceHash(): string {
  let h = storage.getString(KEY);
  if (!h) {
    h = `dev_${randomHex(8)}`;
    try {
      storage.set(KEY, h);
    } catch {
      return `dev_${randomHex(8)}`;
    }
  }
  return h;
}
