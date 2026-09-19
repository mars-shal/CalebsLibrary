# Execution prompt — Bells Notes rebrand pass

You're picking up an already-built, working app (Caleb's Library mobile, Expo +
Convex — see the existing `mobile/BUILD_PROMPT.md` phase log for what's already
shipped and working: onboarding, Home/Browse/Search/Subject/Course/Paper, threads,
reputation, exam countdown, timetable, milestones, offline queueing, admin
moderation — all of it functional, `tsc`/lint/`expo-doctor` clean, with a real
1,451-paper synced catalogue). Your job now is a **rebrand and IA restructure**, not
a new build. Do not re-architect or rewrite features that already work — this is a
material/identity change layered on a working product, and any regression to
already-shipped functionality is a phase failure.

## Before you touch anything

1. Read `mobile/PRD.md` and `mobile/UI.md` in full — these are the new, authoritative
   Bells Notes versions. They fully replace the previous Caleb's Library PRD.md/UI.md
   (delete the old ones; these are their replacements, not patches).
2. Read `mobile/REBUILD.md` and `mobile/BUILD_PROMPT.md` as-is — they stay in the repo
   as historical/engineering reference — but apply `PATCH_NOTES.md` to them first
   (small, specific edits only — do not rewrite their phase logs or audit content).
3. If anything in `REBUILD.md`'s or `BUILD_PROMPT.md`'s untouched sections appears to
   contradict `PRD.md`/`UI.md` beyond what `PATCH_NOTES.md` already covers, the new
   `PRD.md`/`UI.md` win — but STOP and flag it rather than silently resolving it. A
   contradiction we didn't anticipate is worth a human look before you guess.

## What you're actually doing, in order

1. **Backend convergence**: stand up the shared Convex account described in
   `PRD.md` §6. Redeploy `convex/*.ts` unchanged (schema v2, diff sync, all
   functions). Reset env vars on the new deployment. Do not touch sync/diff logic —
   it's the fix for the original ban cause and must not regress.
2. **Visual material swap** (`UI.md` §3–4): replace `theme/tokens.ts` (monochrome)
   and `theme/fonts.ts` (Fraunces + General Sans, keep JetBrains Mono). Build the new
   `IndexStack.tsx` component as a genuinely new component, not a patched
   `BookCover.tsx` (`UI.md` §4 explains why). Retint `SafeGlass`'s fallback fills —
   its guard logic and allowed-zones list do not change.
3. **Brand marks + copy** (`UI.md` §1, `PRD.md` §9 R4): replace `BrandMark.tsx`/
   `HeroMark.tsx`. Rewrite banner/About/RULE 01–03 copy for the solo-dev-for-Bells
   narrative — keep the structural pattern (a banner, a numbered-rules About page),
   change the words.
4. **IA restructure** (`PRD.md` §5): promote College to an explicit onboarding step
   (currently deferred/inferred — check `onboarding.tsx`'s current fork logic before
   changing it, since the guest/sign-in/create-account split there is correct and
   must be preserved exactly). Restructure Browse's internal hierarchy to
   College→Program→Level→Course as primary, Notes/PQ as a within-course toggle,
   Subject demoted to a Search facet rather than a top-level browse axis.
5. **State-without-color pass** (`UI.md` §6): audit every place the old app used
   color to carry meaning (vote state, Notes/PQ badges, error/success banners) and
   replace with icon-state + weight + label. This is easy to miss piecemeal — do it
   as a dedicated sweep across all screens, not opportunistically per-screen.
6. **App identity**: update `app.json` (name, scheme, package — package name is
   permanent once shipped, confirm before setting), regenerate brand assets via
   `make-brand-assets.cjs` or its replacement.
7. **Regression pass** (`PRD.md` §9 R5): confirm every already-built feature —
   threads/pinned answers, reputation leaderboard, exam countdown, timetable rail +
   editor, milestones/celebrate, offline outbox, admin moderation, votes, saves,
   citations, short-links — still works end to end under the new visual system, in
   both light/dark and on both platforms. This is the step most likely to get
   shortchanged under time pressure; don't shortchange it.

## Rules that don't change from the existing build discipline

No mocks, no fakes, no dead buttons. `tsc` + lint + `expo-doctor` clean at the end of
every step above. Re-verify a11y (44pt targets, AA contrast — monochrome makes
contrast easier to get subtly wrong, verify explicitly rather than assuming
grayscale is automatically fine) and Reduce Motion/low-power gating after the visual
swap, since both are the kind of thing a material change can silently break.

If a requirement here can't be met at production quality, stop and surface it —
same standard as the original build, not a lower one because this is "just a
reskin."
