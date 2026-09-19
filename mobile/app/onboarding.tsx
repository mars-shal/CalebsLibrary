// Onboarding — full-screen card-flip design. NOT the old SpotArt→dots→list layout.
// Each step is a full-bleed card with a different visual treatment.
import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useConvex, useQuery } from 'convex/react';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SpotArt } from '@/components/SpotArt';
import HapticPressable from '@/components/HapticPressable';
import { entrance, useReducedMotion } from '@/motion/motion';
import { api } from '@/lib/convex';
import { getDeviceHash } from '@/lib/device';
import { Icon } from '@/icons/icons';
import { fonts, radii, spacing } from '@/theme/tokens';
import { useThemeColors, useThemeScheme } from '@/components/ThemeProvider';
import { useOnboarding, useSession, type LevelYear } from '@/lib/store';
import { toast } from '@/components/Toast';
import { track } from '@/lib/analytics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const LEVELS: { id: LevelYear; label: string; sub: string }[] = [
  { id: '1', label: '100 Level', sub: 'Foundation' },
  { id: '2', label: '200 Level', sub: 'Intermediate' },
  { id: '3', label: '300 Level', sub: 'Advanced' },
  { id: '4', label: '400 Level', sub: 'Final year' },
  { id: '5', label: '500 Level', sub: 'Postgraduate' },
  { id: 'all', label: 'All levels', sub: 'Browse everything' },
];

function validEmail(v: string): boolean {
  return /.+@.+\..+/.test(v.trim());
}

