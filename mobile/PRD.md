# PRD — Caleb's Library Mobile (Expo + Convex) — v1.0 Product, Not Demo

> Owner: user. Status: planning. `REBUILD.md` is the engineering audit; this PRD is the product contract for 100% completion. No build until user approves. Mobile: Expo + expo-router + own Convex deployment. Web `src/` frozen.

## 1. Product summary + goals

Caleb's Library mobile is a free, no-account library for Bel University students: browse/search/download Notes + Past Questions (PQs), save offline, discuss, upvote, contribute via moderation. Personalized by College → Program → LevelYear (100–400).

Goals: (1) open in <2s to usable list on mid Android; (2) offline-first reading for saved + recent-in-my-level; (3) zero Convex ban (diff sync 12h, paginated indexed reads, no `collect()` all); (4) full parity with web minus web-only chrome; (5) App Store + Play shippable (privacy, crash-free, a11y).

Success metrics: TTI p75 <2s cached / <4s cold; crash-free sessions >99.5%; offline open of saved PDF 100%; search commit→results <500ms local page; sync writes/day <5k (vs ~288k web legacy); rating ≥4.5; NPS qualitative.

## 2. Users + personas

- P1 Reader (70%): Level 200 CSC, wants "my courses this semester" + PQs before exams. Offline in hostel, low storage.
- P2 Contributor (20%): uploads notes at semester end, provides name only, expects 24–48h review.
- P3 Moderator (5%): rotating passphrase, triages comments + submissions from phone.
- P4 Lurker/new admit: no program yet, browses All.

No accounts in v1. Identity = device + optional display name per comment/upload. No PII beyond name (email optional on upload, private, moderation contact only — mirrors About page promise).

## 3. Scope v1 (must ship 100%) / v2 / out

V1 IN: onboarding (college/program/level + skip), Home (personalized), Browse, Search + facets, Subject, Course-filtered list (fixes web bug), Paper detail (preview/download/cite/discuss/vote/save/share/report), Saved library + downloads manager, Upload (new pipeline), Profile, Admin moderation (comments + submissions), About/Legal, Short-link ingress, Settings (theme/downloads/storage/analytics opt-out), push-free, offline queue, empty/loading/error states everywhere, dark mode, deep links.

V2 (explicitly not v1): accounts/login, AI Study Assistant (keep hidden slot, do NOT ship disabled button like web PaperView:297), AI Practice quiz (RAG, cached per note), push notifications, annotations/highlights, LMS integration.

Out: web transform (no Vue reuse), TinyURL (use in-house shortLinks), Supabase (removed), googleapis dep (use fetch), gsap (use Reanimated).

## 4. IA + routes (expo-router)

```
mobile/app/
  _layout.tsx (providers: Convex, theme, font, query cache, toast, error boundary)
  onboarding/ (college -> program -> levelYear -> confirm; skip = All)
  (tabs)/ index (Home) | browse | search | saved
  subject/[id].tsx, course/[id].tsx (NEW — web loops to subject, must be separate)
  paper/[id].tsx (tabs: Preview | Cite | Discussion)
  s/[code].tsx (short-link resolver + missing state)
  profile/[id].tsx (Papers | About; NO mock shelves in v1 — either real bookmarks-derived shelves or hide tab)
  upload.tsx (4-step wizard, see §9)
  admin.tsx (gate + queue, see §10)
  about.tsx, settings.tsx, downloads.tsx (storage manager)
  +not-found.tsx (fallen stack motif, no hardcoded papers[3/7/11] crash when <3 docs)
```
Deep links: `calebs://paper/:id`, `calebs://s/:code`, `https://<web>/s/:code`, `https://<web>/paper/:id`. Short-link create idempotent per paper (FNV-1a base62 7-char, 8x reseed — port `convex/shortLink.ts:19-32`).

Nav: bottom tabs 4 (Home/Browse/Search/Saved). Header: brand serif on Home, SearchBar elsewhere (port TopStrip mini-search behavior: hidden on Home, debounce, suggestions max 6). No footer links; move Legal/Moderation/Contact to Settings/About sheets.

## 5. Functional specs (acceptance criteria = 100% bar)

