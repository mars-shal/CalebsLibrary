// Root layout — providers + font gate + onboarding redirect.
// Theme init is async-safe (no render side-effects); fonts gate the splash;
// Convex throws loudly without EXPO_PUBLIC_CONVEX_URL (fail fast, not blank).
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AppState } from 'react-native';
import 'react-native-reanimated';
import { ThemeProvider, useThemeScheme } from '@/components/ThemeProvider';
import { ConvexAppProvider } from '@/lib/convex';
import { NetProvider, useNet } from '@/lib/net';
import { flushOutbox } from '@/lib/outbox';
import { initCrashReporting } from '@/lib/crash';
import { track } from '@/lib/analytics';
import { isStoragePersistent } from '@/lib/storage';
import { useAppFonts } from '@/theme/fonts';
import { ToastHost, toast } from '@/components/Toast';
import { CelebrateHost } from '@/components/Celebrate';
import { useOnboarding } from '@/lib/store';

export { ErrorBoundary } from 'expo-router';

void SplashScreen.preventAutoHideAsync();

function ThemedStatusBar() {
  const scheme = useThemeScheme();
  return <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />;
}

function OnboardingGate() {
  const done = useOnboarding((s) => s.done);
  const segments = useSegments();
  const router = useRouter();
  useEffect(() => {
    // Splash (no segments) routes itself — never yank it mid-moment.
    if (segments[0] === undefined) return;
    const onOnboarding = segments[0] === 'onboarding';
    if (!done && !onOnboarding) router.replace('/onboarding');
    else if (done && onOnboarding) router.replace('/(tabs)');
  }, [done, segments, router]);
  return null;
}

function FlushOnOnline() {
  const { online } = useNet();
  const wasOnline = useRef(true);
  useEffect(() => {
    if (online && !wasOnline.current) {
      setTimeout(() => void flushOutbox(), 1000);
    }
    wasOnline.current = online;
  }, [online]);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') void flushOutbox();
    });
    return () => sub.remove();
  }, []);
  return null;
}

export default function RootLayout() {
  const fontsLoaded = useAppFonts();

  useEffect(() => {
    if (fontsLoaded) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    initCrashReporting();
    track('app_open');
    if (!isStoragePersistent()) {
      setTimeout(
        () => toast('Preview mode — storage resets on reload'),
        1500,
      );
    }
  }, []);

  if (!fontsLoaded) return null;

  return (
    <ThemeProvider>
      <ThemedStatusBar />
      <NetProvider>
        <ConvexAppProvider>
          <OnboardingGate />
          <FlushOnOnline />
          <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="paper/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="subject/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="course/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="downloads" options={{ headerShown: false }} />
          <Stack.Screen name="upload" options={{ headerShown: false }} />
          <Stack.Screen name="admin" options={{ headerShown: false }} />
          <Stack.Screen name="profile/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="about" options={{ headerShown: false }} />
          <Stack.Screen name="s/[code]" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <ToastHost />
        <CelebrateHost />
      </ConvexAppProvider>
      </NetProvider>
    </ThemeProvider>
  );
}
