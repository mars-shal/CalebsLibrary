// Device identity — random install-id persisted in MMKV (NOT a fingerprint).
// Used as deviceHash for votes/reports/submissions dedupe. Privacy-safe:
// uninstall resets it; no hardware identifiers ever read.
import { getKV, type KV } from './storage';

const storage: KV = getKV('bellsnotes-device');
const KEY = 'device.hash';

function randomHex(bytes: number): string {
  const chars = '0123456789abcdef';
  let s = '';
  for (let i = 0; i < bytes * 2; i++) {
    s += chars[Math.floor(Math.random() * 16)];
  }
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