### 5.1 Onboarding (NEW, no web equivalent)
- Steps: College list (derived from Drive colleges) → Program (CODE_SUBJECTS filtered by college) → LevelYear (100/200/300/400/500 + All) → confirm. Skip anytime → scope=All.
- Persist MMKV `onboarding.v1 {college, program, levelYear, at}`. Editable in Settings. Home/Browse default scope = onboarding; user can toggle All per session (does not overwrite saved unless "make default").
- AC: cold start → onboarding if unset; relaunch preserves; change in Settings re-queries lists <1s; analytics event onboarding_complete with scope (no PII).

### 5.2 Home (port `src/views/HomeView.vue`)
- Masthead phrase rotation: port DAY(11)/NIGHT(12)/SEASON(exam/test/term windows)/WEEKDAY pools + `phraseFor` + 6am/6pm boundary refresh. EB Garamond italic, clamp via RN scaling. Keep delight, must not block content.
- SearchBar: MMKV-persisted query, suggestions papers/subjects/courses max 6 minLength 2, commit → `trends.record` once per commit (not keystroke) + navigate search?q=. Debounce input 150ms.
- Quick browse: `trendingSubjects` formula `searches*10+saves*5+sqrt(views)` over scoped subjects top-8 + "All N subjects →". Fallback paper-count order when no signal (port `src/script/trends.ts:25-61`).
- Stats strip: Papers (scoped count), Contributors (distinct), Reads/month (REAL sum reads/30d from metrics, NOT `sum(views)/12` fake), Subjects count. Each stat has loading shimmer (port SkeletonCard).
- Recently added: scoped sort createdAt desc 10 horizontal FlashList (web 5-grid → horizontal cards on mobile). Pull-to-refresh. Empty: "No papers yet" + error text from `drive.error` equivalent.
- AC: scoped lists only; shimmer→content; offline shows cached + "offline" badge; tap → paper.

### 5.3 Browse (port `src/views/BrowseView.vue`)
- Group by subject (scoped), each shelf horizontal FlashList max 24 (port MAX_BOOKS_PER_SHELF) + "Open department →".
- Filter sheet (not web filter-bar): subject multi? single-select + All, course dropdown scoped to subject, type pills PAPER_TYPES 8 (default All, quick chips Notes/Past Exam), year picker (wheel, not dual-thumb), sort dept/course/year-new/year-old/reads/upvotes.
- Perf: FlashList `windowSize=5`, `initialNumToRender=8`, shelf virtualization, image/covers are Views (no images). No full-table collect; `usePaginatedQuery` 20/page per shelf header count only.
- AC: 2k-row scope scrolls 60fps mid Android; filters combine correctly; empty shelf hidden (web shows empty header — fix: hide); "empty shelves" empty-state with Reset.

### 5.4 Search (port `src/views/SearchView.vue`)
- Query header SearchBar + result count `N results for "q"`. Facets bottom-sheet: Subject checkboxes (show counts, max 12 + See all), Type 6 + All, Year range single min/max steppers (replace dual-thumb sliders — poor mobile UX), Sort tabs relevance/newest/votes/downloads.
- Relevance = current web `search()` substring rank (title^3 + course^2 + subject + contributor) — document ranking; do NOT claim FTS. Highlight matches with inverted pill (port `segments()` + `mark` style).
- Pagination: 20/page infinite scroll (web 10/page numbered → infinite on mobile), `visiblePages` logic dropped.
- AC: commit records trend once; back preserves query+filters+scroll; no-result state with Clear; offline searches cached scope only with badge.

### 5.5 Subject + Course (port `src/views/SubjectView.vue`, fix bug)
- Subject hero: breadcrumb Library/All subjects/Name, stats Papers/Contributors/Courses. Essentials first-4. Every course rows → MUST navigate `course/[id]` (web bug pushes same subject route — fix). All papers paginated 20 infinite (web unpaginated 6-grid — fix). Top contributors horizontal top-8.
- Course screen (new): hero course displayName (`parseCourseName` + LEVEL_DESC e.g. "CSC 200 — Foundation Level"), type tabs Notes/PQs, year filter, sort, infinite list.
- AC: missing id → not-found card + Browse CTA (no crash); counts match queries.

