# Handoff: Caleb's Library

## Overview

Caleb's Library is an **open, community-run library of student notes, study guides, and papers**. It's free to read, free to contribute, and requires no user account. This handoff covers the full front-end design: nine screens covering the home page, browse, search, subject pages, individual paper detail, contribution flow, contributor profiles, moderation admin, about page, and 404.

Key product principles baked into the design:

- **No auth.** Anyone can read; anyone can contribute. Contribution requires providing name + email each time (no accounts).
- **Openness is a first-class UI element.** A dismissible banner at the very top of every page reinforces "Free. Open. No account needed."
- **Community over institution.** No school branding, no departmental hierarchy — just a self-declared community project started by "Caleb H." in 2019.
- **Moderation via passphrase.** Admin/moderation screen is behind a shared rotating passphrase — no per-user login.

---

## About the Design Files

The files in this bundle are **design references created in HTML** — high-fidelity prototypes showing intended look, layout, typography, spacing, interactions, and copy. **They are not production code to copy directly.**

The task is to **recreate these designs in your target codebase's existing environment** (React + Tailwind, Next.js, Vue, SvelteKit, native mobile, or whatever stack you're on) using its established patterns, component libraries, routing, and state management. If no environment exists yet, choose the framework most appropriate for the project — the design is straightforward enough for any modern framework; the primary technical concerns are a good rich-text/PDF preview and a solid file-upload flow.

The prototype was built with:
- React 18 (via `text/babel` in-browser transform)
- Plain CSS custom properties (all design tokens in `tokens.css`)
- No routing library — just a local state machine (`route.screen`) with `localStorage` persistence
- No backend — sample data lives in `src/data.jsx`

None of that is prescriptive; port to whatever fits your codebase.

---

## Fidelity

**High-fidelity (hifi).** Exact hex values, exact type sizes, exact spacing, exact copy, exact interaction states are all specified below and visible in the reference HTML. Recreate the UI pixel-perfectly using your codebase's existing libraries and patterns.

Where the reference HTML uses inline styles for layout, that's a prototyping shortcut — extract to your framework's idiomatic pattern (CSS Modules, styled-components, Tailwind utilities, whatever).

---

## Screens / Views

The app has a **persistent shell** (open banner + top strip + footer) that wraps every screen. Screens are single-page transitions with a subtle fade-up entrance animation.

### Persistent Shell

**Open Banner** (top of every page, dismissible, height 32px)
- Background: `#171412` (ink-100)
- Text color: `#f5f2ea` (paper)
- Copy: **"Free. Open. No account needed."** followed by muted subtext "Anyone can read. Anyone can contribute." then a "How it works →" link that navigates to About
- Small 6×6 pale dot at the leftmost inline position for visual anchor
- Close button (16×16 × icon) at far right, opacity 0.5 → 1 on hover
- Once dismissed, `localStorage.setItem("calebs_banner_dismissed", "1")` — do not show again this session

**Top Strip** (sticky, height 56px)
- Background: `rgba(245, 242, 234, 0.92)` with `backdrop-filter: blur(8px)`
- Bottom border: 1px `rgba(23,20,18,0.10)`
- Max-width content: 1240px, horizontal padding 32px
- Left: logo — **"Caleb's"** in italic serif (EB Garamond, 22px, weight 500) + **"LIBRARY"** in uppercase sans (Inter, 12px, weight 500, letter-spacing 0.14em, color `#6b625b`). Clicking navigates to Home.
- Center: mini search input (only shown when NOT on Home; Home has its own big search). Placeholder "Search the library…", Enter navigates to Search with the query.
- Right: `Browse` (ghost), `About` (ghost), `Contribute` (primary button with + icon).

**Footer** (below every screen, top margin 96px)
- Background: `#ede9dd` (paper-2)
- Top border: 1px rule
- 4-column grid: brand blurb (2 cols) · Library links · Community links · Legal links
- Brand column: repeat the "Caleb's Library" logo + a two-sentence description
- Each column has an eyebrow "smallcaps" label (10px uppercase, letter-spacing 0.16em, weight 600, color `#6b625b`) and a list of `FooterLink` items (13px, `#3d3733`, hover `#171412`)
- Bottom row: 1px rule + "© 2026 · Caleb's Library · A community project" (mono, left) + "Made with care. Kept alive by contributors." (right)

---

### 1. Home (`route.screen === "home"`) — default screen

**Purpose:** Land users on a Google-style search-first experience. No marketing hero. Get to reading or contributing immediately.

**Layout:**
- Centered masthead section (max-width 900px, top padding 80px)
- Below that, full-width sections at max-width 1240px

