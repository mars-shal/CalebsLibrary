# Caleb's Library — Mobile Rebuild Context (Expo + Own Convex)

> Status: PLANNING ONLY. Do not build until user says so. This file is the single source of truth for the rebuild. Next step after this is UI planning.

## 0. Locked decisions

- Mobile: **React Native / Expo (expo-router)** — NOT Capacitor wrap, NOT Flutter, NOT native.
- Backend: **Keep Convex, new account (own deployment)**. Same Drive as source, fixed sync.
- Scope v1: **Full parity — Notes + PQs + uploads + comments + votes + bookmarks + short-links + trends + admin moderation.** Notes-only was rejected; PQs must ship.
- Offline: **Yes, offline-first** — metadata cache + on-device PDF cache with LRU.
- Repo shape: **monorepo, new folders. Do NOT transform `src/*.vue` in place.**
  ```
  CalebsLibrary/
    convex/      <- evolve to v2 (this file's spec)
    src/         <- web as-is, frozen
    shared/      <- NEW: pure TS (schema + helpers, no Vue/RN imports)
    mobile/      <- NEW: Expo app
  ```

## 1. What the web app actually is (audited)

Stack: Vue 3.5 + Vite 7 + vue-router 5 + Pinia 3 + convex 1.45 + convex-vue 0.1.5 + convex-helpers + Tailwind 4.2 (reset-only) + tokens.css + Zod 4 + Vercel Analytics + GA `G-4SJRWGP4SZ`.

Routes (`src/router/index.ts`): 11, `createWebHistory`, no guards, `scrollBehavior -> top:0`:
- `/` HomeView — masthead phrase rotation (DAY 11 / NIGHT 12 / SEASON exam-test-term / WEEKDAY pools, `phraseFor(date)`, `nextBoundary` 6am/6pm refresh), big search + `useSearchAutocomplete`, trending pills top-8, stats strip, Recently added 5-grid.
- `/browse` BrowseView — shelves grouped by subject. Filters: subject pills, course select, type pills (PAPER_TYPES 8), year select, sort dept/course/year-new/year-old/reads/upvotes. Perf: `RENDER_CHUNK=3`, `MAX_BOOKS_PER_SHELF=24`, IntersectionObserver sentinel rootMargin 600px.
- `/search?q=` SearchView — big input + autocomplete, facets (subject checkbox top-12, type 6, dual-thumb year range inputs), sorts relevance/newest/votes/downloads, `<mark>` highlight via `segments()`, 10/page pagination with `visiblePages` window 5 + ellipsis.
- `/subject/:id` SubjectView — hero (breadcrumb, count/contributors/courses), essentials first-4 slice, Every course 2-col rows (row currently re-pushes same subject route — BUG, should go to course-filtered browse), All papers 6-grid (no pagination — heavy), Top contributors top-8 by count.
- `/paper/:id` PaperView — breadcrumb, BookCover lg + tags/title/subtitle/contributor + meta (pages/ext/views/timeAgo), actions: Download (`window.open(downloadUrl)` + `recordMetric(downloads)`), AI button DISABLED "Coming soon", Save (localStorage bookmarks toggle), Share (`shortLink.create` -> clipboard, fallback full URL), vote up/down toggle with `localStorage calebsLibraryVotes` (1/0/-1, delta ±1 both sides), Report button DEAD (no handler). Tabs Preview/Citation/Discussion(count). Details card: Course/Professor(always `teacher=''` -> '—')/Language English hardcoded/License CC BY-NC hardcoded/Size/Uploaded. Related: same-subject first-4 slice. Comments: `convex.query(list)` + `convex.onUpdate(list)` live, composer name+body, `postDiscussion`.
- `/s/:code` ShortLinkView — `bumpClicks` fire-and-forget + `getByCode` -> `window.location.replace(url)`, else missing state. Works on static hosts.
- `/upload` UploadView — PAUSED placeholder only. Supabase pipeline removed. Keep route.
- `/profile/:id` ProfileView — hero (96px avatar, founder flag, handle, uploads + reads), tabs Papers/Shelves/About. Shelves HARDCODED mock (`Beowulf & Old English 8 / Modernist essays 12 / First-year survival 6`). `reads = uploads*187` FAKE. About text hardcoded "since 2023... end of semester".
- `/admin` AdminView — passphrase gate -> queue Pending/Approved/Rejected chips + rail + review panel Approve/Reject+note. `localStorage calebs_admin=1` + `sessionStorage calebs_pass`. Auto-load if flag. `signOut` clears both.
- `/about` AboutView — RULE 01-03 static, moderators = top-8 by uploads founder-first, CTAs to upload/browse.
- `/:pathMatch` NotFoundView — fallen stack uses `papers[3], papers[7], papers[11]` rotated -14/-38/24deg, serif 404.

