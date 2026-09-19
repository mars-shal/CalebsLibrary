# UI.md — Bells Notes Design Contract (Expo)

> Supersedes the Caleb's Library `UI.md` entirely, including its §1 brand-fidelity
> rule (the old rule demanded pixel-matching the website's paper/ink palette and
> typography — that constraint is void; Bells Notes has its own identity). Sits
> alongside `PRD.md` (what) and `REBUILD.md` (historical audit, backend mechanics
> only — its brand assertions are void, see the patch notes). No build decision may
> contradict this file without updating it first.

## 0. Reasoning — what carries over vs. what's new

The engineering *mechanisms* built for Caleb's Library are sound and brand-neutral:
`SafeGlass`'s platform-guard logic, the Reanimated spring motion table, the 40-icon
animate-on-interaction policy, the decor budget philosophy (1 hero + 1 ambient max
per screen), FlashList perf choices. None of that encodes color, type, or voice —
keep all of it. What's replaced is everything that *is* the old brand: the warm
paper/ink palette, EB Garamond + Inter, the BookCover skeuomorph, BrandMark/HeroMark,
and all copy.

Conclusion: reuse the mechanism, replace the material — same principle as the
original extract-don't-transform decision, applied one layer up now that the
material itself (not just the platform) is changing.

## 1. Visual identity (replaces the old brand-fidelity rule)

- **Monochrome only, both themes.** No hue-based palette. Everything is grayscale
  contrast + weight. Light: near-white surface, near-black text, mid-gray for
  secondary/muted, hairline borders at low-opacity black. Dark: near-black surface,
  near-white text, same structure inverted. No accent color anywhere in the UI
  chrome — states that used to be color-coded (vote up/down, Notes vs PQ, error)
  move to icon fill-state + weight + label instead (see §6).
- **Typography carries the "not generic" mandate — this is the identity now that
  color is off the table.** Display/brand serif: **Fraunces** (variable, optical
  sizing at large weights) — reserved for the same limited brand moments the old
  serif had (masthead/hero line, About hero, 404 numeral, wordmark) — never body
  text. UI/body sans: **General Sans** (or Switzer as a fallback pick) — replaces
  Inter everywhere. Meta/mono: keep **JetBrains Mono** — it's a functional choice,
  not a brand one, no reason to change it. Load all three via `expo-font`
  (`@fontsource`/Fontshare packages, both free/OFL, both embed identically on iOS
  and Android — unlike SF/New York, which Apple doesn't license for use outside its
  own OS chrome, ruling that pairing out for a cross-platform app regardless).
- **Voice**: solo-dev-for-Bells, not neutral-community. Rewrite banner, About, and
  RULE 01–03 copy to that narrative (see `PRD.md` §9 R4). Keep the *pattern* of
  having these things (an open banner, an About page with numbered rules) — the
  words change, the structure doesn't need to.

## 2. Principles (unchanged in spirit, restated)

1. Visuals first, text on demand — index-stack card carries the screen; metadata
   beyond title + one meta line hides behind tap/sheet.
2. Apple-lead, Android-true — iOS patterns lead, Android gets Material equivalents,
   identical IA either way.
3. One thumb, 44pt — unchanged.
4. Contrast before beauty — monochrome makes this *harder*, not easier: verify AA on
   every gray-on-gray pairing explicitly, don't assume "it's grayscale so it's fine."
   Never body text over glass/blur.
5. Motion with meaning + escape — same spring table as before (stiffness 320,
   damping 32, mass 0.9), same Reduce Motion/low-power gating. Motion is now doing
   more identity work than color used to — lean into it deliberately (see §5).
6. States are design — unchanged: loading/empty/error/offline all designed, never
   blank.

## 3. Theme bridge (`mobile/theme/`) — full replacement

- `tokens.ts`: monochrome light + dark objects. Radii, spacing, shadow-to-native
  mapping, max-width buckets — all structurally unchanged from the previous token
  file (those were never brand-colored decisions), only the color values inside them
  change to grayscale.
- Glass tokens: tint the `SafeGlass` fallback fills from the new monochrome scale
  instead of the old paper/ink rgba values — same mechanism, new material.
- `fonts.ts`: replace the `@expo-google-fonts/eb-garamond` + `inter` imports with
  Fraunces + General Sans equivalents; keep the JetBrains Mono import unchanged.