### 5.6 Paper detail (port `src/views/PaperView.vue:1-235` — highest risk)
- Header: BookCover lg (port sizes xs60/sm120/md132/lg168/xl224 + COVERS 16 + spine/grain via Views, no hover lift; press scale 0.97), tags subject/type/year, title/subtitle, contributor row → profile, meta pages/ext/views/timeAgo.
- Actions: Download PDF (primary) → if cached open native viewer else download with progress → `metrics.bump(downloads)` once per completed open (not tap); OS share sheet for file; Save toggle (MMKV bookmarks, heart state); Share → `shortLink.create` idempotent → system Share (`.../s/code`, fallback full URL on fail); Vote up/down toggle 1/0/-1 with MMKV `calebsLibraryVotes` + server `bump` deltas (-1 old, +1 new) + 5s throttle per paper per device; Report → NEW bottom-sheet (reason: wrong file/copyright/spam/other + details) → creates `reports` pending (see §10), NOT dead button; NO disabled AI button in v1 (reserve slot in code only).
- Tabs: Preview | Citation | Discussion(count). Preview: native PDF (downloaded bytes) with real page count/pager (web fake "Page 1 of N" static — fix or remove pager); fallback Drive viewerng URL in WebView when not downloaded + "Download for full" hint; mock page only when no file. Citation: APA/MLA/Chicago/BibTeX cards (port templates PaperView:112-122, URL `calebslibrary.org/paper/id`) + Copy buttons + toast. Discussion: composer (name optional → Anonymous, body 1–5000) + rate-limit 1/10s + list oldest-first live `useQuery(list)` + timeAgo + empty "Be first" + post → optimistic + `loadComments` refresh; abuse: max length, trim, block empty.
- Details card: Course, Teacher (hide row if '' — don't show '—' forever), Size, Uploaded, License (schema field default CC BY-NC 4.0, not hardcoded), Language (hide unless non-English), File type, Drive updated.
- Related: same course first, then same subject, exclude self, 8 horizontal (web same-subject 4 — improve, still cheap).
- AC: reads bumped once per view (debounced, offline queued); all actions work offline except share-link create (queued) and preview needs bytes or viewer; missing paper → missing card.

### 5.7 Saved + Downloads manager (NEW surface for web bookmarks)
- Saved = MMKV `calebsLibraryBookmarks` list, grouped by type, sort recent/saved order, swipe unsave, bulk clear. Each row shows cached status (downloaded/size) + Download/Delete toggle.
- Downloads screen (Settings entry too): storage used / 300MB cap bar, per-file size, LRU auto-evict oldest-unopened beyond cap (never evict explicitly pinned), prefetch toggle (wifi-only top-5 recent-in-my-level), clear cache.
- AC: airplane mode opens any downloaded paper fully; cap enforced; pin respected.

### 5.8 Profile (port `src/views/ProfileView.vue`, remove mocks)
- Hero 96px Avatar initials, Founder badge, handle, stats Contributions + Reads (REAL reads sum for author's papers, NOT `uploads*187`).
- Tabs Papers | About. Papers grid authored list. About: bio + "Contributor since {year from earliest createdAt}" (not hardcoded 2023) + scope note. Shelves tab HIDDEN in v1 unless real data (bookmarks-derived collections) lands — do NOT ship `Beowulf` mock.
- AC: unknown id → fallback Community card (port FALLBACK_CONTRIBUTOR) + Browse CTA.

### 5.9 Upload — NEW pipeline (web `UploadView.vue` is paused placeholder)
- 4 steps: 1 Pick file (`expo-document-picker`: pdf/docx/pptx/images, ≤50MB, MIME allowlist mirrors MATERIAL_MIME) → 2 Details (title prefilled from filename sans ext, subject auto from course code via CODE_SUBJECTS, course picker (parseCourseName validated `XXX 000`), teacher optional, type picker default Notes, year default current, license picker default CC BY-NC 4.0) → 3 Review (size/pages estimate via `estimatePages`, cover auto hash preview) → 4 Submitted (submission id, "review 24–48h", track status).
- Backend: Convex storage upload → `submissions` table {fileId, fields, status pending, deviceHash, createdAt} → admin approve → insert catalogue (with college/program/level/semester from picker + Drive path if staff uploads to Drive; client uploads stay in Convex storage with `storageId`, NOT Drive). contribuName = entered name or Anonymous; email optional private (never displayed).
- Validation: Zod same as catalogue + file size/type; duplicate detection by name+course+size hash warn.
- AC: offline draft saved, resume; upload progress + retry; rejected shows reviewer note; approved appears in lists <12h sync or immediately if Convex-storage path.

### 5.10 Admin (port `src/views/AdminView.vue` + extend to submissions)
- Gate: passphrase (SecureStore `calebs_pass`, unlocked flag MMKV `calebs_admin`), `queueList` returns verified:false+[] on fail (indistinguishable), rotating passphrase note, sign-out clears both. Throttle 5 tries/60s.
- Queue tabs: Comments Pending/Approved/Rejected + Submissions Pending/Approved/Rejected (new). Rail list + review panel (body, author, paper context title/subject/type, created timeAgo, file preview for submissions) + note field + Approve/Reject. Counts per tab. Refresh + optimistic patch.
- AC: wrong pass shows "That's not the passphrase" (no oracle); paginated 20 (web full collect — fix); actions require passphrase each call server-checked (`isAdmin`).

### 5.11 About/Legal/Settings/NotFound/ShortLink
- About: port hero serif, RULE 01-03 verbatim, Who runs/Want to help copy (update "three thousand" if count differs — compute or remove number), moderators top-8 founder-first → profile, CTAs Contribute/Browse.
- Legal (in About/Settings): Privacy (no accounts, name/email use, analytics opt-out), Terms, Content policy (CC BY-NC 4.0 default, takedown), Contact. All static, versioned `legal.v1`.
- Settings: profile scope editor, theme Light/Dark/System (port `calebs_theme` + `html.dark` tokens → RN Appearance + MMKV), downloads (cap, wifi-only, clear), storage usage, analytics opt-out, legal, app version + Convex deployment id (support).
- NotFound: fallen-stack motif, dynamic first-3 available (no index crash), CTAs Home/Browse.
- ShortLink `/s/:code`: resolve `getByCode` + `bumpClicks` fire-and-forget → open paper screen (not browser redirect); missing → missing card.

## 6. Backend contract (own Convex, v2)

Tables: `catalogue` (+ college, program, level, levelYear, semester, deptSection, license, storageId?, fileId), `submissions`, `comments`, `reports`, `metrics`, `votes` (deviceHash dedupe NEW), `shortLinks`, `searchTrends`, `profiles` (optional v1: deviceHash → scope).

Indexes: catalogue `by_drive_id[id]`, `by_level_program_type[levelYear,program,type]`, `by_course_type_year[course,type,year]`, `by_created[createdAt]`; comments `by_paper[paper_id]`; metrics `by_paper_id[paper_id]`; votes `by_paper_device[paper_id,deviceHash]`; shortLinks `by_code`, `by_paper_id`; trends `by_term`; submissions `by_status[status]`.

Functions: `catalogue.listByLevelProgram/getByIds/getPaper/searchPage` (paginated, no collect-all; projections EXCLUDE dead `parents` array; keep legacy `get` for web compat but mobile never calls it), `syncDiffFromDrive` internalAction (walk → diff insert/patch/delete, Zod validate) cron **12h** (PQs optionally 24h second cron if >5k docs — measure Drive counts first); `metrics.getByIds/bump` (delta CLAMPED ±1, throttle 5s/device/kind, max(0)); `votes.toggle` (server truth, MMKV mirror); `comments.list/post/queueList(paginated)/moderate` (post-approved documented as post-moderation + 1/10s rate-limit); `submissions.create/list/decide`; `reports.create/list/decide`; `shortLink.getByCode/create/bumpClicks` (create VALIDATES host allowlist + rate-limits; no arbitrary-URL minting); `trends.getTop(limit≤50)/record(prune threshold score<0.01 or age>180d — fix dead prune)` + record throttled per device; `files.signedUrl(fileId)` short-lived (replaces stored `?key=` leak — store only fileId/storageId).

Env (`convex.config.ts` + `npx convex env set`): GOOGLE_DRIVE_API_KEY, ADMIN_PASSPHRASE, plus ALLOWLIST_COLLEGES? Quotas: alert writes >10k/day, bandwidth p95. Secrets never in `EXPO_PUBLIC_*`; only `EXPO_PUBLIC_CONVEX_URL`.

## 7. Offline, storage, perf budgets

- Metadata: MMKV `catalogueCache.v2` last-good scope pages + subjects/courses; TTL 24h; background revalidate on foreground + pull-to-refresh; stale-while-revalidate.
- Files: `expo-file-system` cache dir `papers/<id>.pdf`, registry MMKV `downloads.v1 {id: {size, at, openedAt, pinned}}`, cap 300MB LRU (evict min openedAt unpinned first), wifi-only prefetch top-5 recent-in-scope.
- Mutations offline: queue MMKV `outbox.v1` (bumps/votes/comments/searches/reports) flush on reconnect, idempotency keys.
- Perf: TTI cached <2s, cold <4s; FlashList 60fps 2k rows; PDF open cached <1s; APK/IPA size <60MB; RAM <250MB list scroll. Skeletons mirror web shimmer (port SkeletonCard grid 6→2 cols responsive → 2-col mobile grid).

## 8. Design system (port, not copy)

Tokens from `src/assets/tokens.css:7-99`: paper #f5f2ea/…/ink #171412 scale, rule/strong, shadow-book/focus/lifted, EB Garamond (brand/masthead/About/404 only) + Inter + JetBrains Mono via `expo-font`, type 11–128, spacing 4–128, radii 2–16+999 pills, motion 140/260/480ms ease-out, max-content 1240 → mobile gutters 20/16. Dark `html.dark:104-143` → RN theme object (paper #131210 etc., strip rgba, mark invert, selection). Components: btn-primary/secondary/ghost, card, input, tag/tag-paper, avatar ink circle, book-cover spine(8px gradient)+grain(3px radial)+2:3 (no hover lift; press 0.97), mono-meta 11px, smallcaps 10.5px 0.16em 600, ornament rule-dot, screen fade-up 260ms. Icons: port 40 `Icon.vue:13-54` entries (39 stroke + `google` dropped, no login v1) to react-native-svg. Covers COVERS 16 verbatim. No Tailwind in mobile; Unistyles/Restyle with token object.

A11y: min touch 44pt, labels on ALL icon buttons (web has only 4 aria-labels total — vote/save/share/filter/sort/sheets were unlabeled; mobile closes this), dynamic type support, contrast AA (ink on paper passes; verify dark), screen-reader names for covers ("{title}, {subject}, {year}"). Never port web's global `*` CSS transition or full-remount-on-nav patterns.

## 9. Analytics, privacy, security

Analytics (opt-out, no PII, single Expo pipeline — web double-counted Vercel+GA, do NOT repeat): app_open, onboarding_complete{scope}, search_commit{len,results}, paper_open{id,type}, download_complete{id,size}, vote{kind}, save_toggle, comment_post, upload_submit/decide, share_create, offline_open, cache_evict. Crash: Sentry. Privacy: display names only — contributor email NEVER rendered (anonymized handle + consent at upload; web exposed raw owner email publicly), email private, SecureStore passphrase, no Drive key in client, signed URLs, rate-limits, 50MB upload cap, MIME allowlist, report/takedown path, legal.v1. Repo hygiene: gitignore covers `.playwright-mcp/`, `mobile/.expo`, `*.jks`, `GoogleService-*`; pin Java/Gradle/Xcode/EAS versions next to node engines.

## 10. QA to 100% (release gate)

Matrix: Android 10–15 (low 3GB + flagship), iOS 16–18, light/dark, online/offline/airplane, fresh/upgrade, small/large fonts, EN only v1. Cases: onboarding skip/edit; scoped vs All; search facets/sort/pagination/highlight; course bug fixed; paper actions incl. offline; citation copy; discussion post/rate-limit; vote toggle deltas; save/pin/evict; upload wizard + duplicate + offline draft + approve/reject flows; admin gate throttle + queues paginated; short-link valid/invalid; deep links cold/warm; 404; storage cap; rotation; kill/restart mid-download/upload; Convex 12h diff (insert/patch/delete) verified; quota dashboard. Bar: 0 crash P0/P1, all AC pass, perf budgets met, legal + privacy approved, store listings + screenshots + доброволь.

## 11. Milestones + open questions

M1 schema v2 + diff sync on staging Convex + seed counts (measure Notes vs PQ counts to lock 12h vs split cron). M2 shared/ extract + tokens/theme/icons/covers. M3 onboarding+Home+Browse+Search. M4 Paper+Saved/Downloads. M5 Upload+Admin+Profile+About/Settings. M6 offline/polish/a11y/QA/release.

Open: Drive Notes vs PQ counts? College list canonical? `teacher` source (upload form only)? License per-file override? Moderator passphrase rotation process? Web short-link domain reuse for mobile links? Analytics vendor — DECIDED: Expo analytics.

## 12. Gap resolutions (app-wide sweep, locked)

- **File-type viewer matrix:** pdf → native renderer (downloaded bytes); images (jpg/png/webp) → native image viewer w/ zoom; docx/pptx → online Drive viewerng WebView, offline → "Download + Open in…" via OS share sheet (no native parse in v1). Password-protected/corrupt → error card (wrong-password retry where supported, else report). >50MB → warn before download + wifi-only default. txt → monospace reader. Unknown ext → download-only row.
- **Background/kill-safe downloads:** `FileSystem.DownloadResumable` + registry `downloads.v1 {id:{size,at,openedAt,pinned,etag}}`; on relaunch resume incomplete (Range) or restart; progress pill survives via registry state; cancel deletes partial.
- **Storage-full / low-RAM:** pre-flight free-space check; on ENOSPC show "Storage full — free X or unpin" + one-tap auto-evict (LRU unpinned first); low-RAM (<3GB) disables grain/parallax/prefetch automatically.
- **First-launch offline:** bundle `colleges.json` + `programs.json` (from CODE_SUBJECTS) so onboarding works with zero network; lists show cached scope + offline badge until sync.
- **Upgrade migration:** `migrateV1toV2()` maps ALL 7 web keys — MMKV: `calebsLibraryBookmarks`, `calebsLibraryVotes`, `calebs_theme`, `calebs_banner_dismissed`, `calebsLibraryCatalogueCache`→`catalogueCache.v2` (revalidated, not blind-trusted); SecureStore: `calebs_pass`; MMKV flag: `calebs_admin`. Idempotent, version-stamped.
- **Layouts:** phone portrait-first; landscape → 2-col grids widen; tablet (≥720dp) → 3-col + two-pane subject/paper where width allows; foldables follow width buckets. No separate tablet app.
- **File associations:** register `calebs://` + `https://<web>/s|paper` links; "Open in Caleb's" for pdf via OS share (inbound share sheet v2 — v1 supports opening inbound pdf link, not full share-target).
- **Store/ops:** OTA (EAS Update) for JS/theme/copy only; native deps/permissions/config → store review. Play Data Safety: no account, name-only, analytics opt-out declared. Apple: no tracking (ATT not required, declare none), content rating 4+, privacy manifest lists document-picker + network + storage reasons. Permissions copy strings versioned in `legal.v1`.
- **Support diagnostics:** Settings → Support shows app version, Convex deployment id, device OS, storage used, scope — one-tap copy for bug reports. Crash: Sentry (DSN via EAS secret).
- **Trust/moderation:** `decisions` audit log {targetType,targetId,action,note,deviceHash,at} on every approve/reject; passphrase rotation = new `ADMIN_PASSPHRASE` + in-app "rotated, ask a moderator" notice, old sessions signed out; duplicates = exact (name+course+bytes) blocked, near (title≥0.9) warned; rejected uploads get reviewer note + one-tap resubmit appeal; reports create `reports` pending and auto-flag paper after ≥3 distinct devices (hidden pending review, appealable).