export default function Onboarding() {
  const c = useThemeColors();
  const router = useRouter();
  const reduced = useReducedMotion();
  const night = useThemeScheme() === 'dark';
  const insets = useSafeAreaInsets();
  const setScope = useOnboarding((s) => s.setScope);
  const complete = useOnboarding((s) => s.complete);
  const savedCollege = useOnboarding((s) => s.college);
  const savedProgram = useOnboarding((s) => s.program);
  const savedLevel = useOnboarding((s) => s.levelYear);
  const setProfile = useSession((s) => s.setProfile);
  const profile = useSession((s) => s.profile);
  const clearProfile = useSession((s) => s.clearProfile);
  const upsertUser = useMutation(api.users.upsert);

  // Revisit mode: the scope pill and Settings route completed users here to
  // EDIT scope, not to authenticate. The old version always opened on the
  // auth step with blank 'all' pickers — and its skip path wiped the saved
  // profile + scope.
  // done is read REACTIVELY: expo-router keeps this screen mounted after the
  // first visit, so mount-time reads (useState/useRef initializers) freeze at
  // done=false forever and revisits still landed on the auth step.
  const isRevisit = useOnboarding((s) => s.done);
  const [rawStep, setStep] = useState(0);
  // Render-time derivation (not an effect): expo-router may keep this screen
  // mounted, and a revisit can enter at any time — the user must NEVER see
  // the auth step while done=true, regardless of mount/effect timing.
  const step = isRevisit && rawStep === 0 ? 1 : rawStep;
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'guest'>('signin');
  const [signinEmail, setSigninEmail] = useState('');
  const [lookingUp, setLookingUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [identityError, setIdentityError] = useState('');
  const [college, setCollege] = useState(savedCollege);
  const [program, setProgram] = useState(savedProgram);
  const [levelYear, setLevelYear] = useState<LevelYear>(savedLevel);
  const [saving, setSaving] = useState(false);

  const colleges = useQuery(api.catalogue.getColleges);

  const inputStyle = {
    borderWidth: 1.5,
    borderColor: c.borderStrong,
    borderRadius: radii.card,
    padding: 14,
    fontSize: 16,
    color: c.textPrimary,
    fontFamily: fonts.sans,
    backgroundColor: 'transparent',
    minHeight: 52,
  } as const;

  const finishGuest = () => {
    // 'Skip' means "browse everything": reset the SCOPE, but a signed-in
    // user keeps their profile (the old code cleared it here, so editing
    // scope from the pill and skipping silently signed the user out).
    if (!profile) clearProfile();
    setScope({ college: 'all', program: 'all', levelYear: 'all' });
    complete();
    track('onboarding_complete', { college: 'all', program: 'all', levelYear: 'all' });
    toast('Browsing as guest');
    router.replace('/(tabs)');
  };

  const finishSignup = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const res = await upsertUser({
        email: email.trim(),
        name: name.trim(),
        program,
        level: levelYear,
        deviceHash: getDeviceHash(),
      });
      setProfile({
        id: res.id,
        email: email.trim().toLowerCase(),
        name: name.trim(),
        college,
        program,
        level: levelYear,
      });
      setScope({ college, program, levelYear });
      complete();
      track('onboarding_complete', { college, program, levelYear });
      toast(`Welcome, ${name.trim().split(/\s+/)[0]}`);
      router.replace('/(tabs)');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not save profile');
    } finally {
      setSaving(false);
    }
  };

  const convex = useConvex();

  const continueFromIdentity = () => {
    if (authMode === 'guest') {
      setStep(1);
      return;
    }
    if (!name.trim()) {
      setIdentityError('Tell us your name.');
      return;
    }
    if (!validEmail(email)) {
      setIdentityError('Enter a valid email address.');
      return;
    }
    setIdentityError('');
    setStep(1);
  };

  const signinLookup = async () => {
    const em = signinEmail.trim();
    if (!validEmail(em)) {
      setIdentityError('Enter a valid email address.');
      return;
    }
    if (lookingUp) return;
    setLookingUp(true);
    setIdentityError('');
    try {
      const found = await convex.query(api.users.byEmail, { email: em });
      if (!found) {
        setIdentityError('No account for this email yet — create one below.');
        return;
      }
      setProfile({
        id: found._id,
        email: found.email,
        name: found.name,
        program: found.program,
        level: found.level as LevelYear,
        college: found.college,
      });
      setCollege(found.college || 'all');
      setProgram(found.program);
      setLevelYear(found.level as LevelYear);
      setStep(1);
      toast(`Welcome back, ${found.name.split(/\s+/)[0]}`);
    } catch (e) {
      setIdentityError(e instanceof Error ? e.message : 'Could not sign in.');
    } finally {
      setLookingUp(false);
    }
  };

  const switchMode = (m: 'signin' | 'signup' | 'guest') => {
    setAuthMode(m);
    setIdentityError('');
  };

  const totalSteps = 3;
  // Animated progress fill — the bar glides between steps instead of jumping.
  const progressValue = useSharedValue(((step + 1) / 3) * 100);
  useEffect(() => {
    progressValue.value = withTiming(((step + 1) / 3) * 100, { duration: 340 });
  }, [step, progressValue]);
  const progressStyle = useAnimatedStyle(() => ({ width: `${progressValue.value}%` }));

  return (
    <View style={{ flex: 1, backgroundColor: c.bgDefault }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Progress bar */}
        <View style={{ paddingHorizontal: spacing.gutter, paddingTop: Math.max(insets.top, 16) }}>
          <View style={{ height: 3, backgroundColor: c.borderDefault, borderRadius: 2 }}>
            <Animated.View style={[{ height: 3, backgroundColor: c.textPrimary, borderRadius: 2 }, progressStyle]} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
            <Text style={{ fontSize: 11, color: c.textTertiary, fontFamily: fonts.mono }}>
              {step + 1}/{totalSteps}
            </Text>
            {step > 0 ? (
              <Pressable
                onPress={() => {
                  // Revisits entered at the college step: Back returns to the
                  // app instead of into an auth screen they already passed.
                  if (step === 1 && isRevisit) router.back();
                  else setStep(step - 1);
                }} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44, justifyContent: 'center' }}>
                <Icon name="arrow-left" size={14} color={c.textTertiary} />
                <Text style={{ fontSize: 11, color: c.textTertiary, fontFamily: fonts.mono }}>Back</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        <ScrollView
          contentContainerStyle={{ flexGrow: 1, padding: spacing.gutter, paddingBottom: 48 }}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View key={step} entering={reduced ? undefined : entrance.rise()} style={{ flex: 1 }}>
            {/* Step 0: Identity */}
            {step === 0 ? (
              <View style={{ flex: 1 }}>
                <View style={{ marginTop: 20, marginBottom: 36, alignItems: 'center' }}>
                  <View style={{ marginBottom: 18 }}>
                    <SpotArt name={night ? 'study-night' : 'study-day'} size={96} />
                  </View>
                  <Animated.Text
                    entering={reduced ? undefined : entrance.soft(80)}
                    style={{ fontSize: 12, fontWeight: '600', letterSpacing: 2, textTransform: 'uppercase', color: c.textTertiary, fontFamily: fonts.sansSemi, marginBottom: 12, textAlign: 'center' }}
                  >
                    {authMode === 'signin' ? 'Welcome back' : authMode === 'signup' ? 'Join Bells Notes' : 'No account needed'}
                  </Animated.Text>
                  <Animated.Text
                    entering={reduced ? undefined : entrance.soft(150)}
                    style={{ fontSize: 32, lineHeight: 38, fontWeight: '600', color: c.textPrimary, fontFamily: fonts.sansSemi, textAlign: 'center' }}
                  >
                    {authMode === 'signin'
                      ? 'Sign in to your shelf'
                      : authMode === 'signup'
                        ? 'Create your profile'
                        : 'Browse everything'}
                  </Animated.Text>
                </View>

                {authMode === 'signin' ? (
                  <View style={{ gap: 16 }}>
                    <View>
                      <Text style={{ fontSize: 12, fontWeight: '500', color: c.textTertiary, fontFamily: fonts.sansSemi, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Email</Text>
                      <TextInput
                        value={signinEmail}
                        onChangeText={(v) => { setSigninEmail(v); setIdentityError(''); }}
                        placeholder="you@bells.edu"
                        placeholderTextColor={c.textQuiet}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        accessibilityLabel="Email address"
                        style={inputStyle}
                      />
                    </View>
                    {identityError ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Icon name="info" size={14} color={c.error} />
                        <Text style={{ fontSize: 13, color: c.error, fontFamily: fonts.sans }}>{identityError}</Text>
                      </View>
                    ) : null}
                    <Pressable
                      onPress={() => void signinLookup()}
                      disabled={lookingUp}
                      accessibilityRole="button"
                      style={{
                        backgroundColor: c.textPrimary,
                        borderRadius: radii.card,
                        paddingVertical: 16,
                        alignItems: 'center',
                        minHeight: 54,
                        justifyContent: 'center',
                        opacity: lookingUp ? 0.6 : 1,
                      }}
                    >
                      <Text style={{ color: c.bgDefault, fontWeight: '600', fontSize: 15, fontFamily: fonts.sansSemi }}>
                        {lookingUp ? 'Looking up...' : 'Sign in →'}
                      </Text>
                    </Pressable>
                  </View>
                ) : null}

                {authMode === 'signup' ? (
                  <View style={{ gap: 16 }}>
                    <View>
                      <Text style={{ fontSize: 12, fontWeight: '500', color: c.textTertiary, fontFamily: fonts.sansSemi, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Name</Text>
                      <TextInput
                        value={name}
                        onChangeText={(v) => { setName(v); setIdentityError(''); }}
                        placeholder="Your name"
                        placeholderTextColor={c.textQuiet}
                        accessibilityLabel="Your name"
                        style={inputStyle}
                      />
                    </View>
                    <View>
                      <Text style={{ fontSize: 12, fontWeight: '500', color: c.textTertiary, fontFamily: fonts.sansSemi, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Email</Text>
                      <TextInput
                        value={email}
                        onChangeText={(v) => { setEmail(v); setIdentityError(''); }}
                        placeholder="you@bells.edu"
                        placeholderTextColor={c.textQuiet}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        accessibilityLabel="Email address"
                        style={inputStyle}
                      />
                    </View>
                    {identityError ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Icon name="info" size={14} color={c.error} />
                        <Text style={{ fontSize: 13, color: c.error, fontFamily: fonts.sans }}>{identityError}</Text>
                      </View>
                    ) : null}
                    <Pressable
                      onPress={() => void continueFromIdentity()}
                      accessibilityRole="button"
                      style={{
                        backgroundColor: c.textPrimary,
                        borderRadius: radii.card,
                        paddingVertical: 16,
                        alignItems: 'center',
                        minHeight: 54,
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ color: c.bgDefault, fontWeight: '600', fontSize: 15, fontFamily: fonts.sansSemi }}>Continue →</Text>
                    </Pressable>
                  </View>
                ) : null}

                {authMode === 'guest' ? (
                  <View style={{ gap: 16 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 20, borderRadius: radii.card, borderWidth: 1.5, borderColor: c.textPrimary }}>
                      <Icon name="user" size={24} color={c.textPrimary} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 16, fontWeight: '600', color: c.textPrimary, fontFamily: fonts.sansSemi }}>Guest pass</Text>
                        <Text style={{ fontSize: 13, color: c.textTertiary, fontFamily: fonts.sans, marginTop: 2 }}>Pick your college, program, and level next</Text>
                      </View>
                    </View>
                  </View>
                ) : null}
              </View>
            ) : null}

            {/* Steps 1-3: College, Program, Level */}
            {step === 1 ? (
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', letterSpacing: 2, textTransform: 'uppercase', color: c.textTertiary, fontFamily: fonts.sansSemi, marginBottom: 12, marginTop: 32 }}>
                  Your college
                </Text>
                <Text style={{ fontSize: 28, fontWeight: '600', color: c.textPrimary, fontFamily: fonts.sansSemi, marginBottom: 24 }}>
                  Where do you study?
                </Text>
                <View style={{ gap: 8 }}>
                  <HapticPressable
                    onPress={() => setCollege('all')}
                    style={{
                      padding: 16,
                      borderRadius: radii.card,
                      borderWidth: 1.5,
                      borderColor: college === 'all' ? c.textPrimary : c.borderDefault,
                      backgroundColor: college === 'all' ? c.textPrimary : 'transparent',
                      minHeight: 60,
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ flex: 1, fontSize: 16, fontWeight: '500', color: college === 'all' ? c.bgDefault : c.textPrimary, fontFamily: fonts.sansMedium }}>All colleges</Text>
                    {college === 'all' ? <Icon name="check" size={18} color={c.bgDefault} /> : null}
                  </HapticPressable>
                  {colleges === undefined ? (
                    <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                      <ActivityIndicator size="small" color={c.textTertiary} />
                    </View>
                  ) : colleges.length === 0 ? (
                    <Text style={{ fontSize: 14, color: c.textTertiary, fontFamily: fonts.sans, paddingVertical: 12, textAlign: 'center' }}>
                      No colleges found — All colleges is fine.
                    </Text>
                  ) : (
                    colleges.map((col, idx) => (
                      <HapticPressable
                        key={col}
                        onPress={() => setCollege(col)}
                        entering={reduced ? undefined : entrance.soft(120 + idx * 55)}
                        style={{
                          padding: 16,
                          borderRadius: radii.card,
                          borderWidth: 1.5,
                          borderColor: college === col ? c.textPrimary : c.borderDefault,
                          backgroundColor: college === col ? c.textPrimary : 'transparent',
                          minHeight: 60,
                          flexDirection: 'row',
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{ flex: 1, fontSize: 16, fontWeight: '500', color: college === col ? c.bgDefault : c.textPrimary, fontFamily: fonts.sansMedium }}>{col}</Text>
                        {college === col ? <Icon name="check" size={18} color={c.bgDefault} /> : null}
                      </HapticPressable>
                    ))
                  )}
                </View>
              </View>
            ) : null}

            {step === 2 ? (
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', letterSpacing: 2, textTransform: 'uppercase', color: c.textTertiary, fontFamily: fonts.sansSemi, marginBottom: 12, marginTop: 32 }}>
                  Your level
                </Text>
                <Text style={{ fontSize: 28, fontWeight: '600', color: c.textPrimary, fontFamily: fonts.sansSemi, marginBottom: 24 }}>
                  Which level?
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {LEVELS.map((l, idx) => {
                    const active = levelYear === l.id;
                    return (
                      <HapticPressable
                        key={l.id}
                        onPress={() => setLevelYear(l.id)}
                        entering={reduced ? undefined : entrance.soft(100 + idx * 45)}
                        style={{
                          width: '48%',
                          padding: 18,
                          borderRadius: radii.card,
                          borderWidth: 1.5,
                          borderColor: active ? c.textPrimary : c.borderDefault,
                          backgroundColor: active ? c.textPrimary : c.bgElevated,
                          minHeight: 72,
                          justifyContent: 'center',
                        }}
                      >
                        <Text style={{ fontSize: 20, fontWeight: '700', color: active ? c.bgDefault : c.textPrimary, fontFamily: fonts.sansSemi }}>{l.label}</Text>
                        <Text style={{ fontSize: 12, color: active ? c.bgDefault : c.textTertiary, fontFamily: fonts.sans, marginTop: 2, opacity: active ? 0.7 : 1 }}>{l.sub}</Text>
                      </HapticPressable>
                    );
                  })}
                </View>
                <View style={{ marginTop: 24, padding: 16, borderRadius: radii.card, borderWidth: 1, borderColor: c.borderDefault, backgroundColor: c.bgElevated }}>
                  <Text style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 1.7, fontWeight: '600', color: c.textTertiary, fontFamily: fonts.sansSemi, marginBottom: 8 }}>
                    Your scope
                  </Text>
                  <Text style={{ fontSize: 14, color: c.textPrimary, fontFamily: fonts.sansMedium }}>
                    {college === 'all' ? 'All colleges' : college} · {program === 'all' ? 'All programs' : program} · {levelYear === 'all' ? 'All levels' : `${levelYear}00 level`}
                  </Text>
                </View>
              </View>
            ) : null}
          </Animated.View>

          {/* Bottom actions */}
          <View style={{ marginTop: 32, gap: 4 }}>
            {step > 0 ? (
              <Pressable
                onPress={() => {
                  if (step < 2) setStep(step + 1);
                  else if (authMode === 'guest') finishGuestScope();
                  else if (profile) finishSignedIn();
                  else if (isRevisit) finishScopeOnly();
                  else void finishSignup();
                }}
                disabled={saving}
                accessibilityRole="button"
                style={{
                  backgroundColor: c.textPrimary,
                  borderRadius: radii.card,
                  paddingVertical: 16,
                  alignItems: 'center',
                  minHeight: 54,
                  justifyContent: 'center',
                  opacity: saving ? 0.6 : 1,
                }}
              >
                <Text style={{ color: c.bgDefault, fontWeight: '600', fontSize: 15, fontFamily: fonts.sansSemi }}>
                  {saving ? 'Saving...' : step < 2 ? 'Continue →' : authMode === 'guest' || profile ? 'Start reading' : 'Create profile →'}
                </Text>
              </Pressable>
            ) : null}

            {step === 0 && authMode === 'signin' ? (
              <>
                <Pressable onPress={() => switchMode('signup')} style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, minHeight: 44 }}>
                  <Text style={{ fontSize: 13, color: c.textTertiary, fontFamily: fonts.sans }}>No account?</Text>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: c.textPrimary, fontFamily: fonts.sansSemi }}>Create one</Text>
                </Pressable>
                <Pressable onPress={() => switchMode('guest')} style={{ alignItems: 'center', paddingVertical: 8, minHeight: 48, justifyContent: 'center' }}>
                  <Text style={{ fontSize: 13, color: c.textSecondary, fontFamily: fonts.sans }}>Skip →</Text>
                </Pressable>
              </>
            ) : null}

            {step === 0 && authMode === 'signup' ? (
              <Pressable onPress={() => switchMode('signin')} style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, minHeight: 44 }}>
                <Text style={{ fontSize: 13, color: c.textTertiary, fontFamily: fonts.sans }}>Have an account?</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: c.textPrimary, fontFamily: fonts.sansSemi }}>Sign in</Text>
              </Pressable>
            ) : null}

            {step === 0 && authMode === 'guest' ? (
              <>
                <Pressable
                  onPress={() => setStep(1)}
                  disabled={saving}
                  accessibilityRole="button"
                  style={{
                    backgroundColor: c.textPrimary,
                    borderRadius: radii.card,
                    paddingVertical: 16,
                    alignItems: 'center',
                    minHeight: 54,
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: c.bgDefault, fontWeight: '600', fontSize: 15, fontFamily: fonts.sansSemi }}>Continue →</Text>
                </Pressable>
                <Pressable onPress={() => switchMode('signin')} style={{ alignItems: 'center', paddingVertical: 8, minHeight: 48, justifyContent: 'center' }}>
                  <Text style={{ fontSize: 13, color: c.textSecondary, fontFamily: fonts.sans }}>← Back to sign in</Text>
                </Pressable>
              </>
            ) : null}

            {!(step === 0 && authMode === 'signin') ? (
              <Pressable onPress={finishGuest} style={{ alignItems: 'center', paddingVertical: 12, minHeight: 52, justifyContent: 'center' }}>
                <Text style={{ fontSize: 13, color: c.textTertiary, fontFamily: fonts.sans }}>Skip — browse everything</Text>
              </Pressable>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );

  function finishGuestScope() {
    // Guest-mode finish keeps an existing profile: a signed-in user who got
    // here by re-scoping must not be silently signed out.
    if (!profile) clearProfile();
    setScope({ college, program, levelYear });
    complete();
    track('onboarding_complete', { college, program, levelYear });
    toast('Browsing as guest');
    router.replace('/(tabs)');
  }

  // Revisiting guest (no profile, no auth step): save the picked scope and
  // return — never route through signup with empty identity fields.
  function finishScopeOnly() {
    setScope({ college, program, levelYear });
    complete();
    track('onboarding_complete', { college, program, levelYear });
    router.replace('/(tabs)');
  }

  function finishSignedIn() {
    setScope({ college, program, levelYear });
    complete();
    track('onboarding_complete', { college, program, levelYear });
    router.replace('/(tabs)');
  }
}
