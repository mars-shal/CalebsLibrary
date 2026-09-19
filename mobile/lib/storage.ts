// Safe storage — MMKV when the native module exists, in-memory otherwise.
// WHY: MMKV v4 is a Nitro (native) module. It is absent in Expo Go and in
// any dev build made before `npm install`, and merely IMPORTING +
// instantiating it red-screens the whole app there. This layer keeps one
// call-site for native init (guarded), so every consumer boots everywhere:
// full persistence on real builds, session-only memory in preview runtimes.
// Preview callers can check `isStoragePersistent()` to banner the difference.

export interface KV {
  getString(key: string): string | undefined;
  set(key: string, value: string): void;
  remove(key: string): void;
}

class MemoryKV implements KV {
  private map = new Map<string, string>();
  getString(key: string): string | undefined {
    return this.map.get(key);
  }
  set(key: string, value: string): void {
    this.map.set(key, value);
  }
  remove(key: string): void {
    this.map.delete(key);
  }
}

const instances = new Map<string, KV>();
let persistent = true;
let warned = false;

// True inside the Expo Go store client, where third-party native modules
// (MMKV/Nitro) can never exist. expo-constants itself ships with Go, so this
// check is always safe to evaluate.
function runningInExpoGo(): boolean {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Constants = require('expo-constants').default as {
      executionEnvironment?: string;
      appOwnership?: string | null;
    };
    return (
      Constants.executionEnvironment === 'storeClient' ||
      Constants.appOwnership === 'expo'
    );
  } catch {
    return false;
  }
}

function envFingerprint(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Constants = require('expo-constants').default as {
      executionEnvironment?: string;
      appOwnership?: string | null;
    };
    return `env=${Constants.executionEnvironment ?? '?'}/owner=${Constants.appOwnership ?? '?'}`;
  } catch {
    return 'env=unknown';
  }
}

function nativeKV(id: string): KV | null {
  if (runningInExpoGo()) return null;
  try {
    // Lazy require: static imports evaluate too early to guard natively.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createMMKV } = require('react-native-mmkv') as {
      createMMKV: (opts: { id: string }) => {
        getString: (k: string) => string | undefined;
        set: (k: string, v: string) => void;
        remove: (k: string) => boolean | void;
      };
    };
    const inst = createMMKV({ id });
    // Touch the native side NOW so a missing module throws here, guarded.
    inst.getString('__bellsnotes_probe__');
    return {
      getString: (k) => inst.getString(k),
      set: (k, v) => inst.set(k, v),
      remove: (k) => {
        inst.remove(k);
      },
    };
  } catch {
    return null;
  }
}

export function getKV(id: string): KV {
  try {
    const hit = instances.get(id);
    if (hit) return hit;
    const native = nativeKV(id);
    let kv: KV;
    if (native) {
      kv = native;
    } else {
      persistent = false;
      if (!warned) {
        warned = true;
        console.warn(
          `[bellsnotes] native storage unavailable (${envFingerprint()}) — using session memory. Persistence is OFF in this runtime.`,
        );
      }
      kv = new MemoryKV();
    }
    instances.set(id, kv);
    return kv;
  } catch {
    persistent = false;
    const mem = new MemoryKV();
    instances.set(id, mem);
    return mem;
  }
}

export function isStoragePersistent(): boolean {
  // Force evaluation so the flag is accurate before first paint consumers.
  getKV('bellsnotes-probe');
  return persistent;
}
