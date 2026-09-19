// Settings — scope, appearance, storage, support, legal.
// No decorative toggles: every row acts (analytics pipeline lands Phase 7,
// so no opt-out row ships until it controls something real).
import { KeyboardAvoidingView, Platform, Text, TextInput, View } from 'react-native';
import HapticPressable from '@/components/HapticPressable';
import Animated from 'react-native-reanimated';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import * as Clipboard from 'expo-clipboard';
import { checkForUpdateManually, updateStatus } from '@/lib/updates';
import { useMutation } from 'convex/react';
import { api } from '@/lib/convex';
import { getDeviceHash } from '@/lib/device';
import { CODE_SUBJECTS } from '@shared/catalogue';
import { clearCache, storageUsed } from '@/lib/downloads';
import { useBookmarks, useLowDataFlag, useOnboarding, useSession, type LevelYear } from '@/lib/store';
import { scopeLabel } from '@/components/ScopePill';
import { Avatar } from '@/components/Avatar';
import { Segmented } from '@/components/Segmented';
import { useDockScrollWiring } from '@/motion/dockScroll';
import { useGlassTier } from '@/components/SafeGlass';
import { Sheet } from '@/components/Sheet';
import { Icon } from '@/icons/icons';
import { fonts, spacing } from '@/theme/tokens';
import { useThemeChoice, useThemeColors } from '@/components/ThemeProvider';
import { toast } from '@/components/Toast';

const DockScrollView = Animated.ScrollView;

function Row({
  label,
  sub,
  onPress,
  right,
  danger,
}: {
  label: string;
  sub?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  danger?: boolean;
}) {
  const c = useThemeColors();
  const inner = (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, minHeight: 56 }}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, color: danger ? c.error : c.textPrimary, fontFamily: fonts.sansMedium }}>
          {label}
        </Text>
        {sub ? (
          <Text style={{ fontSize: 12, color: c.textTertiary, fontFamily: fonts.sans, marginTop: 2 }}>{sub}</Text>
        ) : null}
      </View>
      {right ?? (onPress ? <Icon name="chevron" size={14} color={c.textQuiet} /> : null)}
    </View>
  );
  if (!onPress) return <View style={{ borderBottomWidth: 1, borderBottomColor: c.borderDefault }}>{inner}</View>;
  return (
    <HapticPressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{ borderBottomWidth: 1, borderBottomColor: c.borderDefault }}
    >
      {inner}
    </HapticPressable>
  );
}

