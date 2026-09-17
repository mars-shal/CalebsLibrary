// Connectivity — NetInfo provider + hooks (Phase 6).
// `online` gates the OfflineBadge and outbox flush; `wifi` gates prefetch.
// isInternetReachable false counts as offline (captive portals lie about
// isConnected). No polling — event-driven only.
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';

export interface NetStatus {
  online: boolean;
  wifi: boolean;
}

const NetContext = createContext<NetStatus>({ online: true, wifi: false });

function toStatus(s: NetInfoState): NetStatus {
  return {
    online: !!s.isConnected && s.isInternetReachable !== false,
    wifi: s.type === 'wifi',
  };
}

export function NetProvider({ children }: { children: ReactNode }) {
  const [net, setNet] = useState<NetStatus>({ online: true, wifi: false });

  useEffect(() => {
    void NetInfo.fetch().then((s) => setNet(toStatus(s)));
    const sub = NetInfo.addEventListener((s) => setNet(toStatus(s)));
    return () => sub();
  }, []);

  return <NetContext.Provider value={net}>{children}</NetContext.Provider>;
}

export function useNet(): NetStatus {
  return useContext(NetContext);
}

export function useIsOffline(): boolean {
  return !useContext(NetContext).online;
}

// One-shot connectivity check for event paths (offline_open). Defaults to
// online when undeterminable — never blocks product flows.
export async function isOnlineNow(): Promise<boolean> {
  try {
    const s = await NetInfo.fetch();
    return !!s.isConnected && s.isInternetReachable !== false;
  } catch {
    return true;
  }
}