**Components (top → bottom):**

1. **Masthead eyebrow** — smallcaps "Est. 2019 · A community library"
2. **Title** — the words "Caleb's" (italic serif) and "Library." (regular serif, all one line).
   - Font: EB Garamond, 120px, line-height 0.9, letter-spacing -0.04em, weight 500, color `#171412`
   - "Caleb's" is italic; "Library." is upright — the italic-to-roman shift IS the visual signature of the brand
3. **Tagline** — 18px, line-height 1.55, `#3d3733`, max-width 620px, text-wrap balance
   - Copy: "A student-run library of notes, papers, and study guides. Open to anyone. Kept by whoever shows up."
4. **Big search input** (max-width 640px)
   - White background `#fff`, 1px border `rgba(23,20,18,0.20)`, radius 8px
   - Padding 18px 22px 18px 56px (left padding leaves room for the 20×20 search icon at left)
   - Font size 16px, letter-spacing -0.005em
   - On focus: border → `#171412`, shadow → `0 4px 16px rgba(23,20,18,0.08)`
   - Right side: a small "Enter ↵" hint chip (mono, 10px, in `#ede9dd` bg with 1px rule)
   - Enter key navigates to Search with the query
5. **Quick browse row** (32px margin-top from the search box, centered flex-wrap)
   - Leading label "Or browse:" in `#6b625b`
   - Then 8 subject pills (border-radius 999px, padding 6px 14px, 1px `rgba(23,20,18,0.20)` border, 13px font, weight 500)
   - Hover: fill `#171412`, text `#f5f2ea` — the entire pill inverts
   - Final "All 12 subjects →" pill with a dashed border
6. **Stats strip** (64px margin-top, top-bordered, gap 64px, centered flex)
   - Four `Stat` components: **3,247 Papers · 891 Contributors · 24.6k Reads/month · 12 Subjects**
   - Each stat: value in 32px weight 500 letter-spacing -0.03em; label in smallcaps below

7. **"Recently added" section** (max 1240px, top padding 80px)
   - `SectionHeader` with eyebrow "This week" + title "Recently added" + right-side ghost "View all →" button
   - Grid: 6 columns, gap 24px, of `PaperCard` size="sm" (each is a book cover + title + metadata line)

8. **"Most loved by readers" section** (top padding 80px)
   - `SectionHeader` eyebrow "All-time", title "Most loved by readers"
   - **A bordered box** (1px rule, radius 8px) containing a 2-column grid of custom `LovedRow` items:
     - Layout: `48px 64px 1fr auto` grid
     - Rank number in italic serif, 34px, `#a29a91` — e.g. "01", "02"
     - Book cover xs
     - Title (16px weight 500) + meta line "{subject} · {type} · {contributor}"
     - Right side: mono "▲ {upvotes}" then muted "Xk reads"
   - Each row has bottom rule and hover background `#ede9dd`

9. **"Have notes to share?" CTA card** (max 900px, top margin 96px)
   - 48px vertical, 40px horizontal padding, 1px rule, radius 8px, bg `#faf7ef`
   - Two-column grid: text left + primary button right ("Contribute a paper →")
   - Eyebrow: "Have notes to share?"
   - Title: "Pass along the notes that carried you through." (30px, weight 500, letter-spacing -0.02em)
   - Sub: "Upload a PDF, add a title, and it goes on the shelves once a moderator confirms it. No account. No signup. Two minutes." (14px, `#3d3733`)

10. **Founder note** (max 780px, top margin 80px)
    - Avatar (56px) of "Caleb H." (initials "CH", ink-100 background, paper text)
    - Italic serif quote: *"I started this as a shared drive with three friends in 2019. It grew because people kept adding things. That's the whole model — add what you can, take what you need."*
    - Attribution: "**Caleb H.** — founder, still uploading"

---

### 2. Browse (`route.screen === "browse"`)

**Purpose:** Cover-forward browse of the whole library, grouped by subject, shelves-style.

**Layout:** max 1240px, padding 48px 32px.

**Components:**

1. **Header block**
   - Smallcaps "The library"
   - Title: "Everything, sorted by subject." (44px, weight 500, letter-spacing -0.03em)
   - Sub: "Hover a book to lift it. Click to open. Every paper was uploaded by someone who wanted the next reader to have an easier time." (15px, `#3d3733`)

