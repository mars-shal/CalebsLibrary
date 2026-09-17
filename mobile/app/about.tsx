// About — editorial "how it works" + legal (port of AboutView).
// RULE 01–03 verbatim. Moderators = top-8 by uploads in loaded scope,
// founder first (labeled as scope-local, not global). The old "three
// thousand documents" precision claim is dropped (counts shift with scope).
// Legal sections versioned legal.v1.
import { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useFacets, useSearchPages } from '@/lib/queries';
import { FOUNDER_EMAIL } from '@shared/catalogue';
import type { Paper } from '@shared/design';
import { Avatar } from '@/components/Avatar';
import { SpotArt } from '@/components/SpotArt';
import { Icon } from '@/icons/icons';
import { fonts } from '@/theme/tokens';
import { useThemeColors } from '@/components/ThemeProvider';

const RULES = [
  {
    label: 'RULE 01',
    title: 'Attribution is not optional.',
    body: 'Every paper carries the name of the person who contributed it. Take credit for your work; give credit to others’.',
  },
  {
    label: 'RULE 02',
    title: 'No commercial reuse.',
    body: 'The library is a gift from the community to the community. It stays that way.',
  },
  {
    label: 'RULE 03',
    title: 'Moderators have the last word.',
    body: 'A small rotating group of contributors reviews every submission. They approve, request changes, or reject. Their decisions are appealable, but final.',
  },
];

const LEGAL: { title: string; body: string }[] = [
  {
    title: 'Privacy',
    body: 'No accounts. Comments and uploads ask for a display name; email is optional, stays private, and is used only if moderators must reach you. Analytics are opt-out in Settings and contain no personal data.',
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
    body: 'Reach a moderator through any report, or ask a contributor on campus. There is no support desk — whoever is around fixes what breaks.',
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
    <ScrollView style={{ flex: 1, backgroundColor: c.paper }} contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 72, paddingBottom: 120 }}>
      <View style={{ alignItems: 'center', marginBottom: 8 }}>
        <SpotArt name="library" size={150} />
      </View>
      <Text style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 1.7, fontWeight: '600', color: c.textTertiary, fontFamily: fonts.sansSemi, marginBottom: 14 }}>
        How it works · legal.v1
      </Text>
      <Text style={{ fontSize: 44, lineHeight: 46, color: c.textPrimary, fontFamily: fonts.serifItalic }}>
        What Caleb&apos;s Library is.
      </Text>
      <Text style={{ fontSize: 18, color: c.textSecondary, fontFamily: fonts.sans, marginTop: 20, lineHeight: 28 }}>
        An open, community-run collection of student notes, study guides, and papers. Free to read, free to contribute, run by whoever shows up.
      </Text>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 40 }}>
        <View style={{ flex: 1, height: 1, backgroundColor: c.rule }} />
        <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: c.textQuiet }} />
        <View style={{ flex: 1, height: 1, backgroundColor: c.rule }} />
      </View>

      <Text style={{ fontSize: 16, lineHeight: 28, color: c.textPrimary, fontFamily: fonts.sans, marginBottom: 16 }}>
        It began, as most useful things do, as a shared folder. Caleb H. and three friends kept their notes in one place in 2019. That folder spread — first to their year, then to the years below them, then to departments they&apos;d never taken.
      </Text>
      <Text style={{ fontSize: 16, lineHeight: 28, color: c.textPrimary, fontFamily: fonts.sans }}>
        Today it holds thousands of documents. Every one of them was left behind by a student who wanted the next person to have a slightly easier time than they did.
      </Text>

      <Text style={{ fontSize: 26, fontWeight: '500', color: c.textPrimary, fontFamily: fonts.sansMedium, marginTop: 48, marginBottom: 8 }}>
        Three rules.
      </Text>
      {RULES.map((r, i) => (
        <View key={r.label} style={{ paddingTop: 18, marginBottom: 18, borderTopWidth: i > 0 ? 1 : 0, borderTopColor: c.rule }}>
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
        Nobody, and everybody. Caleb started it; a rotating group of about a dozen contributors keeps it running. There&apos;s no university behind it, no company, no ads. If it stops working, whoever&apos;s around fixes it.
      </Text>
      <Text style={{ fontSize: 16, lineHeight: 28, color: c.textPrimary, fontFamily: fonts.sans }}>
        Uploads ask for a name and email — the email stays private and is only used if a moderator needs to reach you. There are no accounts to create, nothing to log in to. Read, upload, or leave.
      </Text>

      <Text style={{ fontSize: 26, fontWeight: '500', color: c.textPrimary, fontFamily: fonts.sansMedium, marginTop: 40, marginBottom: 8 }}>
        Want to help.
      </Text>
      <Text style={{ fontSize: 16, lineHeight: 28, color: c.textPrimary, fontFamily: fonts.sans }}>
        Upload something. Comment on something. Flag something that shouldn&apos;t be here. If you want to be a moderator, contribute a dozen papers first — we ask the top contributors when a moderator spot opens.
      </Text>

      {moderators.length > 0 ? (
        <View style={{ marginTop: 48, padding: 24, borderWidth: 1, borderColor: c.rule, borderRadius: 8, backgroundColor: c.elevated }}>
          <Text style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: 1.7, fontWeight: '600', color: c.textTertiary, fontFamily: fonts.sansSemi, marginBottom: 6 }}>
            Leaderboard · top contributors in your scope
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
            {moderators.map((m, i) => (
              <Pressable
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
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      <View style={{ marginTop: 40, gap: 12 }}>
        <Pressable
          onPress={() => router.push('/upload')}
          accessibilityRole="button"
          accessibilityLabel="Contribute a paper"
          style={{ backgroundColor: c.ink100, borderRadius: 8, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, minHeight: 52 }}
        >
          <Icon name="upload" size={14} color={c.paper} />
          <Text style={{ color: c.paper, fontWeight: '600', fontFamily: fonts.sansSemi }}>Contribute a paper</Text>
        </Pressable>
        <Pressable
          onPress={() => router.navigate('/(tabs)/browse')}
          accessibilityRole="button"
          accessibilityLabel="Browse the library"
          style={{ borderWidth: 1, borderColor: c.ruleStrong, borderRadius: 8, paddingVertical: 14, alignItems: 'center', minHeight: 52, justifyContent: 'center' }}
        >
          <Text style={{ color: c.textPrimary, fontWeight: '500', fontFamily: fonts.sansMedium }}>Browse the library</Text>
        </Pressable>
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