export default function Settings() {
  const c = useThemeColors();
  const router = useRouter();
  const program = useOnboarding((s) => s.program);
  const levelYear = useOnboarding((s) => s.levelYear);
  const reopen = useOnboarding((s) => s.reopen);
  const { choice, setChoice } = useThemeChoice();
  const lowData = useLowDataFlag((s) => s.lowData);
  const toggleLowData = useLowDataFlag((s) => s.toggle);
  const clearBookmarks = useBookmarks((s) => s.clear);
  const [resetOpen, setResetOpen] = useState(false);
  const [armed, setArmed] = useState<'downloads' | 'saved' | null>(null);
  const dockWire = useDockScrollWiring('settings');

  const version = Constants.expoConfig?.version ?? '0.1.0';
  const convexHost = (process.env.EXPO_PUBLIC_CONVEX_URL ?? '').replace('https://', '');
  const glassTier = useGlassTier();

  const copySupport = async () => {
    const text = `Bells Notes ${version} · ${convexHost} · scope ${program}/${levelYear} · storage ${(storageUsed() / 1048576).toFixed(1)}MB · glass ${glassTier}`;
    try {
      await Clipboard.setStringAsync(text);
      toast('Support info copied');
    } catch {
      toast('Copy unavailable');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bgDefault }}>
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
    <DockScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: spacing.gutter, paddingTop: 64, paddingBottom: 120 }} keyboardShouldPersistTaps="handled" onScroll={dockWire.onScroll} scrollEventThrottle={dockWire.scrollEventThrottle}>
      <Text style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 1.7, fontWeight: '600', color: c.textTertiary, fontFamily: fonts.sansSemi, marginBottom: 8 }}>
        Settings
      </Text>
      <Text style={{ fontSize: 34, fontWeight: '500', color: c.textPrimary, fontFamily: fonts.sansMedium, marginBottom: 24 }}>
        Make it yours.
      </Text>

      <ProfileSection />

      <Text style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 1.7, fontWeight: '600', color: c.textTertiary, fontFamily: fonts.sansSemi, marginBottom: 4 }}>
        Study scope
      </Text>
      <Row
        label={scopeLabel(program, levelYear)}
        sub="Program + level filter every list"
        onPress={() => {
          reopen();
          router.push('/onboarding');
        }}
      />

      <Text style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 1.7, fontWeight: '600', color: c.textTertiary, fontFamily: fonts.sansSemi, marginTop: 24, marginBottom: 12 }}>
        Appearance
      </Text>
      <Segmented
        accessibilityLabel="Appearance"
        value={choice}
        onChange={setChoice}
        options={[
          { id: 'system', label: 'System' },
          { id: 'light', label: 'Light' },
          { id: 'dark', label: 'Dark' },
        ]}
      />

      <Text style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 1.7, fontWeight: '600', color: c.textTertiary, fontFamily: fonts.sansSemi, marginTop: 24, marginBottom: 4 }}>
        Offline
      </Text>
      <Row
        label="Downloads"
        sub={`${(storageUsed() / 1048576).toFixed(1)} MB of 300 MB`}
        onPress={() => router.push('/downloads')}
      />
      <Row
        label="Upload a paper"
        sub="Share notes with your school · moderated"
        onPress={() => router.push('/upload')}
      />
      <HapticPressable
        onPress={toggleLowData}
        accessibilityRole="switch"
        accessibilityState={{ checked: lowData }}
        accessibilityLabel="Low-data mode"
        style={{ borderBottomWidth: 1, borderBottomColor: c.borderDefault }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, minHeight: 56 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, color: c.textPrimary, fontFamily: fonts.sansMedium }}>
              Low-data mode
            </Text>
            <Text style={{ fontSize: 12, color: c.textTertiary, fontFamily: fonts.sans, marginTop: 2 }}>
              Code tiles instead of covers · no prefetch
            </Text>
          </View>
          <View
            style={{
              width: 22,
              height: 22,
              borderRadius: 4,
              borderWidth: 1,
              borderColor: lowData ? c.textPrimary : c.borderStrong,
              backgroundColor: lowData ? c.textPrimary : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {lowData ? <Text style={{ color: c.bgDefault, fontSize: 13, fontWeight: '700' }}>✓</Text> : null}
          </View>
        </View>
      </HapticPressable>
      <Row
        label="New term reset"
        sub="Scope, downloads, saved — your call"
        onPress={() => {
          setArmed(null);
          setResetOpen(true);
        }}
      />

      <Text style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 1.7, fontWeight: '600', color: c.textTertiary, fontFamily: fonts.sansSemi, marginTop: 24, marginBottom: 4 }}>
        About
      </Text>
      <Row
        label="Check for updates"
        sub={updateStatus().isOTA ? 'Over-the-air build' : 'Store build'}
        onPress={async () => toast(await checkForUpdateManually())}
      />
      <Row label="How it works + legal" sub="Rules, privacy, terms · legal.v1" onPress={() => router.push('/about')} />
      <Row label="Moderation" sub="Passphrase-gated queue" onPress={() => router.push('/admin')} />
      <Row
        label="Copy support info"
        sub={`v${version} · ${convexHost}`}
        onPress={() => void copySupport()}
      />

      <Sheet visible={resetOpen} onClose={() => { setResetOpen(false); setArmed(null); }} title="New term reset">
        <Text style={{ fontSize: 14, color: c.textSecondary, fontFamily: fonts.sans, lineHeight: 22, marginBottom: 16 }}>
          Starting fresh? Pick what goes. Scope changes apply instantly; clearing downloads or saved asks twice.
        </Text>
        <HapticPressable
          onPress={() => {
            setResetOpen(false);
            reopen();
            router.push('/onboarding');
          }}
          accessibilityRole="button"
          accessibilityLabel="Change study scope"
          style={{ borderWidth: 1, borderColor: c.borderStrong, borderRadius: 8, paddingVertical: 13, alignItems: 'center', minHeight: 52, justifyContent: 'center', marginBottom: 10 }}
        >
          <Text style={{ fontWeight: '500', color: c.textPrimary, fontFamily: fonts.sansMedium }}>Change study scope</Text>
        </HapticPressable>
        <HapticPressable
          onPress={() => {
            if (armed === 'downloads') {
              void clearCache().then(() => {
                setResetOpen(false);
                setArmed(null);
                toast('Downloads cleared');
              });
            } else {
              setArmed('downloads');
            }
          }}
          accessibilityRole="button"
          accessibilityLabel={armed === 'downloads' ? 'Confirm clear downloads' : 'Clear downloads'}
          style={{ borderWidth: 1, borderColor: armed === 'downloads' ? c.error : c.borderStrong, borderRadius: 8, paddingVertical: 13, alignItems: 'center', minHeight: 52, justifyContent: 'center', marginBottom: 10 }}
        >
          <Text style={{ fontWeight: '500', color: armed === 'downloads' ? c.error : c.textPrimary, fontFamily: fonts.sansMedium }}>
            {armed === 'downloads' ? 'Tap again to clear downloads' : 'Clear downloads'}
          </Text>
        </HapticPressable>
        <HapticPressable
          onPress={() => {
            if (armed === 'saved') {
              clearBookmarks();
              setResetOpen(false);
              setArmed(null);
              toast('Saved cleared');
            } else {
              setArmed('saved');
            }
          }}
          accessibilityRole="button"
          accessibilityLabel={armed === 'saved' ? 'Confirm clear saved' : 'Clear saved papers'}
          style={{ borderWidth: 1, borderColor: armed === 'saved' ? c.error : c.borderStrong, borderRadius: 8, paddingVertical: 13, alignItems: 'center', minHeight: 52, justifyContent: 'center' }}
        >
          <Text style={{ fontWeight: '500', color: armed === 'saved' ? c.error : c.textPrimary, fontFamily: fonts.sansMedium }}>
            {armed === 'saved' ? 'Tap again to clear saved' : 'Clear saved papers'}
          </Text>
        </HapticPressable>
      </Sheet>
    </DockScrollView>
    </KeyboardAvoidingView>
    </View>
  );
}