2. **Filter bar** (bg `#faf7ef`, 1px rule, radius 6px, padding 12px 16px)
   - Left: Filter icon + smallcaps label "Filter"
   - `FilterPills` for Subject (All + 8 subjects) — active pill: bg `#171412`, text `#f5f2ea`; inactive: transparent, 12px, weight 500
   - Divider
   - `FilterPills` for Type (All types + all paper types)
   - Right: mono count "N papers"
   - View toggle (Shelves | Grid) — active button has white bg + subtle shadow

3. **Shelf View** (default, `view === "shelf"`)
   - For each subject with results, render a "shelf":
     - Shelf label row (title + item count + "Open department →" ghost link)
     - Books laid out in a flex-wrap row, each 132px wide, gap 20px
     - Below the books: a 4px-tall **ink bar** (`#171412`) with a soft box-shadow underneath — this is the "shelf" itself. Then a 24px gradient shadow tapering to transparent.
     - **IMPORTANT:** The shelf must be pure ink `#171412`, not the old warm-brown wood color.

4. **Grid View** (when `view === "grid"`)
   - 6-column grid of `PaperCard` size="sm", gap 32px, no subject grouping

5. **Empty state** (when filters return zero results)
   - Dashed 1px border box, 80px padding
   - Title "These shelves are empty" + "Try loosening your filters."

---

### 3. Search (`route.screen === "search"`)

**Purpose:** Full-facet search with highlighted matches.

**Layout:** max 1240px, padding 48px 32px. Two-column body: `260px 1fr`, gap 40px.

**Components:**

1. **Query header**
   - Smallcaps "Search"
   - Large white search input (max 780px, 28px font, weight 500, letter-spacing -0.02em, 20×20 search icon at left)
   - Below: "N results for **"{query}"**"

2. **Facets sidebar (260px)**
   - `FacetGroup`s stacked with 28px gap:
     - **Subject** — checkboxes for 8 subjects, each with a paper count on the right
     - **Type** — 6 paper types (Study Guide, Lecture Notes, Past Exam, Problem Set, Essay, Cheat Sheet)
     - **Year** — a range slider (min 2020, max 2026) with two thumbs, mono min/arrow/max display
   - Each `FacetCheckbox`: 14×14 rounded checkbox (1.5px border), fills `#171412` when checked with a white check icon
   - "Reset all filters" button at the bottom

3. **Results main**
   - Sort tabs row (border-bottom rule): smallcaps "Sort by" + 4 sort options ("Most relevant", "Newest", "Most upvoted", "Most downloaded"). Active: 1.5px bottom border, weight 600, `#171412`.
   - Result list: each `SearchResultRow` is a 3-column grid `80px 1fr auto`, padded 24px 16px, bottom-ruled, hover `#ede9dd` bg:
     - Book cover xs
     - Tags row (subject + type) → title (20px, weight 500, letter-spacing -0.02em) → subtitle line → author meta line (avatar + name · year · N pages)
     - **Match highlighting:** case-insensitively split title on query, wrap matches in `<mark>` with `#171412` bg and `#f5f2ea` text
     - Right column: upvote count chip (mono, small) + download count below
   - Pagination row at bottom: 5 numbered buttons + "…" + a final page number. Active page fills black.

---

### 4. Subject (`route.screen === "subject"`, param `id`)

**Purpose:** A department page — hero, curated essentials, course list, all papers, top contributors.

**Layout:**

1. **Subject hero** (bg `#ede9dd`, padding 64px 32px 48px)
   - Breadcrumb: Library › All subjects › {Subject}
   - Smallcaps "Department"
   - Title: subject name in 68px sans-serif, weight 500, letter-spacing -0.035em
   - Stats row: **{count} Papers · {contribs} Contributors · 14 Courses**

2. **"This term's essentials"** — 4-column grid of size="md" PaperCards

3. **"Every course, every paper"** — 2-column grid of course rows
   - Each row: 3px ink accent bar + course name (15px weight 500) + count (mono) + chevron
   - Course names are computed: `${SUBJ_CODE} 101 — Introduction`, etc.
   - Hover: border color → `#171412`

4. **"All papers"** — 6-column grid, size="sm" PaperCards

5. **"Top contributors"** — 4-column grid of contributor cards
   - Avatar 44px + name + "N contributions"
   - Click navigates to Profile

---

### 5. Paper Detail (`route.screen === "paper"`, param `id`)

**Purpose:** Show a single paper: preview, metadata, actions, discussion.

**Layout:** max 1240px, padding 40px 32px.

**Components:**

1. **Breadcrumb** — Library › {Subject} › {Type}

