// Tab bar — 4 tabs (Home/Browse/Search/Saved) in a floating SafeGlass bar.
// The active pill TRAVELS on a spring; its glass→ink is a smooth phase
// driven by live distance-to-target (full glass at lift-off, full ink the
// instant it lands) — never a timed swap. Labels land with the pill.
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Tabs } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { SafeGlass } from '@/components/SafeGlass';
import { Avatar } from '@/components/Avatar';
import { Icon, type IconName } from '@/icons/icons';
import { fonts } from '@/theme/tokens';
import { useThemeColors } from '@/components/ThemeProvider';
import { useSession, firstNameOf } from '@/lib/store';
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
  const profile = useSession((s) => s.profile);
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

  const pillShift = useAnimatedStyle(() => ({
    transform: [{ translateX: ix.value }],
  }));
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

  return (
    <View
      style={{
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: Math.max(insets.bottom, 12),
      }}
    >
      <SafeGlass style={{ borderRadius: 28, overflow: 'hidden' }}>
        <View
          onLayout={(e) => setContainerW(e.nativeEvent.layout.width)}
          style={{ flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 8 }}
        >
          {/* travelling pill: glass and ink cross-phase with distance */}
          {tabW > 0 ? (
            <Animated.View
              pointerEvents="none"
              style={[
                {
                  position: 'absolute',
                  top: 8,
                  bottom: 8,
                  left: 8,
                  width: tabW,
                },
                pillShift,
              ]}
            >
              <Animated.View style={[{ flex: 1 }, inkPhase]}>
                <View style={{ flex: 1, backgroundColor: c.ink100, borderRadius: 16 }} />
              </Animated.View>
              <Animated.View
                style={[
                  { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
                  glassPhase,
                ]}
              >
                <SafeGlass style={{ flex: 1, borderRadius: 16 }}>
                  <View style={{ flex: 1 }} />
                </SafeGlass>
              </Animated.View>
            </Animated.View>
          ) : null}
          {state.routes.map((route, i) => {
            const meta = TABS.find((t) => t.name === route.name) ?? {
              name: route.name,
              title: route.name,
              icon: 'book' as IconName,
            };
            const visuallyFocused = i === index && landed;
            const isSettings = meta.name === 'settings';
            // Active text inverts the pill (pill is always ink100): near-white
            // on charcoal in light mode, near-black on cream in dark mode.
            // Literal pure white was requested but would vanish in dark mode.
            const activeInk = c.paper;
            const onTabPress = () => {
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
                  <Icon
                    name={meta.icon}
                    size={21}
                    color={visuallyFocused ? activeInk : c.textTertiary}
                  />
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
    </View>
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