const PROGRAM_CODES = Object.keys(CODE_SUBJECTS);

function ProfileSection() {
  const c = useThemeColors();
  const router = useRouter();
  const profile = useSession((s) => s.profile);
  const patchProfile = useSession((s) => s.patchProfile);
  const clearProfile = useSession((s) => s.clearProfile);
  const reopen = useOnboarding((s) => s.reopen);
  const setScope = useOnboarding((s) => s.setScope);
  const upsertUser = useMutation(api.users.upsert);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const signOut = () => {
    if (!signingOut) {
      setSigningOut(true);
      return;
    }
    clearProfile();
    setSigningOut(false);
    toast('Signed out — browsing as guest');
  };

  const inputStyle = {
    borderWidth: 1,
    borderColor: c.borderStrong,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: c.textPrimary,
    fontFamily: fonts.sans,
    backgroundColor: c.bgElevated,
    minHeight: 48,
  } as const;

  return (
    <View style={{ marginBottom: 8 }}>
      <Text style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 1.7, fontWeight: '600', color: c.textTertiary, fontFamily: fonts.sansSemi, marginBottom: 12 }}>
        Profile
      </Text>
      {!profile ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            padding: 16,
            borderWidth: 1,
            borderColor: c.borderDefault,
            borderRadius: 12,
            backgroundColor: c.bgElevated,
          }}
        >
          <Avatar name="Guest" size={44} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: c.textPrimary, fontFamily: fonts.sansSemi }}>
              Browsing as guest
            </Text>
            <Text style={{ fontSize: 12, color: c.textTertiary, fontFamily: fonts.sans, marginTop: 2 }}>
              Sign in to get greeted by name
            </Text>
          </View>
          <HapticPressable
            onPress={() => {
              reopen();
              router.push('/onboarding');
            }}
            accessibilityRole="button"
            accessibilityLabel="Sign in"
            style={{ backgroundColor: c.textPrimary, borderRadius: 999, paddingVertical: 10, paddingHorizontal: 18, minHeight: 44, justifyContent: 'center' }}
          >
            <Text style={{ color: c.bgDefault, fontWeight: '600', fontSize: 13, fontFamily: fonts.sansSemi }}>Sign in</Text>
          </HapticPressable>
        </View>
      ) : !editing ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            padding: 16,
            borderWidth: 1,
            borderColor: c.borderDefault,
            borderRadius: 12,
            backgroundColor: c.bgElevated,
          }}
        >
          <Avatar name={profile.name} size={44} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: c.textPrimary, fontFamily: fonts.sansSemi }}>
              {profile.name}
            </Text>
            <Text style={{ fontSize: 12, color: c.textTertiary, fontFamily: fonts.sans, marginTop: 2 }}>
              {profile.email} · {profile.program === 'all' ? 'All programs' : profile.program} ·{' '}
              {profile.level === 'all' ? 'All levels' : `${profile.level}00 Level`}
            </Text>
          </View>
          <HapticPressable
            onPress={() => setEditing(true)}
            accessibilityRole="button"
            accessibilityLabel="Edit profile"
            style={{ padding: 10, minHeight: 44, justifyContent: 'center' }}
          >
            <Text style={{ fontSize: 13, fontWeight: '600', color: c.textPrimary, fontFamily: fonts.sansSemi }}>Edit</Text>
          </HapticPressable>
        </View>
      ) : (
        <EditProfileForm
          inputStyle={inputStyle}
          initialName={profile.name}
          initialProgram={profile.program}
          initialLevel={profile.level as LevelYear}
          saving={saving}
          onCancel={() => setEditing(false)}
          onSave={(n, p, l) => {
            void saveWith(n, p, l);
          }}
        />
      )}
      {profile && !editing ? (
        <HapticPressable
          onPress={signOut}
          accessibilityRole="button"
          accessibilityLabel={signingOut ? 'Confirm sign out' : 'Sign out'}
          style={{ marginTop: 10, alignItems: 'center', paddingVertical: 12, minHeight: 48, justifyContent: 'center' }}
        >
          <Text style={{ fontSize: 13, color: c.error, fontFamily: fonts.sansMedium }}>
            {signingOut ? 'Tap again to sign out' : 'Sign out'}
          </Text>
        </HapticPressable>
      ) : null}
    </View>
  );

  async function saveWith(n: string, p: string, l: LevelYear) {
    if (saving) return;
    const clean = n.trim();
    if (!clean) {
      toast('Name can’t be empty');
      return;
    }
    setSaving(true);
    try {
      await upsertUser({
        email: profile!.email,
        name: clean,
        program: p,
        level: l,
        college: profile!.college,
        deviceHash: getDeviceHash(),
      });
      patchProfile({ name: clean, program: p, level: l });
      setScope({ college: profile!.college ?? 'all', program: p, levelYear: l });
      setEditing(false);
      toast('Profile updated');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  }
}

