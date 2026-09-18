// OTA updates — expo-updates orchestration (the package was installed +
// configured in app.json but never used in code). Checks on foreground,
// downloads silently, applies on next launch (never mid-session restart),
// exposes a manual check for Settings. Failures are silent by design —
// updates are a background nicety, not a user flow.
import * as Updates from 'expo-updates';
import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

export interface UpdateStatus {
  /** True when the running bundle is an OTA update (not the store build). */
  isOTA: boolean;
  /** Human-readable channel fingerprint for support screens. */
  runtimeVersion: string;
  /** Update id currently running (debug/support). */
  updateId: string | null;
}

export function updateStatus(): UpdateStatus {
  return {
    isOTA: Updates.isEnabled && !!Updates.updateId,
    runtimeVersion: Updates.runtimeVersion ?? '?',
    updateId: Updates.updateId ?? null,
  };
}

async function checkOnce(): Promise<'none' | 'available' | 'downloaded'> {
  try {
    if (__DEV__) return 'none';
    const res = await Updates.checkForUpdateAsync();
    if (!res.isAvailable) return 'none';
    const dl = await Updates.fetchUpdateAsync();
    return dl.isNew ? 'downloaded' : 'none';
  } catch {
    return 'none';
  }
}

/**
 * Auto-update loop: check on every foreground, apply on next launch.
 * Returns true once when a new bundle has been downloaded (so the host can
 * toast "update ready — restart to apply").
 */
export function useAutoUpdates(): boolean {
  const [ready, setReady] = useState(false);
  const notified = useRef(false);

  useEffect(() => {
    if (__DEV__) return;
    const run = async () => {
      const r = await checkOnce();
      if (r === 'downloaded' && !notified.current) {
        notified.current = true;
        setReady(true);
      }
    };
    void run();
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') void run();
    });
    return () => sub.remove();
  }, []);

  return ready;
}

/** Manual check (Settings). Returns a user-facing result string. */
export async function checkForUpdateManually(): Promise<string> {
  if (__DEV__) return 'Manual check unavailable in development';
  try {
    const res = await Updates.checkForUpdateAsync();
    if (!res.isAvailable) return 'You are on the latest version';
    const dl = await Updates.fetchUpdateAsync();
    if (!dl.isNew) return 'You are on the latest version';
    await Updates.reloadAsync();
    return 'Update ready — restart the app to apply';
  } catch {
    return 'Could not check for updates — try again later';
  }
}
