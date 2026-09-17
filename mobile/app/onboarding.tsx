// Onboarding — Identity → Program → Level (premium, no passwords).
// Step 0: continue as guest OR sign up with name + email (profile upserted
// on finish; scope doubles as department + level). College deferred (logged
// deviation — schema persists it for later). Skip = guest with full scope.
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useConvex } from 'convex/react';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { CODE_SUBJECTS } from '@shared/catalogue';
import { api } from '@/lib/convex';
import { getDeviceHash } from '@/lib/device';
import { Icon } from '@/icons/icons';
import { SpotArt } from '@/components/SpotArt';
import { fonts, radii, spacing } from '@/theme/tokens';
import { useThemeColors } from '@/components/ThemeProvider';
import { useOnboarding, useSession, type LevelYear } from '@/lib/store';
import { toast } from '@/components/Toast';
import { track } from '@/lib/analytics';

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
  const setScope = useOnboarding((s) => s.setScope);
  const complete = useOnboarding((s) => s.complete);
  const setProfile = useSession((s) => s.setProfile);
  const profile = useSession((s) => s.profile);
  const clearProfile = useSession((s) => s.clearProfile);
  const upsertUser = useMutation(api.users.upsert);

  const [step, setStep] = useState(0);
  // Step 0 is its own fork: sign in (default first screen), create account,
  // or guest. Steps 1–2 (program, level) are shared by all three paths.
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'guest'>('signin');
  const [signinEmail, setSigninEmail] = useState('');
  const [lookingUp, setLookingUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [identityError, setIdentityError] = useState('');
  const [program, setProgram] = useState('all');
  const [levelYear, setLevelYear] = useState<LevelYear>('all');
  const [saving, setSaving] = useState(false);

  const programs = Object.entries(CODE_SUBJECTS).map(([code, dept]) => ({ code, dept }));

  const inputStyle = {
    borderWidth: 1,
    borderColor: c.ruleStrong,
    borderRadius: 8,
    padding: 13,
    fontSize: 15,
    color: c.textPrimary,
    fontFamily: fonts.sans,
    backgroundColor: c.elevated,
    minHeight: 52,
  } as const;

  const finishGuest = () => {
    clearProfile();
    setScope({ program: 'all', levelYear: 'all' });
    complete();
    track('onboarding_complete', { program: 'all', levelYear: 'all' });
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
        program,
        level: levelYear,
      });
      setScope({ program, levelYear });
      complete();
      track('onboarding_complete', { program, levelYear });
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

  const stepArt = step === 0 ? 'link' : step === 1 ? 'shelf' : 'scroll';
  const stepLabel =
    step === 0
      ? authMode === 'signin'
        ? 'Step 1 of 3 · Sign in'
        : authMode === 'signup'
          ? 'Step 1 of 3 · Create account'
          : 'Step 1 of 3 · Guest'
      : step === 1
        ? 'Step 2 of 3 · Program'
        : 'Step 3 of 3 · Level';
  const stepTitle =
    step === 0
      ? authMode === 'signin'
        ? 'Welcome back'
        : authMode === 'signup'
          ? 'Join the shelves'
          : 'Browsing as guest'
      : step === 1
        ? 'What do you study?'
        : 'Which level are you in?';
  const stepSub =
    step === 0
      ? authMode === 'signin'
        ? 'One email, no passwords — we’ll pull up your shelf.'
        : authMode === 'signup'
          ? 'Name + email only — no passwords, ever.'
          : 'Everything works — we just won’t know your name.'
      : step === 1
        ? 'The shelves reshape around your program. Change it anytime in Settings.'
        : 'Only papers for your level surface first. PQs included.';

  return (
    <View style={{ flex: 1, backgroundColor: c.paper }}>
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={{ padding: spacing.gutter, paddingTop: 72, paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ alignItems: 'center', marginBottom: 4 }}>
          <SpotArt name={stepArt} size={104} />
        </View>
        <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={{
                width: step === i ? 24 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: step === i ? c.ink100 : c.ruleStrong,
              }}
            />
          ))}
        </View>
        <Animated.View key={step} entering={FadeInRight.duration(260)}>
          <Text style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 1.7, fontWeight: '600', color: c.textTertiary, fontFamily: fonts.sansSemi, marginBottom: 8 }}>
            {stepLabel}
          </Text>
          <Text style={{ fontSize: 34, lineHeight: 38, color: c.textPrimary, fontFamily: fonts.serifItalic }}>
            {stepTitle}
          </Text>
          <Text style={{ fontSize: 15, color: c.textSecondary, fontFamily: fonts.sans, marginBottom: 16, marginTop: 6 }}>
            {stepSub}
          </Text>

          {step === 0 && authMode === 'signin' ? (
            <View style={{ gap: 12 }}>
              <TextInput
                value={signinEmail}
                onChangeText={(v) => {
                  setSigninEmail(v);
                  setIdentityError('');
                }}
                placeholder="Email address"
                placeholderTextColor={c.textQuiet}
                keyboardType="email-address"
                autoCapitalize="none"
                accessibilityLabel="Email address"
                style={inputStyle}
              />
              {identityError ? (
                <Text style={{ fontSize: 12, color: c.error, fontFamily: fonts.sans }}>
                  {identityError}
                </Text>
              ) : null}
              <Pressable
                onPress={() => void signinLookup()}
                disabled={lookingUp}
                accessibilityRole="button"
                accessibilityLabel="Sign in"
                style={{
                  backgroundColor: c.ink100,
                  borderRadius: radii.card,
                  paddingVertical: 14,
                  alignItems: 'center',
                  minHeight: 52,
                  justifyContent: 'center',
                  opacity: lookingUp ? 0.6 : 1,
                }}
              >
                <Text style={{ color: c.paper, fontWeight: '600', fontSize: 15, fontFamily: fonts.sansSemi }}>
                  {lookingUp ? 'Finding your shelf…' : 'Sign in →'}
                </Text>
              </Pressable>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 4 }}>
                <Text style={{ fontSize: 13, color: c.textTertiary, fontFamily: fonts.sans }}>
                  Don&apos;t have an account?
                </Text>
                <Pressable
                  onPress={() => switchMode('signup')}
                  accessibilityRole="button"
                  accessibilityLabel="Create an account"
                  style={{ minHeight: 44, justifyContent: 'center' }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '600', color: c.textPrimary, fontFamily: fonts.sansSemi, textDecorationLine: 'underline' }}>
                    Create one
                  </Text>
                </Pressable>
              </View>
              <Pressable
                onPress={() => switchMode('guest')}
                accessibilityRole="button"
                accessibilityLabel="Continue as guest"
                style={{ alignItems: 'center', paddingVertical: 12, minHeight: 48, justifyContent: 'center' }}
              >
                <Text style={{ fontSize: 13, color: c.textSecondary, fontFamily: fonts.sansMedium }}>
                  Continue as guest →
                </Text>
              </Pressable>
            </View>
          ) : null}

          {step === 0 && authMode === 'signup' ? (
            <View style={{ gap: 12 }}>
              <TextInput
                value={name}
                onChangeText={(v) => {
                  setName(v);
                  setIdentityError('');
                }}
                placeholder="Your name"
                placeholderTextColor={c.textQuiet}
                accessibilityLabel="Your name"
                style={inputStyle}
              />
              <TextInput
                value={email}
                onChangeText={(v) => {
                  setEmail(v);
                  setIdentityError('');
                }}
                placeholder="Email address"
                placeholderTextColor={c.textQuiet}
                keyboardType="email-address"
                autoCapitalize="none"
                accessibilityLabel="Email address"
                style={inputStyle}
              />
              {identityError ? (
                <Text style={{ fontSize: 12, color: c.error, fontFamily: fonts.sans }}>
                  {identityError}
                </Text>
              ) : null}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Text style={{ fontSize: 13, color: c.textTertiary, fontFamily: fonts.sans }}>
                  Already have an account?
                </Text>
                <Pressable
                  onPress={() => switchMode('signin')}
                  accessibilityRole="button"
                  accessibilityLabel="Back to sign in"
                  style={{ minHeight: 44, justifyContent: 'center' }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '600', color: c.textPrimary, fontFamily: fonts.sansSemi, textDecorationLine: 'underline' }}>
                    Sign in
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          {step === 0 && authMode === 'guest' ? (
            <View style={{ gap: 12 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  padding: 16,
                  borderRadius: radii.card,
                  borderWidth: 1,
                  borderColor: c.ink100,
                  backgroundColor: c.paper2,
                }}
              >
                <Icon name="user" size={20} color={c.textPrimary} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: c.textPrimary, fontFamily: fonts.sansSemi }}>
                    Guest pass ready
                  </Text>
                  <Text style={{ fontSize: 12, color: c.textTertiary, fontFamily: fonts.sans }}>
                    Pick a program and level below — everything still works
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={() => switchMode('signin')}
                accessibilityRole="button"
                accessibilityLabel="Back to sign in"
                style={{ alignItems: 'center', paddingVertical: 12, minHeight: 48, justifyContent: 'center' }}
              >
                <Text style={{ fontSize: 13, color: c.textSecondary, fontFamily: fonts.sansMedium }}>
                  ← Back to sign in
                </Text>
              </Pressable>
            </View>
          ) : null}

          {step === 1 ? (
            <>
              <ProgramRow
                code="all"
                name="All programs"
                active={program === 'all'}
                onPress={() => setProgram('all')}
              />
              {programs.map((p) => (
                <ProgramRow
                  key={p.code}
                  code={p.code}
                  name={p.dept}
                  active={program === p.code}
                  onPress={() => setProgram(p.code)}
                />
              ))}
            </>
          ) : null}

          {step === 2 ? (
            <View style={{ gap: 10 }}>
              {LEVELS.map((l) => {
                const active = levelYear === l.id;
                return (
                  <Pressable
                    key={l.id}
                    onPress={() => setLevelYear(l.id)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={l.label}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: 16,
                      borderRadius: radii.card,
                      borderWidth: 1,
                      borderColor: active ? c.ink100 : c.rule,
                      backgroundColor: active ? c.paper2 : c.elevated,
                      minHeight: 64,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 17, fontWeight: '500', color: c.textPrimary, fontFamily: fonts.sansMedium }}>
                        {l.label}
                      </Text>
                      <Text style={{ fontSize: 12, color: c.textTertiary, fontFamily: fonts.sans }}>{l.sub}</Text>
                    </View>
                    {active ? <Icon name="check" size={18} color={c.textPrimary} /> : null}
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </Animated.View>

        <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
          {step > 0 ? (
            <Pressable
              onPress={() => setStep(step - 1)}
              accessibilityRole="button"
              accessibilityLabel="Back"
              style={{
                paddingVertical: 14,
                paddingHorizontal: 18,
                borderRadius: radii.card,
                borderWidth: 1,
                borderColor: c.ruleStrong,
                minHeight: 52,
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: c.textPrimary, fontWeight: '500', fontFamily: fonts.sansMedium }}>Back</Text>
            </Pressable>
          ) : null}
          {step === 0 && authMode === 'signin' ? null : (
          <Pressable
            onPress={() => {
              if (step < 2) continueFromIdentityStep();
              else if (authMode === 'guest') finishGuestScope();
              else if (profile) finishSignedIn();
              else void finishSignup();
            }}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel={
              step < 2
                ? 'Continue'
                : authMode === 'guest' || profile
                  ? 'Start reading'
                  : 'Create profile'
            }
            style={{
              flex: 1,
              backgroundColor: c.ink100,
              borderRadius: radii.card,
              paddingVertical: 14,
              alignItems: 'center',
              minHeight: 52,
              justifyContent: 'center',
              opacity: saving ? 0.6 : 1,
            }}
          >
            <Text style={{ color: c.paper, fontWeight: '600', fontSize: 15, fontFamily: fonts.sansSemi }}>
              {saving
                ? 'Saving…'
                : step < 2
                  ? 'Continue →'
                  : authMode === 'guest' || profile
                    ? 'Start reading'
                    : 'Create profile →'}
            </Text>
          </Pressable>
          )}
        </View>

        {step === 0 && authMode === 'signin' ? null : (
        <Pressable
          onPress={finishGuest}
          accessibilityRole="button"
          accessibilityLabel="Skip onboarding"
          style={{ alignItems: 'center', paddingVertical: 16, minHeight: 52, justifyContent: 'center' }}
        >
          <Text style={{ fontSize: 13, color: c.textTertiary, fontFamily: fonts.sans }}>Skip — browse everything</Text>
        </Pressable>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
    </View>
  );

  function continueFromIdentityStep() {
    if (step === 0) continueFromIdentity();
    else setStep(step + 1);
  }

  function finishGuestScope() {
    clearProfile();
    setScope({ program, levelYear });
    complete();
    track('onboarding_complete', { program, levelYear });
    toast('Browsing as guest');
    router.replace('/(tabs)');
  }

  function finishSignedIn() {
    setScope({ program, levelYear });
    complete();
    track('onboarding_complete', { program, levelYear });
    router.replace('/(tabs)');
  }
}

function ProgramRow({
  code,
  name,
  active,
  onPress,
}: {
  code: string;
  name: string;
  active: boolean;
  onPress: () => void;
}) {
  const c = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: active }}
      accessibilityLabel={name}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 13,
        paddingHorizontal: 4,
        borderBottomWidth: 1,
        borderBottomColor: c.rule,
        minHeight: 52,
      }}
    >
      <Text style={{ flex: 1, fontSize: 15, color: active ? c.textPrimary : c.textSecondary, fontWeight: active ? '600' : '400', fontFamily: active ? fonts.sansSemi : fonts.sans }}>
        {name}
      </Text>
      <Text style={{ fontSize: 11, color: c.textQuiet, fontFamily: fonts.mono, marginRight: 8 }}>
        {code === 'all' ? 'ALL' : code}
      </Text>
      {active ? <Icon name="check" size={16} color={c.textPrimary} /> : null}
    </Pressable>
  );
}
