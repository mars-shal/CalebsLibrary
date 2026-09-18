// Deep links — calebs:// scheme routing for cold + warm starts.
// The scheme is declared in app.json; until now only /s/:code resolved
// (via the website). This wires Linking so calebs://paper/<id>,
// calebs://course/<id>, calebs://subject/<id> and calebs://s/<code> open
// the right screen in-app, from a cold or warm start.
import { useEffect, useRef } from 'react';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { track } from './analytics';

function routeFor(url: string): string | null {
  const parsed = Linking.parse(url);
  // calebs://paper/xyz → path ["paper","xyz"]; calebs:///paper?… same.
  const segs = (parsed.path ?? '').split('/').filter(Boolean);
  if (segs.length === 0) return null;
  const [head, tail] = segs;
  switch (head) {
    case 'paper':
      return tail ? `/paper/${tail}` : null;
    case 'course':
      return tail ? `/course/${tail}` : null;
    case 'subject':
      return tail ? `/subject/${tail}` : null;
    case 's':
      return tail ? `/s/${tail}` : null;
    default:
      return null; // unknown scheme paths fall through to the normal UI
  }
}

/** Host once in the root layout. Handles getInitialURL (cold) + url events (warm). */
export function useDeepLinks(): void {
  const router = useRouter();
  const handled = useRef(false);

  useEffect(() => {
    const open = (url: string, replace = false) => {
      const route = routeFor(url);
      if (!route) return;
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
