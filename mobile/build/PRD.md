# PRD — Bells Notes (Expo + Shared Convex) — Rebrand + Restructure Contract

> Owner: user. Status: this supersedes the Caleb's Library `PRD.md` entirely — it is
> not a patch. `REBUILD.md`'s audit of the original web app and Convex-ban cause is
> still historically accurate and stays; ignore anything in it that asserts web `src/`
> stays frozen or that mobile must match the website's brand — both are void (see §0).
> `BUILD_PROMPT.md`'s phase log is a real record of what's already built and stays as
> history; new work proceeds as a rebrand phase against this doc and `UI.md`, not a
> from-zero build.

## 0. What's actually true right now (read this before anything else)

The app is not a spec to build — it's a working product to rebrand. As of the last
build log entry: onboarding (guest/sign-in/create-account → program → level), Home,
Browse, Search, Subject/Course, Paper detail (preview, votes, saves, share, threaded
discussion with pinned answers, citations, reports), Saved/Downloads, Upload wizard,
Admin moderation center, Profile, About, Settings, short-link resolver, offline
queueing (outbox), a reputation leaderboard, exam countdown, a timetable rail+editor,
and a milestones/celebration system are all implemented and passing `tsc`/lint/
`expo-doctor`. The Convex backend has a real synced catalogue: 1,451 papers across
5 colleges, split Notes/Lecture Notes/Past Exam/Essay/Problem Set/Study Guide/Cheat
Sheet.

This PRD's job is: (1) restate product identity as Bells Notes, (2) restructure the
IA around College→Program→Level instead of subject-first, (3) formalize the features
that were built ahead of any PRD (threads, reputation, exam countdown, timetable) so
they're no longer undocumented, (4) point both web and mobile at one shared Convex
backend, (5) lock the open reversal: **gamification (milestones/celebrate) is already
built and stays** — this replaces the earlier "decide during build" holding pattern.

## 1. Product summary + goals

Bells Notes is a free, no-forced-account library for Bells students: browse/search/
download Notes + Past Questions, save offline, discuss, vote, contribute via
moderation, track courses via a merged timetable, and personalize entirely by
College → Program → Level. It is explicitly built *for* Bells by a Bells student —
not a neutral, unbranded community project. Signing up (vs. browsing as a guest)
adds cross-device sync and a named identity on comments/uploads.

Goals: (1) rebrand with zero functional regression — every already-shipped feature
above keeps working through the visual/IA change; (2) make College→Program→Level
the primary navigation spine, not a filter bolted onto subject-first browse; (3)
converge web and mobile onto one Convex backend so there is exactly one synced
catalogue, not two; (4) replace the book-cover visual language with the index-stack
concept end to end; (5) ship a monochrome, distinctive-typography visual identity
that reads as neither Caleb's Library nor a generic template.

Success metrics: same technical budgets as before (TTI <2s cached/<4s cold, crash-free
>99.5%, sync writes/day <5k) — carried forward unchanged, since these are
brand-independent. New metric: zero duplicate-catalogue drift between web and mobile
post-convergence (one `syncDiffFromDrive` run, both clients read it).

## 2. Users + personas (unchanged in substance, restated for Bells Notes)

- P1 Reader (majority): a Bells student at a given level/program, wants their own
  courses' Notes + PQs before exams, often offline in a hostel.
- P2 Contributor: uploads notes/PQs, expects timely moderator review.
- P3 Moderator: passphrase-gated (unchanged) — trust model note in §3 covers whether
  signed-up users ever get elevated trust; for now, no.
- P4 Guest/new admit: no program set yet, browses College→Program→Level fresh each
  visit rather than via a saved default.

## 3. Trust model (locked)

- Guest and signed-up are both first-class, permanent paths — not guest-as-onboarding-
  friction before a forced account. A guest never sees an account gate on core
  reading/browsing.
- Signing up unlocks: (a) cross-device sync of bookmarks/downloads/scope, (b) a named
  identity attached to comments and uploads, replacing "anonymous." It does **not**
  currently grant moderation trust — moderators stay passphrase-gated regardless of
  account status. Revisit this only if reputation (already built, see §6) turns out
  to warrant a "trusted contributor" tier later — not in this pass.
- No PII beyond name + email; email stays private (mirrors the original design's
  intent, which the original web app actually violated by exposing Drive-owner email
  publicly — do not repeat that mistake here).

## 4. Scope

V1 (ship, most already built — this is a confirm-and-restructure list, not a
from-scratch one):
- Onboarding: guest / sign-in / create-account fork, then Program → Level. **College
  is currently deferred/inferred — promote it to an explicit first step**, since
  hierarchy-first browsing is the whole point of this restructure (see §5).
- Home, Browse, Search, Subject, Course-filtered list, Paper detail (preview/
  download/cite/discuss/vote/save/share/report), Saved + Downloads manager, Upload,
  Profile, Admin, About, Settings, short-link ingress — all built, carry forward,
  restyle only.
