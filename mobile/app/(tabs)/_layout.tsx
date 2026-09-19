// Tab bar v2.1 — the "liquid droplet" dock. Floating glass capsule with a
// travelling pill that behaves like a droplet of liquid glass: it STRETCHES
// along its direction of travel mid-flight and settles (squash) as it lands —
// the same physics language as Apple's Liquid Glass, driven by live distance
// so it can never desync from the spring. Glass→ink phase + labels land with
// the pill, unchanged from v1.
//
// v2.1 scroll warp (iOS 26 tab-minimization language): the whole capsule
// CONDENSES as the focused tab's list scrolls down (scaleY down, slight
// sink), stretches subtly on scroll-up, and WOBBLES (skew + pulse) while
// the list rubber-bands at the top. Driven by the module-level Reanimated
// bus in motion/dockScroll.ts — UI-thread, zero JS frames per scroll event.
// Static under Reduce Motion.
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { Tabs } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  useFrameCallback,
} from 'react-native-reanimated';
import { SafeGlass } from '@/components/SafeGlass';
import { Avatar } from '@/components/Avatar';
import { Icon, type IconName } from '@/icons/icons';
import { fonts } from '@/theme/tokens';
import { useThemeColors } from '@/components/ThemeProvider';
import { useSession, firstNameOf, useBookmarks } from '@/lib/store';
import { hapticSelect, useReducedMotion } from '@/motion/motion';
import { dockScroll } from '@/motion/dockScroll';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TABS: { name: string; title: string; icon: IconName }[] = [
  { name: 'index', title: 'Home', icon: 'home' },
  { name: 'browse', title: 'Browse', icon: 'books' },
  { name: 'search', title: 'Search', icon: 'search' },
  { name: 'saved', title: 'Saved', icon: 'bookmark' },
  { name: 'settings', title: 'Settings', icon: 'settings' },
];

interface GlassTabBarProps {
  state: { routes: { key: string; name: string }[]; index: number };
  navigation: {
    navigate: (name: string) => void;
    dispatch: (action: { type: string; target?: string }) => void;
    emit: (e: { type: 'tabPress'; target: string; canPreventDefault: true }) => { defaultPrevented: boolean };
  };
}