Shell (`src/App.vue`): AppBanner + TopStrip + RouterView keyed by fullPath + AppFooter. `drive.load()` on mount. `src/main.ts`: Pinia + Router + Vercel Analytics + convexVue(VITE_CONVEX_URL).

Components (12): AppBanner (32px ink bar, `calebs_banner_dismissed`), TopStrip (56px sticky, logo serif+Caps, mini-search hidden on home + autocomplete, Browse/About + theme toggle `calebs_theme`/`html.dark` — NOTE theme applied as render side-effect in setup, do NOT port pattern; init async on mobile), AppFooter (4-col, `©2026`), BookCover (2:3, spine+grain, 5 sizes xs-xl w 60/120/132/168/224, `COVERS[cover%16]`), PaperCard (cover+2-line title+type·▲upvotes, hover -2px), PDFPreview (iframe `previewUrl` else mock page), Icon (40 entries: 39 stroke 24x24 1.75px + `google` only filled), Avatar (ink circle, initials size*0.42), SectionHeader, Stat, SkeletonCard, Ornament.

Storage keys (7 total — migrate ALL): `calebs_banner_dismissed`, `calebsLibraryCatalogueCache` (+version `1`), `calebsLibraryBookmarks`, `calebs_admin`, `calebs_pass` (session only → SecureStore), `calebsLibraryVotes`, `calebs_theme`.

Fresh-sweep corrections (audit 2): `main.css:5-10` global `*` transition on bg/border/color — NEVER port (perf trap + glass flicker). `App.vue:21` RouterView `:key=fullPath` full-remounts every nav — mobile must preserve stack state. `parents` array in schema is dead weight (fetched, stored, never rendered) — drop from mobile projections. A11y: only 4 aria-labels in entire web app (banner dismiss, logo, search, theme) — vote/save/share/filter/sort/sheets unlabeled; mobile labels ALL. PII: `contributor` id = Drive owner email, handle = `@email-prefix` — public exposure; mobile needs anonymized display + consent. Security: `shortLink.create` is a PUBLIC mutation storing ARBITRARY urls + resolver redirects blindly = open-redirect/phishing vector → allowlist hosts + rate-limit. `metrics.bump` accepts ARBITRARY int delta → clamp ±1 + 5s throttle. `.gitignore` misses `.playwright-mcp/` + future mobile secrets (`mobile/.expo`, `*.jks`, `GoogleService-*`); toolchain pins Java/Gradle/Xcode/EAS alongside node engines. Metro risk: `src/script/convex.ts:6` imports `../../convex/_generated/api` — breaks when code moves to `mobile/`; keep `convex/` at root + alias + pin identical `convex` version in mobile.