- Threaded discussion with pinned answers, reputation leaderboard, exam countdown,
  timetable rail + editor (StudyFlow absorption) — built ahead of any PRD; formalized
  as in-scope here.
- Milestones/celebration — built; **kept**, not revisited as undecided.
- Full Notes + PQ parity as real synced data (confirmed, proven by the 1,451-paper
  sync).

Explicitly still out for this pass: AI Study Assistant/AI Practice quiz (unchanged
from original — keep the hidden slot, never ship a visible disabled button),
push notifications, LMS integration, elevated trust tiers for signed-up users.

## 5. IA restructure — the actual point of this PRD

Old: subject-first browse, level/college as metadata filters. New: **College →
Program → Level is the primary spine**; Notes vs. PQ is a type toggle *within* a
course, not a separate section (they live in the same Drive course folder, so they
should live in the same place in the app).

- Onboarding: College (promote to explicit step — was deferred) → Program → Level →
  confirm. Guest gets the identical picker, unscoped/re-chosen per session rather
  than persisted.
- Home/Browse read as: your College's Programs → your Program's Level shelf →
  Courses → index-stack card per course, Notes/PQ as a segmented toggle on the course
  screen (already exists as `course/[id]`, just needs the toggle promoted visually).
- Subject as a concept steps back from being the top-level browse axis to being a
  cross-cutting facet inside Search — it doesn't disappear, it demotes.

## 6. Backend contract — single shared Convex account

- **Web and mobile now point at the same Convex deployment.** This is a new decision,
  not carried from the original: the old assumption (web frozen, mobile gets its own
  account) is void now that the website is also becoming Bells Notes.
- Everything in `convex/*.ts` — schema v2 fields (college/program/level/levelYear/
  semester/deptSection), `syncDiffFromDrive` (12h cron, diff not replace-all — this
  is the fix for the original ban cause and must not regress), `catalogue.
  listByLevelProgram/searchPage`, `metrics`, `votes` (deviceHash dedupe), `comments`
  (+ threads/pins), `submissions`, `reports`, `shortLink`, `trends`, `users` — is
  reused as-is. Redeploy to the new shared account; reset env vars there
  (`GOOGLE_DRIVE_API_KEY`, `ADMIN_PASSPHRASE`) — the old account's data does not
  carry over, only the code does.
- Web's `src/script/convex.ts` needs repointing at the new shared deployment as part
  of the site's own rebrand (tracked in the web-side work, not this file) — flagging
  here because it's the same backend both surfaces will hit.
- Short-link host allowlist and any deep-link scheme need the final Bells Notes
  domain/scheme decided before this is finalized (open item, not blocking the doc).

## 7. Non-functional carryovers (unchanged, still binding)

Offline-first (MMKV metadata cache + 300MB LRU PDF cache), no `collect()`-all on any
mobile path, paginated indexed queries only, `metrics.bump` delta clamped ±1 + 5s
throttle, signed short-lived download URLs (never a stored `?key=`), passphrase in
SecureStore, 44pt touch targets, AA contrast, Reduce Motion/low-power decor gating,
`decisions` audit log on every moderation action. None of this is brand-dependent;
none of it should be relitigated during the rebrand pass.

## 8. What changes vs. what doesn't (summary table)

| Area | Status |
|---|---|
| Backend logic, sync, offline system, auth logic | Keep as-is, redeploy to shared account |
| Onboarding logic (guest/signin/signup fork, program/level steps) | Keep, add explicit College step |
| Screen inventory (routes) | Keep, restructure Browse's internal hierarchy |
| Threads/reputation/exam countdown/timetable/milestones | Keep, formalize as in-scope |
| Visual identity (color, type, BookCover, BrandMark/HeroMark, copy/voice) | Replace — see `UI.md` |
| App identity (name, `app.json`, package, scheme, store assets) | Replace |
| Convex account | New shared account for web + mobile |

## 9. Rebrand milestones

R1: shared Convex account stood up, redeployed, env reset, both web and mobile
repointed. R2: `theme/tokens.ts` + `theme/fonts.ts` replaced (monochrome + Fraunces/
General Sans), `app.json` + brand assets regenerated. R3: BookCover → index-stack
component, BrandMark/HeroMark replaced, onboarding gets explicit College step. R4:
copy/voice pass (banner, About, RULE 01–03 rewritten for Bells Notes' solo-dev-for-
Bells narrative) across all screens. R5: QA pass confirming zero functional
regression on every already-built feature (threads, votes, reputation, timetable,
milestones, offline, admin) under the new visual system, both themes, both platforms.

Open: final domain/scheme for short-links + deep links; whether College becomes a
required or skippable onboarding step; web-side rebrand sequencing (parallel to
mobile or staged after).
