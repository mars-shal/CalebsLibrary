# UI.md — Caleb's Library Mobile UI/UX Contract (Expo)

> Use this file for EVERY UI/UX decision while building `mobile/`. It sits alongside `PRD.md` (product contract) and `REBUILD.md` (engineering audit). If PRD says WHAT and REBUILD says WHY/HOW-backend, this file says HOW-it-looks-feels-moves. No build decision may contradict it without updating it first. User's Convex is used for all data; UI here never invents backend.

## 0. Reasoning — user direction vs PRD vs REBUILD vs codebase → approach

User direction: keep website color + typography exactly; own minimal visuals-first styling; custom animated SVGs/icons for fluid vibe; Apple-like layout/motion, premium, HCI best practice; liquid glass via `npx expo install expo-glass-effect` with fallback for Android + pre-iOS-26; Apple-feel with Android parity; minimal yet jaw-dropping functional + non-functional decor, future-OS personality. Link with visual reference comes later.

Comparison:
- PRD §4–§5 demands full parity (11 routes → tabbed mobile IA), offline-first, 60fps lists, paginated queries. It assumes native patterns (sheets, infinite scroll, FlashList) — compatible with Apple-like direction, but PRD alone would accept a plain port. This file raises the bar to premium minimal without breaking PRD acceptance criteria.
- REBUILD §§1/4–5 proves a 1:1 transform is impossible: `.vue` scoped styles, hover lifts (`BookCover.vue`, `PaperCard.vue`), `iframe` preview (`PDFPreview.vue`), `IntersectionObserver` shelves (`BrowseView.vue:102-124`), dual-thumb year sliders (`SearchView.vue:224-240`), `html.dark`, `window.open`/`clipboard` have no RN equivalent. Conclusion from REBUILD holds: EXTRACT, don't transform.
- Codebase gives us what to extract: `src/assets/tokens.css:7-99` values, `src/components/Icon.vue:13-54` 40 entries @1.75px (already SF-like), `src/script/design.ts:78-95` COVERS 16, `PAPER_TYPES` 8, masthead phrase pools (`HomeView.vue:52-120`), skeleton shimmer pattern, smallcaps/mono-meta/tag/avatar/ornament primitives. Do NOT port `main.css:5-10` global `*` transition or `App.vue:21` full-remount-on-nav.

Conclusion (locked approach):
1. Extract token VALUES + icon PATHS + cover palette + copy into a new native foundation (`mobile/theme/`, `mobile/icons/`, `mobile/motion/`). Never copy CSS/DOM.
2. Rebuild every screen native-first (expo-router, FlashList, Reanimated, sheets) in the user's minimal visuals-first language.
3. Glass is scoped chrome-only via a single `SafeGlass` wrapper (guarded, §5). Fallback is a first-class design, not an afterthought.
4. Decor is inventoried per screen as Functional (earns its pixels) vs Non-functional (personality, gated by motion/accessibility) — §6. Minimal means max 1 hero visual + 1 ambient detail per screen.

## 1. Non-negotiable visual constraints (fidelity rule: the app must read as the SAME brand as the website)

- A side-by-side screenshot test must pass: same paper/ink, same serif brand voice, same cover palette, same copy. A user coming from the website must feel at home instantly. Own direction lives in LAYOUT + MOTION + CHROME (sheets, glass, springs, cover-first composition) — never in color, type families, or brand marks.
- MUST MATCH EXACT: all hexes below, font families + roles, COVERS 16 values, smallcaps/mono-meta/tag/avatar/ornament language, RULE 01–03 + banner + empty-state copy, icon stroke DNA (1.75px round).
- MAY EVOLVE (native translation only): radii (2/3/5/10/16 → 8/14/20/999), shadows → native equivalents, 1240px grid → 20/16 gutters, hover lift → press 0.97 + haptic, filter-bar → bottom sheet, numbered pagination → infinite scroll, 80–120px masthead → ≤44px serif moment. Any other visual deviation needs user sign-off + UI.md update first.