Store (`src/stores/drive.ts`): `papers/courses/subjects/ownerList/loading/loaded/error/searchTrends`. Derives courses (`parseCourseName` + LEVEL_DESC), subjects (CODE_SUBJECTS), owners (FOUNDER_EMAIL ensured), stats (`reads = sum(views)/12` — FAKE divisor). `search()` substring over title/subject/course/type/contributor + filters. `recentPapers` sort createdAt slice 5, `lovedPapers` sort upvotes slice 8. Load: hydrate localStorage `calebsLibraryCatalogueCache v1` -> parallel `catalogue.get + metrics.getAll + trends.getTop` -> apply overlay -> writeCache -> 30s `setInterval(refresh)`. `recordMetric` optimistic + `metrics.bump`. `recordSearch` optimistic + `trends.record`.

Composable `useSearchAutocomplete.ts`: module-scoped `query` persists, merges papers/subjects/courses max 6, minLength 2, keyboard Up/Down/Enter/Esc, pointerdown-outside close.

Shared `src/schema/catalogue.ts`: FOUNDER_EMAIL, CODE_SUBJECTS ~34 codes, LEVEL_DESC 1-5, Zod `catalogueItemSchema` (NO level/semester/college — GAP), helpers slugify/parseCourseName(BUT-XXX 000 (paren))/hashString(djb2)/typeFromName/extFromName/formatBytes/estimatePages(bytes/30k clamp 2-250).

`src/script/design.ts`: types Contributor/Course/Subject/Paper=CatalogueItem, `contributorRegistry` + FALLBACK 'Community', COVERS 16, PAPER_TYPES 8, formatCount(k)/timeAgo().
`src/script/trends.ts`: `readSavedIds(calebsLibraryBookmarks)` + `trendingSubjects` score `searches*10 + saves*5 + sqrt(views)`, fallback paper-count order.
`src/script/convex.ts`: shared ConvexClient(VITE_CONVEX_URL) + typed api + CommentItem.

Convex (`convex/`): schema catalogue(by_drive_id)/comments(by_paper)/metrics(by_paper_id)/shortLinks(by_code+by_paper_id)/searchTrends(by_term). catalogue.get = full `collect()`; replaceAll = delete-all+insert; syncFromDrive = walk + replaceAll. comments.list approved oldest-first; post inserts **approved** (header says pending — LIE, instant-show); queueList verified:false+[] on bad pass; moderate patch+reviewed_at. driveSync: ROOT `1B1LU...`, DRIVE_API v3, MATERIAL_MIME pdf|officedoc|image|plain|msword, driveList pageSize 1000 retry 3x 15s timeout, pMap colleges2/levels3/folders6/semesters4, detectType via filename+folder, buildPaper hash fakes `upvotes 40+hash%900 / downloads 200+... / views 600+... / cover hash%16 / preview drive.../preview / download DRIVE...?alt=media&key=APIKEY (LEAK)`, walk Notes/Past Questions vs dept/course folders, publishLevel Level->Semester->Section, dedupe by id, Zod validate. metrics.getAll full collect; bump max(0,old+delta) or insert zeroed. trends.getTop decay `count*0.5^((now-upd)/30d)` slice limit; record upsert; pruneStale deletes zero-score (NEVER fires — decay never hits 0 — BUG). shortLink FNV-1a->base62 7-char idempotent + 8x reseed; bumpClicks. crons 10min sync + daily 04:00 prune. convex.config env GOOGLE_DRIVE_API_KEY + ADMIN_PASSPHRASE (npx convex env set, never .env).

