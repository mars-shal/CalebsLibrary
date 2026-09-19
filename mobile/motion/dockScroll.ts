// Dock scroll telemetry (motion/dockScroll.ts) — the bridge between each
// tab screen's scroll container and the dock's "liquid" pill.
//
// A tiny module-level bus (shared Reanimated values) keeps this off React
// context: the tab bar and the screens never re-render to talk to each
// other, and values run on the UI thread — the dock reacts with zero JS
// frames per scroll event.
//
//   scrollY      — latest offset (px)
//   scrollVel    — vertical velocity (px/s), clamped for warp math
//   overscroll   — |overscroll| px while rubber-banding, 0 otherwise
//   overscrollDir— -1 top overscroll, 0 none (drives wobble skew sign)
//   activeWriter — tag of the list currently feeding the bus. Guards the
//                  reset handlers: a background list's late momentum-end
//                  must not flatten the focused list's live velocity.
//
// Each tab screen calls useDockScrollWiring('tag') and wires the result
// onto an ANIMATED list (Animated.ScrollView / Animated.FlatList):
//   const wire = useDockScrollWiring('home');
//   <Animated.ScrollView onScroll={wire.onScroll}
//     scrollEventThrottle={wire.scrollEventThrottle} ...originalProps />
import { useMemo } from 'react';
import { Platform } from 'react-native';
import {
  makeMutable,
  useAnimatedScrollHandler,
  type SharedValue,
} from 'react-native-reanimated';

export const dockScroll: {
  scrollY: SharedValue<number>;
  scrollVel: SharedValue<number>;
  overscroll: SharedValue<number>;
  overscrollDir: SharedValue<number>;
  activeWriter: SharedValue<string>;
  lastTs: SharedValue<number>;
  lastY: SharedValue<number>;
} = {
  // makeMutable creates REAL shared values outside React (useSharedValue is
  // a hook; module scope needs the raw factory). Same UI-thread semantics.
  scrollY: makeMutable(0),
  scrollVel: makeMutable(0),
  overscroll: makeMutable(0),
  overscrollDir: makeMutable(0),
  activeWriter: makeMutable(''),
  // Velocity derivation state (native events carry velocity; web does not,
  // so we compute it from scroll deltas with exponential smoothing).
  lastTs: makeMutable(0),
  lastY: makeMutable(0),
};

let writerSeq = 0;

export interface DockScrollWiring {
  onScroll: ReturnType<typeof useAnimatedScrollHandler>;
  scrollEventThrottle: number;
}

export function useDockScrollWiring(tag: string): DockScrollWiring {
  // Stable per mount; unique per wiring so simultaneous lists in one
  // screen (Browse tiers, Home sections) can't cross-talk.
  const mySeq = useMemo(() => `${tag}:${++writerSeq}`, [tag]);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      const y = e.contentOffset.y;
      const switching = dockScroll.activeWriter.value !== mySeq;
      dockScroll.activeWriter.value = mySeq;
      dockScroll.scrollY.value = y;

      // Velocity: native events carry it (true fling velocity); web does
      // not, so derive it from deltas + smooth. On writer switch the prev
      // sample belongs to another list — seed with the raw value instead.
      // Clock: Reanimated injects _getAnimationTimestamp into the worklet
      // runtime (UI thread, monotonic ms); Date.now() is the web fallback.
      const now: number =
        (globalThis as { _getAnimationTimestamp?: () => number })
          ._getAnimationTimestamp?.() ?? Date.now();
      const dt = Math.max(8, now - dockScroll.lastTs.value);
      const derived = ((y - dockScroll.lastY.value) / dt) * 1000;
      dockScroll.lastTs.value = now;
      dockScroll.lastY.value = y;
      const raw = Math.max(-4000, Math.min(4000, e.velocity?.y ?? derived));
      dockScroll.scrollVel.value = switching
        ? raw
        : dockScroll.scrollVel.value * 0.55 + raw * 0.45;

      // Content padding means bottom overscroll never fires on iOS; top
      // rubber-band (negative offset) is the common one.
      const over = y < 0 ? -y : 0;
      dockScroll.overscroll.value = over;
      dockScroll.overscrollDir.value = over > 0 ? -1 : 0;
    },
    onMomentumEnd: () => {
      if (dockScroll.activeWriter.value !== mySeq) return;
      dockScroll.scrollVel.value = 0;
      dockScroll.overscroll.value = 0;
      dockScroll.overscrollDir.value = 0;
      dockScroll.lastTs.value = 0;
      dockScroll.lastY.value = 0;
    },
    // NOTE: no onEndDrag reset — the rubber-band bounce is momentum; onScroll
    // already drives overscroll→0 as the offset recovers past the edge.
  });

  return useMemo(
    () => ({
      onScroll,
      // Native: 16ms ≈ 60fps (must be ≤16 for smooth velocity). Web: RN-web
      // ignores scrollEventThrottle; 0 is its default and avoids a warning.
      scrollEventThrottle: Platform.OS === 'web' ? 0 : 16,
    }),
    [onScroll],
  );
}