- Color: same hues as the website, SOFTENED per user (light steps to off-white `#f7f4ec`, charcoal eases to `#23201c`). Light: paper `#f7f4ec`, paper-2 `#f0ece1`, paper-3 `#e7e1d3`, paper-4 `#d6cfbd`; ink-100 `#23201c` … ink-30 `#978e80`; rule `rgba(35,32,28,0.08)`, rule-strong `0.14`; elevated `#faf8f1`, pdf `#fdfaf3`; error `#bb4436`; overlay `rgba(35,32,28,0.9)`. Dark (marginally lifted): paper `#151311`, paper-2 `#1d1a17`, paper-3 `#252320`; ink-100 `#ece7e0` … ink-30 `#5c5852`; rule `rgba(236,231,224,0.10/0.18)`; elevated `#1a1816`; error `#e74c3c`. Tint glass from these (no new hues).
- Typography: SAME families. Serif `EB Garamond` — brand/masthead/About/404 ONLY (never body). Sans `Inter` — all UI. Mono `JetBrains Mono` — meta/counts/pagers only. Load via `expo-font`; fallback Georgia/system/menlo. Mobile scale (web 11–128 → app): eyebrow smallcaps 10.5/0.16em/600, body 14–15, title 20–28, hero 34–44 (never 80–120 web masthead), stat value 28–32, mono-meta 11. Dynamic Type must not break cards (ellipsize, min 2-line clamp titles like `PaperCard.vue:39-50`).
- Voice: keep web copy (banner "Free. Open. No account needed.", RULE 01–03, empty states). Minimal ≠ new words; minimal = fewer words shown (progressive disclosure, §7).

## 2. Principles (HCI gates — every concept must pass)

1. Visuals first, text on demand: cover/space/icon carries the screen; metadata beyond title+1-line meta hides behind tap/sheet. Max 2 text blocks above the fold on list screens.
2. Apple-lead, Android-true: iOS patterns lead (large title → collapsed glass header, sheets, swipe actions, springs, haptics); Android gets Material equivalents (predictive back, ripple, edge-to-edge nav) with identical IA. Never iOS-only gestures for critical flows.
3. One thumb, 44pt: primary actions reachable bottom 1/3; min touch 44×44; full-row tap targets; no hover-dependent meaning (web hover lift is dead — use press 0.97 + haptic).
4. Contrast before beauty: AA on paper/ink pairs; NEVER body text over glass/blur/photo. Glass hosts chrome/controls only.
5. Motion with meaning + escape: 140ms micro / 260ms screen (`--dur-fast/med` port) via Reanimated springs (`stiffness 320, damping 32, mass 0.9`); sheets spring + backdrop fade; respect `Reduce Motion` + low-power (decor off, crossfade only); every animation cancellable by navigation.
6. States are design: loading shimmer (port `SkeletonCard` 6→2-col → 2-col mobile), empty (Lottie moment + 1 CTA), error (retry + offline note), offline badge — designed per screen, never blank.

## 3. Theme bridge (`mobile/theme/`)

- `tokens.ts`: light + dark objects from §1 (paper/ink/rule/text/elevated/error/overlay). Radii evolve for Apple feel: web 2/3/5/10/16 → app 8 (card) / 14 (sheet) / 20 (hero cover) / 999 (pills). Spacing port 4/8/12/16/24/32; gutters 20 (screen) / 16 (card). Shadows: web `shadow-book` → iOS shadowOpacity 0.18/radius 24 + Android elevation 6; pressed/lifted variants. `max-content 1240` → `MaxWidth phone 480 / tablet 720`.
- Glass tokens (NEW): `glass.tintLight rgba(245,242,234,0.55)`, `glass.tintDark rgba(19,18,16,0.55)`, `glass.borderLight rgba(255,255,255,0.35)`, fallback `fallbackFillLight rgba(245,242,234,0.92)` / Dark `rgba(19,18,16,0.92)` + 1px rule (matches old `.strip` blur language). Fallback is spec'd to look intentional, not broken.
- Type roles: `brandSerif`, `title`, `body`, `meta(mono)`, `eyebrow(smallcaps)`. Serif italic reserved: logo "Caleb's", Home masthead line, About hero, 404 numerals.

## 4. Icon + motion systems (`mobile/icons/`, `mobile/motion/`)