2. **Header row** — 3-column grid `180px 1fr auto`, gap 40px, margin-bottom 40px
   - **Left:** BookCover size="lg"
   - **Center:** tag row (subject / type / year) → title (44px sans, letter-spacing -0.03em, weight 500, text-wrap balance) → subtitle (17px `#3d3733`) → author-and-meta row with avatar, name, contribution count, file info, view count, upload age
   - **Right (min-width 220px):** action stack
     - Primary "Download PDF" button
     - Save + Share buttons (equal-width 2-column)
     - Vote group (inline): upvote button (fills black when active) + a small downvote next to it, joined by a divider
     - Ghost "Report an issue" button at bottom

3. **Two-column body** — `1fr 320px`, gap 40px
   - **Main tabs:** Preview | Citation | Discussion ({count})
     - **Preview tab:** the `PDFPreview` component (a stylized mock PDF page with fake headings and text lines) inside a bordered `#ede9dd` container. Overlay a pill-shaped page navigator at the bottom center: dark bg, mono "Page 1 of N".
     - **Citation tab:** four citation cards (APA, MLA, Chicago, BibTeX). Each: eyebrow + right-aligned "Copy" ghost button, then the formatted citation. BibTeX uses monospace, others use sans.
     - **Discussion tab:**
       - Composer at top: avatar + textarea + "Your name (optional)" input + primary "Post" button
       - Comment thread: avatar + author name + timestamp + body + row of actions (upvote count, "Reply", replies count)
   - **Right sidebar:**
     - "Details" card: 6 rows, each `label` (left, `#6b625b`) + `value` (right, mono 12px, `#171412`). Rows: Course, Professor, Semester, Language, License (CC BY-NC 4.0), Size.
     - "Related" list: 4 mini cards (xs cover + title + "{type} · ▲{upvotes}"), hover bg `#ede9dd`.

---

### 6. Upload (`route.screen === "upload"`)

**Purpose:** Three-step contribution flow. NO account needed — contributor info is collected inline.

**Layout:** max 780px, padding 48px 32px.

**Header:**
- Smallcaps "Contribute"
- Title: "Add to the library." (44px, letter-spacing -0.03em)
- Sub: "Your notes carried you through the semester. Pass them along. **No account required** — just tell us who you are so we can credit you, and a moderator will review before it goes live."

**Stepper** (bg `#faf7ef`, border, radius 6px):
- Three steps: `1. Upload file` · `2. Your details` · `3. Review & submit`
- Each step: 26px circle (filled ink-100 when active or complete, check icon when past) + smallcaps "Step N" + step title (`white-space: nowrap` so it never wraps)
- Between steps: a 1px line, fills ink-100 as steps progress

**Step 1 — Drop zone:**
- Big 2px dashed border box, radius 8px, padding 72px 32px, centered
- 56×56 circular icon holder with upload icon
- Title "Drop a file to begin." → "One file, ready to catalog." after file selected
- Sub: "PDF, DOCX, PPTX, or images. Up to 25 MB per file." → "Continue below to add details, or drop another file."
- Primary "Choose a file" button (hidden after selection)
- After selection, a **file chip row** appears below: red-ish (no — plain ink) "PDF" badge (44×56, radius 2px, `#171412` bg, `#f5f2ea` text) + filename + size + green check + X to remove
- Continue button disabled (opacity 0.4) until a file is present

**Step 2 — Details form:**
- **Top: "Who's contributing?" card** — this is the new no-auth insertion. 1px `#171412` border, padding 24px, `#faf7ef` bg.
  - Smallcaps "Who's contributing?"
  - Title: "Since there's no account, we ask each time." (15px, weight 500)
  - Sub: "Your name will appear as the contributor. Your email is used only to reach you if a moderator has a question — it stays private."
  - Two-column grid: Name input + Email input. Both required.
  - Email field has a hint "Never shown publicly" aligned right in the label row.
- **Paper details** (below):
  - Title (required, full width)
  - Subject (select, required) + Type (select, required)
  - Course code + Professor + Year (`1fr 1fr 120px`)
  - Description (textarea, hint "One paragraph. What's in here, and who does it help?")
  - License radio group (3 options, "CC BY-NC 4.0" is recommended and pre-selected — pill "RECOMMENDED" on that row)
- Back / Review buttons at bottom

**Step 3 — Review:**
- Two-column card (160px + 1fr) with a preview book cover on the left showing the entered title, and on the right:
  - Smallcaps "Preview"
  - Big title (28px)
  - Course · Professor line
  - 2-column key-value grid: Contributor, Subject, Type, Year
  - Info callout: "A moderator will review within 24–48 hours. If they need to reach you, they'll email **{contributorEmail or 'your address'}**. Your name will appear as the contributor once it's live."