function EditProfileForm({
  inputStyle,
  initialName,
  initialProgram,
  initialLevel,
  saving,
  onCancel,
  onSave,
}: {
  inputStyle: object;
  initialName: string;
  initialProgram: string;
  initialLevel: LevelYear;
  saving: boolean;
  onCancel: () => void;
  onSave: (name: string, program: string, level: LevelYear) => void;
}) {
  const c = useThemeColors();
  const [formName, setFormName] = useState(initialName);
  const [formProgram, setFormProgram] = useState(initialProgram);
  const [formLevel, setFormLevel] = useState<LevelYear>(initialLevel);
  return (
    <View style={{ borderWidth: 1, borderColor: c.borderDefault, borderRadius: 12, backgroundColor: c.bgElevated, padding: 16, gap: 12 }}>
      <TextInput
        value={formName}
        onChangeText={setFormName}
        placeholder="Your name"
        placeholderTextColor={c.textQuiet}
        accessibilityLabel="Your name"
        style={inputStyle}
      />
      <Text style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 1.7, fontWeight: '600', color: c.textTertiary, fontFamily: fonts.sansSemi }}>
        Program
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {['all', ...PROGRAM_CODES.slice(0, 11)].map((code) => {
          const active = formProgram === code;
          return (
            <HapticPressable
              key={code}
              onPress={() => setFormProgram(code)}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              accessibilityLabel={code === 'all' ? 'All programs' : code}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: active ? 999 : 4,
                backgroundColor: active ? c.textPrimary : 'transparent',
                borderWidth: 1,
                borderColor: active ? c.textPrimary : c.borderStrong,
                minHeight: 40,
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '500', color: active ? c.bgDefault : c.textSecondary, fontFamily: fonts.sansMedium }}>
                {code === 'all' ? 'ALL' : code}
              </Text>
            </HapticPressable>
          );
        })}
      </View>
      <Text style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 1.7, fontWeight: '600', color: c.textTertiary, fontFamily: fonts.sansSemi }}>
        Level
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {(['1', '2', '3', '4', '5', 'all'] as LevelYear[]).map((l) => {
          const active = formLevel === l;
          return (
            <HapticPressable
              key={l}
              onPress={() => setFormLevel(l)}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              accessibilityLabel={l === 'all' ? 'All levels' : `${l}00 level`}
              style={{
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: active ? 999 : 4,
                backgroundColor: active ? c.textPrimary : 'transparent',
                borderWidth: 1,
                borderColor: active ? c.textPrimary : c.borderStrong,
                minHeight: 40,
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '500', color: active ? c.bgDefault : c.textSecondary, fontFamily: fonts.sansMedium }}>
                {l === 'all' ? 'ALL' : `${l}00`}
              </Text>
            </HapticPressable>
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
        <HapticPressable
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel="Cancel editing"
          style={{ flex: 1, borderWidth: 1, borderColor: c.borderStrong, borderRadius: 8, paddingVertical: 12, alignItems: 'center', minHeight: 48, justifyContent: 'center' }}
        >
          <Text style={{ fontWeight: '500', color: c.textPrimary, fontFamily: fonts.sansMedium }}>Cancel</Text>
        </HapticPressable>
        <HapticPressable
          onPress={() => onSave(formName, formProgram, formLevel)}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel="Save profile"
          style={{ flex: 1, backgroundColor: c.textPrimary, borderRadius: 8, paddingVertical: 12, alignItems: 'center', minHeight: 48, justifyContent: 'center', opacity: saving ? 0.6 : 1 }}
        >
          <Text style={{ fontWeight: '600', color: c.bgDefault, fontFamily: fonts.sansSemi }}>
            {saving ? 'Saving…' : 'Save'}
          </Text>
        </HapticPressable>
      </View>
    </View>
  );
}