- Base: port all 40 `Icon.vue:13-54` entries (39 stroke 24 viewBox 1.75px round caps + `google` DROPPED — no login v1) to `react-native-svg`. Sizes 16/18/20/24/28; touch pads to 44. Full-set animated per user decision: interaction-triggered only (press/focus ≤250ms), NEVER looping inside lists.
- Animate functional set first (search focus-morph, bookmark fill-pop, download progress-ring drawn ON cover, vote-up bounce, tab select morph, share spring-up, sun/moon rotate, refresh/ornament spin), then extend same Reanimated stroke/fill pattern to remaining 32. Lottie ONLY for onboarding hero, empty shelves, 404 fallen stack, upload success. Reduced-motion: no loop, no parallax.
- Motion table: press `scale 0.97 + 140ms + light haptic`; toggle `spring + medium haptic`; sheet `spring + backdrop 140ms fade`; screen `fade-up 260ms` (port `.screen-wrap`); list `stagger ≤6 items, 40ms each, first viewport only`; glass style change via `glassEffectStyle {animate:true, animationDuration:250}` — NEVER animate `opacity` on/inside `GlassView` (kills render; use wrapper per Expo docs).

## 5. Glass system (`npx expo install expo-glass-effect` + fallback)

Verified API (Expo SDK 56+, iOS 26+; `GlassView` falls back to `View` off-platform; `GlassContainer` groups nearby surfaces; `glassEffectStyle 'clear'|'regular'|'none'` + `tintColor`; crash-guard required for iOS 26 betas).