Assets: main.css (fonts import + tailwind + tokens), tokens.css full system (paper #f5f2ea..., ink #171412..., fonts EB Garamond/Inter/JetBrains Mono, max-content 1240, top-h 56/banner-h 32, motion 140/260/480ms), icon.png, 2 svgs. Deps unused: `googleapis` (fetch used instead), `gsap` (zero imports). Design handoff `design_handoff_calebs_library/` is reference only (README 623 lines, prototype + data.jsx/icons.jsx/shared.jsx/screens).

## 2. Why Convex blocked him (must not repeat)

1. `convex/catalogue.ts:32-43` + `convex/crons.ts:13-17`: wipe+reinsert ALL every 10min (144x/day). 2k docs = ~288k writes/day for static data.
2. `convex/catalogue.ts:22-28` + `src/stores/drive.ts:400-403`: every client `collect()` full table + `metrics.getAll` + `trends.getTop` every 30s. 100 users = huge bandwidth.
3. `convex/driveSync.ts:135`: `downloadUrl` embeds `?key=APIKEY` per row — quota burn + leak.

PQs don't kill DB. This pattern does, with or without PQs.

## 3. Schema v2 (required for level/program + cost fix)

Add to `catalogueItemSchema` + Convex table + indexes:
- `college: string` (e.g. "Engineering"), `program: string` (dept code e.g. "CSC"), `level: string` (e.g. "200" + derived `levelYear: "1"|"2"|"3"|"4"` = first char), `semester: string`, `deptSection: string`
- Persist in `buildPaper` from `Path` (currently DROPPED — root cause of no level filter).
- Indexes: `by_level_program_type` [levelYear, program, type], `by_course_type_year` [course, type, year], keep `by_drive_id` [id]. NEVER `collect()` all again.
- New queries: `listByLevelProgram({levelYear, program, type, paginationOpts})`, `getByIds({ids})`, `searchPaginated` OR keep client search over cached scope (mobile: server paginate + local filter visible page).
- `metrics`: add `getByIds({ids})`, keep `bump` + device dedupe (see §5). Drop `getAll` from mobile.
- `comments`: keep list/post/queueList/moderate, but fix doc: post-approved (post-moderation). Paginate queueList (currently full collect).
- `shortLinks`, `searchTrends`: keep, fix `pruneStale` (delete score<0.01 or updated>180d).
- Sync: `syncFromDrive` -> `syncDiffFromDrive`: walk, diff by `by_drive_id` (insert new / patch changed fields incl. level path / delete missing), cron 10min -> **12h** (or manual + webhook). Validate via Zod.

## 4. KEEP / REWRITE / DROP for mobile

KEEP (extract to `shared/` pure TS, zero Vue/RN imports):
- CODE_SUBJECTS, LEVEL_DESC, parseCourseName, slugify, typeFromName/detectType rules, extFromName, formatBytes, estimatePages (replace fake pages with real where possible), PAPER_TYPES, COVERS palette values, formatCount, timeAgo, trending score formula, citation templates (APA/MLA/Chicago/BibTeX in PaperView:112-122), short-code FNV-1a, decay formula, phrase pools (optional delight), ROOT walk + MATERIAL_MIME + concurrency pattern.

REWRITE (Expo equivalents):
- All 11 screens -> expo-router: `(tabs)/index|browse|search`, `subject/[id]`, `paper/[id]`, `s/[code]`, `upload`, `profile/[id]`, `admin`, `about` + `+not-found`. Shell: banner -> onboarding/announcement card, TopStrip -> native header + SearchBar, footer -> settings/about sheet.
- Pinia drive store -> `convex-react: useQuery/usePaginatedQuery` + Zustand + MMKV (`catalogueCache.v2`, bookmarks, votes, theme, onboarding {college,program,levelYear}).
- PDFPreview iframe -> `expo-web-browser` (v1) then `react-native-pdf` + `expo-file-system` cache. Page-nav overlay is FAKE in web (static "Page 1 of N") — implement real paging or drop.
- Votes/bookmarks/theme/banner localStorage keys -> MMKV same keys for migration clarity; passphrase -> `expo-secure-store` (never MMKV).
- Search autocomplete -> FlashList suggestions, debounce 150ms, minLength 2, max 6, record on commit only.
- Share -> `expo-sharing` + `expo-linking` deep `calebs://s/:code` + web `.../s/:code`.
- Upload (paused) -> NEW: `expo-document-picker` + Convex storage + metadata form (title/subject/course/teacher/type/license) + moderation status pending -> admin queue extension.
- Analytics: Vercel/GA -> `expo-analytics` / PostHog (decide in UI planning).

DROP:
- `googleapis`, `gsap`, Tailwind classes (port token VALUES to Restyle/Unistyles), Vercel Analytics component, Supabase remnants, hardcoded shelves mock, `reads*187`, `sum(views)/12`, hash fakes as source of truth (keep only as placeholder until real metrics accumulate), dead Report button (implement report -> creates pending comment flag OR drop), disabled AI button (keep slot for future RAG practice, do not ship disabled).

## 5. Gaps / bugs found in audit (fix in rebuild)

- Subject course-row onClick loops to same subject (SubjectView:103) — must filter browse by course.
- `teacher` always '' — hide field or populate from upload form; don't show '—' forever.
- Language/License hardcoded — move to schema field `license` default CC BY-NC 4.0.
- `queueList` full collect + `trends.getTop` full collect + `metrics.getAll` full collect — all need pagination/index.
- Comments post-approved vs doc pending — decide post-moderation, add rate-limit (e.g. 1/10s/device) + max 5000 chars (already) + spam filter.
- Vote fraud — add deviceId hash table `votes(paper_id, device_hash)` or at minimum MMKV + server throttle.
- `pruneStale` dead — fix threshold.
- `downloadUrl` key leak — generate signed short-lived URL in action at request time; store only `fileId`.
- `previewUrl` `drive.google.com/file/d/.../preview` won't embed in RN WebView reliably — prefer `https://drive.google.com/viewerng/viewer?embedded=true&url=` or FileSystem download + native renderer.
- `window.open`, `navigator.clipboard`, `document.pointerdown`, `IntersectionObserver`, `html.dark` have no RN equivalent — mapped above.
- Fonts: EB Garamond (masthead/About/404 only) + Inter + JetBrains Mono — use `expo-font`, keep serif for brand moments only.
- Icon set: port 40 entries (`Icon.vue:13-54`: 39 stroke + `google` dropped, no login in v1) to `react-native-svg`.
- PQs vs Notes: `detectType` + folder `Notes` vs `Past Questions` is the splitter. Keep both types in one table with `type` filter (decision: include PQs, §0). Optional perf: sync Notes 12h, PQs 24h separate cron if Drive large — confirm counts first.
- Onboarding personalization (NEW, user requirement): first-launch pick College->Program->LevelYear, gate home query `listByLevelProgram`. Allow "All levels" escape. Store locally + optional Convex `profiles` table later. No auth in v1.

## 6. Mobile data flow v2 (target)

Drive (truth) --12h diff sync--> Convex (metadata only, indexed) --paginated useQuery--> Expo (MMKV cache + FileSystem PDFs) --> Views. Metrics/comments/trends/shortLinks direct mutations, debounced/batched. Uploads: picker -> Convex storage -> `submissions` pending -> admin approve -> catalogue insert (extends current comments-only moderation).

Prefetch: top-5 recent for my level on wifi. Cache cap 300MB LRU. Offline: read cached metadata + downloaded PDFs; queue bumps/comments/searches for sync.

## 7. PQ strategy (locked)

Ship real PQs (not LLM-faked). LLM only for future "AI Practice" (RAG over note text, cached per noteId, labeled AI-generated, never presented as official). PQ tab deep-links to same detail screen with `type=Past Exam` filter. If Drive PQ count >5k, split cron (Notes 12h / PQs 24h) — measure first.

## 8. UI planning next (do not build yet)

Decide: tab bar (Home/Browse/Search/Saved/Profile?) vs web header; filter sheet vs filter bar; shelf visual vs compact grid (perf: FlashList, windowSize 5); citation sheet; discussion sheet; admin gate; onboarding flow; empty/error/skeleton states per screen (port web skeletons); deep-link prefixes; theme tokens mapping (light + dark).