- Checkbox: "I confirm this is my own work (or I have permission to share it), and I understand it will be publicly readable once approved."
- Back / "Submit for review ✓" buttons

**On submit:** navigate to Home (in production, show a success toast + link to the submission).

---

### 7. Profile (`route.screen === "profile"`, param `id`)

**Purpose:** Public contributor page. Anyone can view without login.

**Layout:**

1. **Profile hero** (bg `#ede9dd`, padding 56px 32px 40px)
   - 96px avatar (ink-100 bg, paper text)
   - Smallcaps "Contributor" (add "· Founder" for Caleb)
   - Name in 52px sans, weight 500, letter-spacing -0.035em
   - Bio (15px, `#3d3733`, max 520px)
   - Tag row: handle (`@name`) + "Founder" pill if applicable (dark tag: ink-100 bg + paper text)
   - Right side: two stats (Contributions, Reads)

2. **Tab strip:** Papers ({count}) | Curated shelves | About
   - Same visual treatment as PaperDetail tabs (2px bottom border, ink text on active)

3. **Papers tab** — 4-column grid of size="md" PaperCards. Empty slots (dashed border, "Empty slot" text) fill the grid.
4. **Shelves tab** — 3-column grid of 24px-padded cards, each with a Books icon + shelf name + count.
5. **About tab** — a card containing the bio + a boilerplate second paragraph.

---

### 8. Admin — Moderation (`route.screen === "admin"`)

**Purpose:** Passphrase-gated review queue for moderators.

**Passphrase gate (initial state):**
- Centered card, max-width 440px, padding 40px 32px, bordered
- 44px ink circle with a Shield icon at top
- Smallcaps "Moderators only"
- Title "Enter passphrase" (32px)
- Copy: "The moderation queue is behind a shared passphrase. Ask an existing moderator for the current one — it rotates each semester."
- Password input + primary "Unlock →" button
- Error state (when empty submit): "That's not the passphrase." (in production, validate against the real shared passphrase — the demo accepts any non-empty string)
- On unlock: set `localStorage.calebs_admin = "1"` and show the queue
- Bottom link: "Not a moderator? Read about how moderation works." → navigate to About

**Queue view (post-unlock):**
- Header band (bg `#ede9dd`, padding 24px 32px)
  - Smallcaps "Moderators · You're signed in"
  - Title "Moderation queue" (32px)
  - Filter chips: Pending (12) · Flagged (3) · Approved (218) · Rejected (7). Active fills ink.
  - Sign-out ghost button (clears `calebs_admin` and returns to gate)
- 2-column body (`360px 1fr`)
  - **Left rail:** vertical list of pending items. Each item shows queue ID (mono), flag badges, AI-detection badge (if >30%), paper title, avatar + contributor name, submitted time. Active row has a 3px ink left border and `#ede9dd` bg.
  - **Right panel (`AdminReviewPanel`):**
    - Alert bar (if `item.note`): black bar with flag icon, "Requires attention" + note
    - Header: BookCover md + tags + title (28px) + subtitle + avatar-name-contribs row
    - "Automated checks" grid — 4 tiles: Plagiarism, AI-generated, Duplicate check, Sensitive. Failing tiles get a stronger ink-100 border and paper-2 bg.
    - "Document preview" — the same PDFPreview component, 420px tall, max-width 500px
    - **Decision card** — bordered, with a textarea "Add a note to the contributor (optional)" and three buttons: ghost "Request changes", secondary "Reject" (X icon), primary "Approve & publish" (check icon)

---

### 9. About (`route.screen === "about"`)

**Purpose:** Explain what the library is, how it works, who runs it.

**Layout:** max 780px, padding 72px 32px.

**Components:**
1. Smallcaps "How it works"
2. **Serif italic hero title:** "What Caleb's Library is." — EB Garamond, 72px, italic, letter-spacing -0.03em, weight 500, text-wrap balance
3. Sub (20px, `#3d3733`, letter-spacing -0.01em)
4. Ornament divider (a thin rule with a dot in the middle)
5. **Editorial body** (16px, line-height 1.75, letter-spacing -0.005em):
   - Opening two paragraphs (see reference for exact copy)
   - **"Three rules." section** — h2 (28px), then a list. Each rule is a 2-column grid `72px 1fr`:
     - Left: mono "RULE 01" / "RULE 02" / "RULE 03" (12px, `#6b625b`, letter-spacing 0.04)
     - Right: rule title (20px, weight 500) + body (15px, `#3d3733`)
     - Rules 2 and 3 have a top border above them for visual separation
   - **"Who runs this." section** — two paragraphs
   - **"Want to help." section** — one paragraph
