// Deep links — bellsnotes:// scheme routing for cold + warm starts.
// The scheme is declared in app.json; until now only /s/:code resolved
// (via the website). This wires Linking so bellsnotes://paper/<id>,
// bellsnotes://course/<id>, bellsnotes://subject/<id> and bellsnotes://s/<code> open
// the right screen in-app, from a cold or warm start.
import { useEffect, useRef } from 'react';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { track } from './analytics';

function routeFor(url: string): string | null {
  const parsed = Linking.parse(url);
  // Single-scheme URLs put the first segment in HOSTNAME, not path:
  //   bellsnotes://paper/xyz  → hostname 'paper', path ['xyz']
  //   bellsnotes:///paper/xyz → hostname null,   path ['paper','xyz']
  // Handle both so the natural share form routes instead of dying.
  const segs = (parsed.path ?? '').split('/').filter(Boolean);
  const head = parsed.hostname || segs[0];
  const tail = parsed.hostname ? segs[0] : segs[1];
  if (!head) return null;
  switch (head) {
    case 'paper':
    case 'course':
    case 'subject':
    case 's':
      return tail ? `/${head}/${tail}` : null;
    default:
      return null; // unknown scheme paths fall through to the normal UI
  }
}

/** Host once in the root layout. Handles getInitialURL (cold) + url events (warm). */
// Module-level flag the onboarding gate reads: while a routed deep link is
// pending/settled, the gate must not yank the user to onboarding/tabs.
export const deepLinkState = { active: false };

export function useDeepLinks(): void {
  const router = useRouter();
  const handled = useRef(false);

  useEffect(() => {
    const open = (url: string, replace = false) => {
      const route = routeFor(url);
      if (!route) return;
      deepLinkState.active = true;
      track('app_open', { deep_link: route });
      if (replace) void router.replace(route as never);
      else void router.push(route as never);
    };

    // Cold start: if the app was launched by a link, route it once —
    // but only after onboarding has had a chance to gate.
    const t = setTimeout(() => {
      if (handled.current) return;
      void Linking.getInitialURL()
        .then((url) => {
          if (url) {
            handled.current = true;
            open(url, true);
          }
        })
        .catch(() => {});
    }, 400);

    const sub = Linking.addEventListener('url', ({ url }) => open(url));
    return () => {
      clearTimeout(t);
      sub.remove();
    };
  }, [router]);
}