- Type roles unchanged in structure (`brandSerif`, `title`, `body`, `meta`,
  `eyebrow`) — same slots, new families.

## 4. The index-stack shelf (replaces BookCover entirely)

- A course renders as 2–3 layered, slightly fanned flat cards (top card front-facing
  with course code + note count, cards behind it just visible as depth cues) —
  no spine, no gradient, no book skeuomorphism. This is the single most
  identity-defining component in the app; it appears everywhere BookCover used to
  (Home, Browse, Subject/Course, Saved, Search results, related).
- Tap interaction: the stack fans out (spring, same motion table as §2.5) to reveal
  the course's Notes/PQ split before navigating in — this is the "wow" moment budget
  for that component; nothing else on the same screen should also compete for it.
- Sizes mirror the old BookCover's size variants (xs–xl) structurally, since screens
  already lay out around those dimensions — only the rendered shape changes, not the
  layout math.
- Build this as a genuinely new component (`IndexStack.tsx`), not a re-skinned
  `BookCover.tsx` — the interaction model (fan-out) is different enough that
  patching the old component in place will fight its existing gesture/press logic.

## 5. Icon + motion systems — mechanism kept, marks reconsidered

- The 40-icon inventory and interaction-triggered-only animation policy (press/focus
  ≤250ms, never looping in lists) carries over as a *spec* — same sizes, same touch
  padding, same rule about Lottie being reserved for onboarding/empty/404/upload-
  success only.
- The actual icon paths are worth redrawing, not reusing verbatim: the old set was
  built to feel SF-like for a brand that no longer exists here. Since this app is
  now leaning on "custom animated icon as identity" harder (color is off the table),
  a bespoke stroke-icon set is worth the investment rather than inheriting Caleb's
  Library's marks unchanged.
- Motion keeps carrying more identity weight than before: the index-stack fan-out,
  screen fade-up, and sheet springs are now the primary "this feels premium" signal,
  since it's no longer color doing that work.

## 6. Distinguishing state without color (new — didn't exist as a problem before)

Monochrome removes the tool the old app used for Notes-vs-PQ, vote state, and
type badges. Replace each with:

- **Notes vs. PQ**: distinct icon (outline vs. filled, or two clearly different
  glyphs) + text label — never a color chip.
- **Vote up/down**: icon fill-state change (outline → filled) + haptic, not a
  red/green shift.
- **Error/success/warning banners**: icon + weight + copy, not a color wash. A
  destructive action (e.g. term-reset) still needs to read as serious without red —
  use a bordered/outlined treatment with heavier icon weight instead.

## 7. Glass system — unchanged mechanism, retinted

`SafeGlass`'s guard logic (`isGlassEffectAPIAvailable()`, `isLiquidGlassAvailable()`,
`reduceTransparency` subscription) and allowed-zones list (floating tab bar,
collapsing header search, paper action cluster, sheet handles, download progress
pill) carry over unchanged. Only the tint values feeding it change to the monochrome
scale. Fallback matrix (iOS 26+ / iOS <26 / Android flagship / Android low-tier /
reduced-transparency) is unchanged in structure.

## 8. Decor inventory — same budget, new inventory

Same rule as before: 1 functional hero + 1 ambient detail max per screen, everything
else gated by Reduce Motion/low-power/<3GB RAM. The old inventory's specific items
(paper grain, cover sheen sweep) were tied to BookCover and the warm palette — replace
with equivalents scaled to the index-stack and monochrome surfaces (e.g. a subtle
depth-shadow shift on stack fan-out as the functional decor moment, an ambient
gradient-free wash — texture via line/dot repetition, not color — as the one ambient
detail on Home).

## 9. Layout, budgets, build order

Unchanged from the original — these were never brand decisions: tab bar structure,
FlashList windowSize, TTI/size/RAM budgets, a11y minimums. Build order for the
rebrand pass specifically: (1) tokens + fonts + IndexStack + retinted SafeGlass,
(2) BrandMark/HeroMark replacements + copy pass, (3) onboarding's new College step,
(4) full-app visual QA against every already-built feature (threads, reputation,
exam countdown, timetable, milestones) to confirm zero functional regression.

## 10. Open inputs

Redrawn icon set timeline (full 40 at once vs. incremental); final General Sans vs.
Switzer pick (both are safe defaults — a side-by-side sample is worth a quick look
before locking); College-step placement in onboarding (before or after the existing
guest/signin/signup fork).