6. **Moderators card** — 4-column grid of avatar + name + `@handle`. Click navigates to Profile.
7. Bottom actions: primary "Contribute a paper" + secondary "Browse the library"

---

### 10. 404 (`route.screen === "notfound"`)

**Purpose:** Playful in-brand not-found state.

**Layout:** max 720px, centered, padding 120px 32px 96px.

**Components:**
- **Fallen book stack** — three BookCovers positioned absolutely with different rotations to look "fallen" (e.g. -14°, -38°, 24°), some at 0.7 opacity for depth
- Huge italic serif "404" (96px, EB Garamond italic, letter-spacing -0.03em)
- Title: "This page wandered off the shelves." (40px sans)
- Sub: "Whatever you were looking for isn't here — or isn't here anymore. Perhaps a moderator moved it, or it was withdrawn from circulation."
- Two buttons: primary "← Back to the library" + secondary "Browse everything"

---

## Reusable Components

The design uses a small set of custom components defined in `src/shared.jsx`. Recreate these in your codebase:

### `<BookCover paper={paper} size="xs|sm|md|lg|xl" onClick={fn} />`
The signature visual element. A book cover with a spine strip, aged-paper grain, and hover lift.

- **Aspect ratio:** always 2:3
- **Sizes (width in px):** xs=68, sm=92, md=132, lg=180, xl=240 — inner padding and font sizes scale accordingly
- **Structure inside the cover:**
  1. Top thin horizontal rule in accent color (opacity 0.5)
  2. Subject name in uppercase, smallcaps-style, letter-spacing 0.14em, weight 600, accent color
  3. Paper title (sans, weight 500, letter-spacing -0.015em, text-wrap balance, hyphens auto)
  4. Flex spacer
  5. Bottom rule
  6. Mono year + page count (e.g. "2026 · 18pp")
- **Spine strip** (via `::before`): 8px wide gradient on the left, `linear-gradient(90deg, rgba(0,0,0,0.4), rgba(0,0,0,0.15) 40%, rgba(255,255,255,0.04) 55%, rgba(0,0,0,0.15))`
- **Paper grain** (via `::after`): fine radial-gradient dot pattern at low opacity
- **Border-radius:** 2px 6px 6px 2px (subtle rounded outer corners, hard spine corner)
- **Shadow:** `0 8px 24px rgba(23,20,18,0.18), 0 2px 4px rgba(23,20,18,0.10)`
- **Hover:** `transform: translateY(-6px) rotate(-0.5deg)`; shadow intensifies. 260ms out-cubic.

Cover colors are looked up from `COVERS[paper.cover % 16]` — 16 tonal ink shades from `#151515` charcoal to `#5c534b` warm brown-black, plus 4 "inverted" cream covers with dark ink. See `data.jsx` for the exact palette.

### `<PaperCard paper={paper} size="sm|md" onClick={fn} />`
BookCover + title + one-line meta below. Hover: `translateY(-2px)`.
- Title: sans, 14.5px, weight 500, line-height 1.3, letter-spacing -0.01em, text-wrap balance
- Meta: mono 11px, `#6b625b` — `{type} · ▲ {upvotes}`

### `<Avatar user={user} size={32} />`
Circle with initials. Always monochromatic: `#171412` bg, `#f5f2ea` text. Font-weight 500, letter-spacing 0.02em, sizing scales font at 0.42× width.

### `<SectionHeader eyebrow="..." title="..." action={<button/>} />`
Row with eyebrow-smallcaps + title on the left, optional action on the right. Bottom margin 24px. Title: sans, 26px, weight 500, letter-spacing -0.02em.

### `<PDFPreview paper={paper} height={520} />`
A fake PDF page for preview: cream `#fdfaf3` bg, thin shadow, editorial padding. Shows: smallcaps header, title (30px), subtitle, mono teacher line, section headings, and rows of gray rectangles simulating text lines at 100/92/96/88/74/… widths.

### `<Ornament />`
Thin horizontal rule with a small dot in the middle. Used sparingly on the About page.

### `<Stat value="3,247" label="Papers" />`
Big number + smallcaps label below. Value: 32px, weight 500, letter-spacing -0.03em.

---

## Interactions & Behavior