- Single wrapper `SafeGlass` (only glass call-site): checks `Platform.OS==='ios' && isGlassEffectAPIAvailable() && isLiquidGlassAvailable() && !reduceTransparency` (subscribe to `reduceTransparencyChanged`); renders `GlassView` (style regular + paper tint) or fallback `View` (fallbackFill + rule + blur `expo-blur` intensity 40 on iOS<26 / solid elevated on Android low-tier). Group nearby surfaces in `GlassContainer`.
- Allowed zones ONLY: floating tab bar, collapsing Home/Browse header SearchBar, Paper header action cluster, preview page-nav pill, bottom-sheet handles, player-like download progress pill. BANNED: full-screen backgrounds, behind body text, inside scrolling cards, over PDFs.
- Fallback matrix: iOS 26+ pass → liquid glass; iOS <26 → blur+tint fallback; Android flagship → blur 30 + translucent fill; Android low/Go → solid elevated + shadow (no blur, perf); any reduced-transparency/low-power → solid, no blur/glass. QA must screenshot all five.
- Gotchas (from docs/issues): pre-check `isGlassEffectAPIAvailable()` before `GlassView` (beta crash #40911); don't set `opacity:0` on glass subtree; test Info.plist/Xcode 26 build; Expo Go includes it (easy trial) but production needs EAS + device testing.

## 6. Decor inventory (jaw-dropping, minimal — 1 hero + 1 ambient max/screen)

- Functional (must ship, earns pixels): cover sheen sweep on tilt (Skia, subtle, motion-gated); download progress ring on `BookCover`; scope pill showing "Level 200 · CSC" with tap-to-change; citation copy toast; vote/save morphs; upload cover auto-preview from filename hash (port `cover hash%16`).
- Non-functional (personality, gated): paper grain overlay alpha 0.04 (port `.book-cover::after` 3px radial); ambient Home gradient wash; seasonal masthead variant (port SEASON pools); parallax 404 stack (port -14/-38/24° rotations as gentle gyro); onboarding morphing ornament (port `Ornament` rule-dot). All off under Reduce Motion / low-power / <3GB RAM.
- Banned in v1: shipped-disabled AI button (web `PaperView:297` — keep code slot only), fake "Page 1 of N" pager (implement real or omit), mock shelves (`Beowulf` etc.), fake reads math.

## 7. Per-screen UI deltas vs PRD (layout + visuals-first rules)

- Onboarding: 3 full-bleed visual cards (College → Program → Level) with big cover-mosaic art + single serif line each; skip = text button. Confirm shows scope pill + "Change anytime in Settings".
- Home (tabs/index): collapsed: serif masthead line (≤44) + floating glass SearchBar + scope pill; trending = horizontal cover chips (not text pills); stats = 4 mini numbers w/ shimmer; Recently added = horizontal FlashList covers + title-only. Pull-to-refresh with ornament spinner. Offline badge on glass header.
- Browse: shelf cards with horizontal covers (max 24, port cap), subject header + count + "Open →". Filters live in ONE bottom sheet (segmented subject, course dropdown, type pills default All w/ Notes/PQ quick chips, year stepper, sort list) — replaces web filter-bar + dual sliders.
- Search: glass SearchBar sticky; suggestions max 6 w/ type badges (paper/subject/course); results rows = xs cover + title(2-clamp) + 1 meta line + ▲upvotes; `<mark>` invert highlight; facets in sheet; infinite 20/page; no-result Lottie + Clear.
- Subject/Course: hero art band (4-cover collage) + stats; Essentials 4; Courses → `course/[id]` (fix web loop); All papers infinite; contributors horizontal avatars. Course screen adds Notes/PQs segmented tabs.
- Paper: hero lg cover left + title block (visual-first, meta 1 line); sticky glass action cluster (Download primary w/ progress, Save, Share, Vote) — thumb zone; tabs Preview|Cite|Discussion as segmented control; Preview native PDF + real pager; Cite cards + copy; Discussion composer + live list; Details collapsed to sheet (hide empty Teacher/Language); Related horizontal 8.
- Saved/Downloads: grouped covers w/ cached ring + size; swipe unsave; Downloads manager = storage bar (300MB cap), per-file rows, pin toggle, prefetch switch, Clear.
- Profile: 96 avatar + founder chip + 2 real stats (no `*187`); tabs Papers|About (shelves hidden v1); About shows "since {earliest year}".
- Upload wizard: 4 visual steps with progress dots, file drop art, live cover preview, review card, success Lottie + submission id + "24–48h".
- Admin: gate card (shield art, passphrase, throttle note); queue segmented Comments|Submissions × Pending|Approved|Rejected; rail cards + review sheet (Approve/Reject + note); counts; refresh.
- About/Settings/NotFound/ShortLink: About serif hero + RULE cards + moderator grid + CTAs; Settings grouped list (Scope, Appearance System/Light/Dark, Downloads, Storage, Analytics opt-out, Legal v1, version + Convex id); NotFound dynamic stack + serif 404; ShortLink resolver art + missing card.

## 8. Layout patterns + budgets

Tabs 4 (Home/Browse/Search/Saved) floating glass bar w/ safe-area; headers collapse to glass on scroll; sheets (filter/facets/details/report/share) spring + backdrop; toasts bottom-above-tabs; FlashList `windowSize 5, initial 8`; covers are Views (no images) so 2k rows hold 60fps; TTI <2s cached/<4s cold; size <60MB; blur NEVER over scrolling lists on low Android.

## 9. Build order (UI foundation first)

1. `theme/tokens + fonts + icons-base + SafeGlass + motion` 2. `BookCover/PaperCard/Skeleton/Empty/Error/OfflineBadge/Segmented/Sheet/Toast` 3. Onboarding + Tabs + Home 4. Browse/Search/Subject/Course 5. Paper + Saved/Downloads 6. Upload/Admin/Profile/About/Settings/NotFound/ShortLink 7. Decor pass (functional → ambient) + a11y/motion-gate audit.

## 10. Open inputs (link later)

User to provide: visual reference link (look/feel). DECIDED: glass maximal (chrome-wide w/ fallback matrix enforced), density balanced-rows (cover + inline meta, no extra tap), icons full-40 animated (interaction-triggered only, never looping in lists), analytics Expo.

## 11. Gap-driven UI rules (locked)

- Viewer chrome per type: pdf native pager; image zoom viewer; docx/pptx viewerng WebView w/ "Download + Open in…" offline path; error cards for locked/corrupt/oversize with report CTA.
- Perf with maximal glass + 40 icons: glass never over scrolling lists/cards/PDF; blur only on flagship (else solid); icons animate on press/focus only (Reanimated, ≤250ms), Lottie only onboarding/empty/404/upload-success; bundle watch <60MB (audit Lottie JSON size).
- Storage UI: pre-download space check dialog; Downloads manager shows cap bar + per-file pin; auto-evict toast names freed space.
- Migration/first-run: onboarding renders from bundled JSON offline; upgrade silently migrates v1 keys; diagnostics row in Settings.
