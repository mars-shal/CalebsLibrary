// Convex client — single shared ConvexReactClient + generated api.
// The generated stubs (root convex/_generated) are client-safe (anyApi).
// Mobile NEVER imports convex/ server modules (Metro boundary: only
// ../convex/_generated is watched).
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import type { ReactNode } from 'react';
import { api } from '../../convex/_generated/api';

export { api };

const URL = process.env.EXPO_PUBLIC_CONVEX_URL;

let client: ConvexReactClient | null = null;

export function getConvexClient(): ConvexReactClient {
  if (!client) {
    if (!URL) throw new Error('Missing EXPO_PUBLIC_CONVEX_URL (mobile/.env).');
    client = new ConvexReactClient(URL);
  }
  return client;
}

export function ConvexAppProvider({ children }: { children: ReactNode }) {
  return <ConvexProvider client={getConvexClient()}>{children}</ConvexProvider>;
}