### Navigation
- **Local state machine.** `route = { screen: "home" | "browse" | "search" | "subject" | "paper" | "upload" | "profile" | "admin" | "about" | "notfound", ...params }`
- Persist route to `localStorage.calebs_route` on every change
- On mount, restore route from localStorage (default: `{ screen: "home" }`)
- `navigate(screen, params)` scrolls to top and updates route
- `navigate("back")` calls `window.history.back()`
- Each screen has `data-screen-label={screen}` on its root for testing / comment context
- On screen change, apply a 260ms fade-up entrance (opacity 0→1, translateY 6px→0, ease `cubic-bezier(0.16, 1, 0.3, 1)`)

### Search
- Enter key in any search input navigates to `search` screen with the query
- Search results highlight the query inside titles with `<mark>` tags styled `#171412` bg + `#f5f2ea` text
- Facet checkboxes toggle immediate filtering. Year range is a two-thumb range slider.
- Sort tabs are visual only in the prototype — implement backend sorting per label

### Upload
- Drop zone accepts drag-and-drop OR click-to-select. In the prototype, clicking the drop zone simulates a file — in production, wire to a real `<input type="file">`.
- Contributor name + email are **required** in step 2. Add form validation before allowing "Review".
- On submit, POST to your upload endpoint. On success, navigate to Home and show a toast (not present in prototype).

### Admin
- The passphrase gate accepts any non-empty string in the prototype demo. In production, POST the passphrase to your backend for verification, and use a session cookie or JWT for subsequent moderator-only requests. Do NOT store the passphrase itself in localStorage.
- Filter chips (Pending/Flagged/Approved/Rejected) update the queue list. Selecting a row updates the right panel.
- Approve / Reject / Request changes fires the corresponding backend action and advances to the next queue item.

### Banner
- Once dismissed, `localStorage.calebs_banner_dismissed = "1"`. Never show again unless localStorage is cleared.

### Vote & Save (on Paper Detail)
- Client-side state in the prototype. Upvote toggles between 0 and +1; downvote toggles between 0 and -1 (only one active). Save toggles bookmark filled/outlined.
- In production: POST to backend; show optimistic UI; support anonymous voting via a device fingerprint or ephemeral cookie, since there's no auth.

---

## State Management

Minimal — no accounts, no user session, no persistent client state beyond:

| Key | Purpose |
|---|---|
| `localStorage.calebs_route` | Restore the last screen the user was on |
| `localStorage.calebs_banner_dismissed` | Suppress the open banner |
| `localStorage.calebs_admin` | Simple flag that this browser has unlocked the moderation gate this session |

In production you'll also need:
- **Server data:** papers, subjects, contributors, comments, queue items, upvote/download counters
- **Uploads:** a file storage bucket + a queue for moderator review
- **Search:** either a full-text search over the papers table or a dedicated index (Meilisearch, Typesense, Postgres FTS)
- **Rate limiting** on uploads and votes (anonymous users)

---

## Design Tokens

Full token set lives in `tokens.css`. Key values:

### Colors — Paper (backgrounds)
| Token | Hex | Use |
|---|---|---|
| `--paper` | `#f5f2ea` | App background |
| `--paper-2` | `#ede9dd` | Section separators, hover states, filter bar |
| `--paper-3` | `#e2ddce` | Deeper cream (rare) |
| `--paper-4` | `#cec7b3` | Aged edge (rare) |
| `--bg-elevated` | `#faf7ef` | Card backgrounds slightly brighter than paper |

### Colors — Ink (text & accents)
| Token | Hex | Use |
|---|---|---|
| `--ink-100` | `#171412` | Primary text, buttons, active nav |
| `--ink-85` | `#241f1c` | Hover on primary button |
| `--ink-70` | `#3d3733` | Secondary text |
| `--ink-50` | `#4a423c` | — |
| `--ink-40` | `#6b625b` | Tertiary / muted text, meta |
| `--ink-30` | `#8f887b` | Placeholder text |
| `--ink-20` | `#b8b1a3` | — |
| `--ink-10` | `#ded9cd` | Subtle |

### Rules
| Token | Value | Use |
|---|---|---|
| `--rule` | `rgba(23,20,18,0.10)` | All hairline dividers |
| `--rule-strong` | `rgba(23,20,18,0.20)` | Border on inputs, filter buttons, book stack shelf |
| `--shadow-soft` | `0 1px 2px rgba(23,20,18,0.04)` | Rest state on inputs |
| `--shadow-book` | `0 8px 24px rgba(23,20,18,0.18), 0 2px 4px rgba(23,20,18,0.10)` | Book covers |

### Typography
| Token | Value |
|---|---|
| `--font-sans` | `"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif` |
| `--font-serif` | `"EB Garamond", "Times New Roman", Georgia, serif` |
| `--font-mono` | `"JetBrains Mono", "Menlo", "Consolas", monospace` |

