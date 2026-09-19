// About — editorial "how it works" + legal (Bells Notes rebrand).
// RULE 01–03 rewritten for the solo-dev-for-Bells narrative.
// Moderators = top-8 by uploads in loaded scope, founder first.
// Legal sections versioned legal.v1.
import { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import HapticPressable from '@/components/HapticPressable';
import { useRouter } from 'expo-router';
import { useFacets, useSearchPages } from '@/lib/queries';
import { FOUNDER_EMAIL } from '@shared/catalogue';
import type { Paper } from '@shared/design';
import { Avatar } from '@/components/Avatar';
import { Icon } from '@/icons/icons';
import { fonts } from '@/theme/tokens';
import { useThemeColors } from '@/components/ThemeProvider';
import { SpotArt } from '@/components/SpotArt';

const RULES = [
  {
    label: 'RULE 01',
    title: 'Every paper has a name on it.',
    body: 'Contributors are credited on every paper they share. If you wrote it, put your name on it. If someone else wrote it, leave their name alone.',
  },
  {
    label: 'RULE 02',
    title: 'This is not a business.',
    body: 'Bells Notes is built by a Bells student for Bells students. No ads, no paywalls, no data harvesting. The library belongs to whoever uses it.',
  },
  {
    label: 'RULE 03',
    title: 'Moderators keep the shelves clean.',
    body: 'A rotating group of top contributors reviews every submission. They approve, request changes, or reject. Their decisions are final — and they are also students, so be patient.',
  },
];

const LEGAL: { title: string; body: string }[] = [
  {
    title: 'Privacy',
    body: 'No accounts required. Comments and uploads ask for a display name; email is optional, stays private, and is used only if moderators must reach you. Analytics are opt-out in Settings and contain no personal data.',
  },
  {
    title: 'Terms',
    body: 'Read, save, and share freely for study. Do not abuse voting, comments, or uploads — spam and vote-stuffing are removed, repeat offenders blocked by device.',
  },
  {
    title: 'Content policy',
    body: 'Papers default to CC BY-NC 4.0 unless marked otherwise. Report copyrighted or misattributed work from any paper — 3+ distinct reports auto-flags it for urgent review, and valid takedowns are honored promptly.',
  },
  {
    title: 'Contact',
    body: 'Reach a moderator through any report, or find a contributor on campus. There is no support desk — whoever is around fixes what breaks.',
  },
];

export default function About() {
  const c = useThemeColors();
  const router = useRouter();
  const { results } = useSearchPages();
  const facets = useFacets();

  const moderators = useMemo(() => {
    const counts = new Map<string, { name: string; n: number }>();
    for (const p of results as Paper[]) {
      const e = counts.get(p.contributor);
      if (e) e.n += 1;
      else counts.set(p.contributor, { name: p.contributorName, n: 1 });
    }
    if (!counts.has(FOUNDER_EMAIL) && facets && facets.contributors > 0) {
      counts.set(FOUNDER_EMAIL, { name: 'Caleb', n: 1 });
    }
    return [...counts.entries()]
      .map(([id, v]) => ({ id, ...v, founder: id === FOUNDER_EMAIL }))
      .sort((a, b) => (b.founder ? 1 : 0) - (a.founder ? 1 : 0) || b.n - a.n)
      .slice(0, 8);
  }, [results, facets]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bgDefault }} contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 72, paddingBottom: 120 }}>
      <HapticPressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back" style={{ alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', marginBottom: 8 }}>
        <Icon name="arrow-left" size={18} color={c.textSecondary} />
      </HapticPressable>
      <Text style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 1.7, fontWeight: '600', color: c.textTertiary, fontFamily: fonts.sansSemi, marginBottom: 14 }}>
        How it works · legal.v1
      </Text>
      <View style={{ alignItems: 'center', marginTop: 24 }}>
        <SpotArt name="library" size={140} />
      </View>
      <Text style={{ fontSize: 44, lineHeight: 46, color: c.textPrimary, fontFamily: fonts.serifItalic, marginTop: 20 }}>
        What Bells Notes is.
      </Text>
      <Text style={{ fontSize: 18, color: c.textSecondary, fontFamily: fonts.sans, marginTop: 20, lineHeight: 28 }}>
        A free, open library built by a Bells student for Bells students. Notes, past questions, study guides — no accounts, no paywalls, no nonsense.
      </Text>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 40 }}>
        <View style={{ flex: 1, height: 1, backgroundColor: c.borderDefault }} />
        <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: c.textQuiet }} />
        <View style={{ flex: 1, height: 1, backgroundColor: c.borderDefault }} />
      </View>

      <Text style={{ fontSize: 16, lineHeight: 28, color: c.textPrimary, fontFamily: fonts.sans, marginBottom: 16 }}>
        It started as a shared Google Drive folder. One student, tired of hearing &apos;do you have last year&apos;s notes?&apos; put everything in one place and shared the link.
      </Text>
      <Text style={{ fontSize: 16, lineHeight: 28, color: c.textPrimary, fontFamily: fonts.sans }}>
        That link spread across hostels, across departments, across years. Now it holds thousands of documents — every one left behind by a student who wanted the next person to have it easier.
      </Text>

      <Text style={{ fontSize: 26, fontWeight: '500', color: c.textPrimary, fontFamily: fonts.sansMedium, marginTop: 48, marginBottom: 8 }}>
        Three rules.
      </Text>
      {RULES.map((r, i) => (
        <View key={r.label} style={{ paddingTop: 18, marginBottom: 18, borderTopWidth: i > 0 ? 1 : 0, borderTopColor: c.borderDefault }}>
          <Text style={{ fontSize: 12, color: c.textTertiary, fontFamily: fonts.mono, marginBottom: 6 }}>{r.label}</Text>
          <Text style={{ fontSize: 19, fontWeight: '500', color: c.textPrimary, fontFamily: fonts.sansMedium, marginBottom: 6 }}>
            {r.title}
          </Text>
          <Text style={{ fontSize: 14, lineHeight: 24, color: c.textSecondary, fontFamily: fonts.sans }}>{r.body}</Text>
        </View>
      ))}

      <Text style={{ fontSize: 26, fontWeight: '500', color: c.textPrimary, fontFamily: fonts.sansMedium, marginTop: 40, marginBottom: 8 }}>
        Who runs this.
      </Text>
      <Text style={{ fontSize: 16, lineHeight: 28, color: c.textPrimary, fontFamily: fonts.sans, marginBottom: 16 }}>
        One Bells student built it. A rotating group of contributors keeps it running. There is no university behind it, no company, no ads. If it breaks, whoever is around fixes it.
      </Text>
      <Text style={{ fontSize: 16, lineHeight: 28, color: c.textPrimary, fontFamily: fonts.sans }}>
        Uploading asks for a name and email — the email stays private and is only used if a moderator needs to reach you. No accounts to create, nothing to log in to. Read, upload, or leave.
      </Text>

      <Text style={{ fontSize: 26, fontWeight: '500', color: c.textPrimary, fontFamily: fonts.sansMedium, marginTop: 40, marginBottom: 8 }}>
        Want to help.
      </Text>
      <Text style={{ fontSize: 16, lineHeight: 28, color: c.textPrimary, fontFamily: fonts.sans }}>
        Upload something. Comment on something. Flag something that should not be here. If you want to be a moderator, contribute a dozen papers first — the top contributors get asked when a spot opens.
      </Text>

      {moderators.length > 0 ? (
        <View style={{ marginTop: 48, padding: 24, borderWidth: 1, borderColor: c.borderDefault, borderRadius: 8, backgroundColor: c.bgElevated }}>
          <Text style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 1.7, fontWeight: '600', color: c.textTertiary, fontFamily: fonts.sansSemi, marginBottom: 6 }}>
            Leaderboard · top contributors in your scope
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
            {moderators.map((m, i) => (
              <HapticPressable
                key={m.id}
                onPress={() => router.push(`/profile/${m.id}`)}
                accessibilityRole="button"
                accessibilityLabel={`Rank ${i + 1}: open ${m.name}'s profile`}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 140, minHeight: 44 }}
              >
                <Text style={{ fontSize: 22, color: c.textQuiet, fontFamily: fonts.serifItalic, minWidth: 28 }}>
                  {String(i + 1).padStart(2, '0')}
                </Text>
                <Avatar name={m.name} size={28} />
                <View>
                  <Text numberOfLines={1} style={{ fontSize: 12, fontWeight: '500', color: c.textPrimary, fontFamily: fonts.sansMedium }}>
                    {m.name}
                  </Text>
                  <Text style={{ fontSize: 10, color: c.textTertiary, fontFamily: fonts.mono }}>
                    {m.n} papers
                  </Text>
                </View>
              </HapticPressable>
            ))}
          </View>
        </View>
      ) : null}

      <View style={{ marginTop: 40, gap: 12 }}>
        <HapticPressable
          onPress={() => router.push('/upload')}
          accessibilityRole="button"
          accessibilityLabel="Contribute a paper"
          style={{ backgroundColor: c.textPrimary, borderRadius: 8, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, minHeight: 52 }}
        >
          <Icon name="upload" size={14} color={c.bgDefault} />
          <Text style={{ color: c.bgDefault, fontWeight: '600', fontFamily: fonts.sansSemi }}>Contribute a paper</Text>
        </HapticPressable>
        <HapticPressable
          onPress={() => router.navigate('/(tabs)/browse')}
          accessibilityRole="button"
          accessibilityLabel="Browse the library"
          style={{ borderWidth: 1, borderColor: c.borderStrong, borderRadius: 8, paddingVertical: 14, alignItems: 'center', minHeight: 52, justifyContent: 'center' }}
        >
          <Text style={{ color: c.textPrimary, fontWeight: '500', fontFamily: fonts.sansMedium }}>Browse the library</Text>
        </HapticPressable>
      </View>

      <Text style={{ fontSize: 26, fontWeight: '500', color: c.textPrimary, fontFamily: fonts.sansMedium, marginTop: 56, marginBottom: 8 }}>
        The fine print.
      </Text>
      {LEGAL.map((l) => (
        <View key={l.title} style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: c.textPrimary, fontFamily: fonts.sansSemi, marginBottom: 4 }}>
            {l.title}
          </Text>
          <Text style={{ fontSize: 14, lineHeight: 22, color: c.textSecondary, fontFamily: fonts.sans }}>
            {l.body}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}