function GlassTabBar({ state, navigation }: GlassTabBarProps) {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const profile = useSession((s) => s.profile);
  const savedCount = useBookmarks((s) => s.ids.length);
  const [containerW, setContainerW] = useState(0);
  const [landed, setLanded] = useState(true);
  const tabW = containerW > 0 ? (containerW - 16) / TABS.length : 0;

  const ix = useSharedValue(0);
  const targetX = useSharedValue(0);
  const travelDist = useSharedValue(1);
  const first = useRef(true);
  const prevIndex = useRef(state.index);
  const index = state.index;

  useEffect(() => {
    if (tabW === 0) return;
    const target = index * tabW;
    if (first.current) {
      first.current = false;
      prevIndex.current = index;
      ix.value = target;
      targetX.value = target;
      return;
    }
    if (prevIndex.current === index) {
      ix.value = target;
      targetX.value = target;
      return;
    }
    prevIndex.current = index;
    // Deterministic landing: labels flip on a timer matched to the spring,
    // never on a bridge callback that can strand them mid-travel.
    setLanded(false);
    targetX.value = target;
    travelDist.value = Math.max(1, Math.abs(target - ix.value));
    ix.value = withSpring(target, { stiffness: 550, damping: 48 });
    const t = setTimeout(() => setLanded(true), 450);
    return () => clearTimeout(t);
  }, [index, tabW, ix, targetX, travelDist]);

  // The droplet: translate + fluid deformation. Stretch peaks mid-flight
  // (sin of progress), relaxes as it lands — pure function of live position,
  // so it survives interruption mid-travel (reversing, rapid tapping).
  const droplet = useAnimatedStyle(() => {
    const span = Math.max(1, travelDist.value);
    const p = Math.min(1, Math.abs(targetX.value - ix.value) / span);
    const s = Math.sin(p * Math.PI); // 0 at rest and at landing, 1 mid-flight
    return {
      transform: [
        { translateX: ix.value },
        { scaleX: 1 + 0.16 * s },
        { scaleY: 1 - 0.1 * s },
      ],
    };
  });
  const glassPhase = useAnimatedStyle(() => {
    const span = Math.max(1, travelDist.value);
    const t = Math.min(1, Math.abs(targetX.value - ix.value) / span);
    return { opacity: t };
  });
  const inkPhase = useAnimatedStyle(() => {
    const span = Math.max(1, travelDist.value);
    const t = Math.min(1, Math.abs(targetX.value - ix.value) / span);
    return { opacity: 1 - t };
  });

  // Scroll warp — the capsule reacts like a liquid slab. Velocity drives
  // condense/expand; overscroll drives the wobble. All UI-thread from the
  // dockScroll bus; soft ease-out curve so velocity noise reads as intent.
  // A frame callback decays velocity toward 0 when no scroll events arrive
  // (covers platforms where momentumEnd never fires, e.g. web drags).
  useFrameCallback(() => {
    const v = dockScroll.scrollVel.value;
    if (v !== 0) dockScroll.scrollVel.value = v * 0.9;
    if (Math.abs(v) < 20) dockScroll.scrollVel.value = 0;
  });
  const warp = useAnimatedStyle(() => {
    const MAXV = 3200;
    const v = Math.max(-MAXV, Math.min(MAXV, dockScroll.scrollVel.value));
    const t0 = Math.abs(v) / MAXV;
    const t = t0 * (2 - t0); // easeOut quad
    const down = v >= 0;
    const scaleY = 1 + (down ? -0.12 * t : 0.05 * t);
    const scaleX = 1 + (down ? 0.05 * t : -0.02 * t);
    const sink = down ? 8 * t : -2 * t;
    const o0 = Math.min(1, dockScroll.overscroll.value / 90);
    const o = o0 * (2 - o0);
    const skewX = dockScroll.overscrollDir.value * 2.5 * o;
    const pulse = o * o * 0.05;
    return {
      transform: [
        { translateY: sink + 2 * o },
        { scaleX: scaleX + pulse },
        { scaleY: scaleY + pulse },
        { skewX: `${skewX}deg` },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: Math.max(insets.bottom, 12),
          // Stadium radius ON the shadowed wrapper: a box-shadow follows the
          // element's border-radius, and this wrapper previously had none —
          // so Android/web painted the shadow as a RECTANGLE sticking out
          // past the capsule's round ends (the "rectangular overlay" bug).
          borderRadius: 999,
          // Floating capsule shadow — the dock reads as a physical object
          // hovering above content, not a painted strip. boxShadow is the
          // unified prop on RN 0.76+ (iOS/Android/web alike).
          boxShadow:
            '0 12px 32px rgba(0,0,0,0.24), 0 2px 8px rgba(0,0,0,0.12)',
        },
        // Scroll warp deforms the whole slab, shadow included — it moves
        // like one physical object. Static under Reduce Motion.
        !reduceMotion && warp,
      ]}
    >
      <SafeGlass style={{ borderRadius: 999, overflow: 'hidden' }} radius={999}>
        <View
          onLayout={(e) => setContainerW(e.nativeEvent.layout.width)}
          style={{ flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 8 }}
        >
          {/* travelling droplet: deforms in flight; glass and ink cross-phase */}
          {tabW > 0 ? (
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  top: 8,
                  bottom: 8,
                  left: 8,
                  width: tabW,
                  pointerEvents: 'none',
                },
                droplet,
              ]}
            >
              <Animated.View style={[{ flex: 1 }, inkPhase]}>
                <View
                  style={{
                    flex: 1,
                    backgroundColor: c.textPrimary,
                    borderRadius: 999,
                    ...(Platform.OS === 'web'
                      ? { boxShadow: '0 4px 12px rgba(0,0,0,0.18)' }
                      : {}),
                  }}
                />
              </Animated.View>
              <Animated.View
                style={[
                  { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
                  glassPhase,
                ]}
              >
                <SafeGlass style={{ flex: 1, borderRadius: 999 }}>
                  <View style={{ flex: 1 }} />
                </SafeGlass>
              </Animated.View>
            </Animated.View>
          ) : null}
          {state.routes.map((route, i) => {
            const meta = TABS.find((t) => t.name === route.name) ?? {
              name: route.name,
              title: route.name,
              icon: 'books' as IconName,
            };
            const visuallyFocused = i === index && landed;
            const isSettings = meta.name === 'settings';
            // Active text inverts the pill (pill is always ink100): near-white
            // on charcoal in light mode, near-black on cream in dark mode.
            const activeInk = c.bgDefault;
            const onTabPress = () => {
              void hapticSelect();
              // Standard tabPress emit: lets the navigator pop a focused
              // tab's stack to top, so no tab can ever dead-end.
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (event.defaultPrevented) return;
              if (i !== index) {
                navigation.navigate(route.name);
              } else {
                // Focused tab: pop any screens stacked above it (escape hatch
                // for legacy pushed state + standard platform behaviour).
                navigation.dispatch({ type: 'POP_TO_TOP', target: route.key });
              }
            };
            return (
              <Pressable
                key={route.key}
                onPress={onTabPress}
                accessibilityRole="tab"
                accessibilityState={{ selected: i === index }}
                accessibilityLabel={meta.title}
                style={{
                  flex: 1,
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 3,
                  paddingVertical: 8,
                  minHeight: 56,
                  zIndex: 1,
                }}
              >
                {isSettings && profile ? (
                  <Avatar name={profile.name} size={22} />
                ) : (
                  <View>
                    <Icon
                      name={meta.icon}
                      size={22}
                      color={visuallyFocused ? activeInk : c.textTertiary}
                    />
                    {meta.name === 'saved' && savedCount > 0 ? (
                      <View
                        style={{
                          position: 'absolute',
                          top: -6,
                          right: -10,
                          pointerEvents: 'none',
                          minWidth: 16,
                          height: 16,
                          borderRadius: 8,
                          backgroundColor: c.textPrimary,
                          alignItems: 'center',
                          justifyContent: 'center',
                          paddingHorizontal: 4,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 9,
                            fontWeight: '700',
                            color: c.bgDefault,
                            fontFamily: fonts.sansSemi,
                          }}
                        >
                          {savedCount > 99 ? '99+' : savedCount}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                )}
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: visuallyFocused ? '600' : '400',
                    color: visuallyFocused ? activeInk : c.textTertiary,
                    fontFamily: visuallyFocused ? fonts.sansSemi : fonts.sans,
                  }}
                >
                  {isSettings && profile ? firstNameOf(profile.name) : meta.title}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </SafeGlass>
    </Animated.View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <GlassTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="browse" options={{ title: 'Browse' }} />
      <Tabs.Screen name="search" options={{ title: 'Search' }} />
      <Tabs.Screen name="saved" options={{ title: 'Saved' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