**Serif is used ONLY for:** the "Caleb's" logo in the top strip/footer, the Home masthead ("Caleb's Library."), the About page hero, the 404 hero, and the founder quote on Home. Everything else is Inter.

**Base body:** `font-family: var(--font-sans); font-size: 14px; line-height: 1.55; letter-spacing: -0.005em; -webkit-font-smoothing: antialiased;`

**Type scale (px):** xs 11 · sm 12.5 · base 14 · md 16 · lg 20 · xl 28 · 2xl 36 · 3xl 48 · 4xl 64 · 5xl 96 · 6xl 128

Common headline weights are 500 with tight letter-spacing (-0.02em to -0.035em). Never use weight 700+ except for buttons occasionally.

### Spacing (8-based)
| Token | Value |
|---|---|
| `--sp-1` … `--sp-10` | 4, 8, 12, 16, 24, 32, 48, 64, 96, 128 px |

### Radii
| Token | Value |
|---|---|
| `--r-xs` `--r-sm` `--r-md` `--r-lg` `--r-xl` | 2, 3, 5, 10, 16 px |

Most components use `--r-sm` (3px) or `--r-md` (5px). Radius 999px is used only for pill filters on Home.

### Motion
| Token | Value |
|---|---|
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` |
| `--ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` |
| `--dur-fast` | 140ms — hovers, small state changes |
| `--dur-med` | 260ms — screen transitions, book cover lift |
| `--dur-slow` | 480ms — rare, larger transitions |

### Layout
| Token | Value |
|---|---|
| `--top-h` | 56px — top strip height |
| `--banner-h` | 32px — open banner |
| `--max-content` | 1240px — content max-width |

---

## Assets

The prototype ships with:
- **Fonts** — loaded from Google Fonts. In production, self-host or use your CDN of choice.
  - EB Garamond (weights 400, 500, plus italic 400, 500)
  - Inter (weights 400, 500, 600, 700)
  - JetBrains Mono (weights 400, 500)
- **Icons** — all icons are inline SVG in `src/icons.jsx`. 24×24 viewBox, currentColor stroke, 1.75px stroke width, round joins & caps. Full set (~30 icons) covers: Home, Books, Search, Upload, User, Dashboard, Shield, Info, Bookmark, Download, ArrowUp/Down/Left/Right, Check, X, Plus, Filter, Grid, List, Star, Book, File, Clock, Chat, Share, Cite, Sparkle, Chevron, Settings, Bell, Google, Trending, Heart, MoreH, Flag, Eye. Recreate as SVGs in your app or replace with your icon library (Lucide, Phosphor, etc — the prototype's icons are already Lucide-style).
- **No image assets.** All visuals are CSS + SVG. Book covers are pure CSS.
- **Sample data** — 16 papers, 9 contributors, 12 subjects in `src/data.jsx`. Discard when hooking to real backend.

---

## Files

The full reference implementation is included in this handoff folder:

| File | What it is |
|---|---|
| `Calebs Library.html` | Entry point — loads React, Babel, tokens.css, and the bundled JSX |
| `tokens.css` | Full design token system (colors, fonts, spacing, buttons, inputs, cards, book covers) |
| `src/App.jsx` | Root component: banner, top strip, screen router, footer |
| `src/data.jsx` | Sample data (SUBJECTS, CONTRIBUTORS, PAPERS, COVERS, STATS) + helpers |
| `src/icons.jsx` | Inline SVG icon set |
| `src/shared.jsx` | Reusable components (BookCover, PaperCard, Avatar, SectionHeader, PDFPreview, Ornament, Stat) |
| `src/screens/Home.jsx` | Home screen — search-first landing |
| `src/screens/Browse.jsx` | Full library, shelves + grid view |
| `src/screens/Search.jsx` | Search results with facets |
| `src/screens/Subject.jsx` | Department page |
| `src/screens/PaperDetail.jsx` | Individual paper — preview, citation, discussion |
| `src/screens/Upload.jsx` | 3-step contribution flow |
| `src/screens/Profile.jsx` | Public contributor page |
| `src/screens/Admin.jsx` | Passphrase-gated moderation queue |
| `src/screens/About.jsx` | Editorial "how it works" page |
| `src/screens/NotFound.jsx` | 404 |
| `src/bundle.jsx` | Concatenation of all the above JSX files (used at runtime because Babel-standalone in-browser can't reliably fetch external JSX files). Ignore in a real port — implement each screen as its own module in your framework. |

Open `Calebs Library.html` directly in a browser to see the working prototype.
