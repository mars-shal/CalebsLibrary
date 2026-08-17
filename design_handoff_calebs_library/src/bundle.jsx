
/* ====== src/icons.jsx ====== */
// Lightweight inline SVG icons. All stroke-based, 1.75px, currentColor.
const _iconProps = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.75, strokeLinecap: "round", strokeLinejoin: "round" };

const Icon = {
  Home: (p) => <svg {..._iconProps} {...p}><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-9.5Z"/></svg>,
  Books: (p) => <svg {..._iconProps} {...p}><path d="M4 4h4v16H4zM10 4h4v16h-4zM17 5l3.5 1-3.5 14L13.5 19z"/></svg>,
  Search: (p) => <svg {..._iconProps} {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>,
  Upload: (p) => <svg {..._iconProps} {...p}><path d="M12 16V4m0 0-4 4m4-4 4 4M4 20h16"/></svg>,
  User: (p) => <svg {..._iconProps} {...p}><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>,
  Dashboard: (p) => <svg {..._iconProps} {...p}><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>,
  Shield: (p) => <svg {..._iconProps} {...p}><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z"/></svg>,
  Info: (p) => <svg {..._iconProps} {...p}><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/></svg>,
  Bookmark: (p) => <svg {..._iconProps} {...p}><path d="M6 3h12v18l-6-4-6 4V3Z"/></svg>,
  Download: (p) => <svg {..._iconProps} {...p}><path d="M12 4v12m0 0-4-4m4 4 4-4M4 20h16"/></svg>,
  ArrowUp: (p) => <svg {..._iconProps} {...p}><path d="M12 19V5M5 12l7-7 7 7"/></svg>,
  ArrowDown: (p) => <svg {..._iconProps} {...p}><path d="M12 5v14M19 12l-7 7-7-7"/></svg>,
  ArrowRight: (p) => <svg {..._iconProps} {...p}><path d="M5 12h14M12 5l7 7-7 7"/></svg>,
  ArrowLeft: (p) => <svg {..._iconProps} {...p}><path d="M19 12H5M12 19l-7-7 7-7"/></svg>,
  Check: (p) => <svg {..._iconProps} {...p}><path d="m4 12 5 5 11-11"/></svg>,
  X: (p) => <svg {..._iconProps} {...p}><path d="M6 6l12 12M18 6 6 18"/></svg>,
  Plus: (p) => <svg {..._iconProps} {...p}><path d="M12 5v14M5 12h14"/></svg>,
  Filter: (p) => <svg {..._iconProps} {...p}><path d="M3 5h18l-7 9v5l-4 2v-7L3 5Z"/></svg>,
  Grid: (p) => <svg {..._iconProps} {...p}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  List: (p) => <svg {..._iconProps} {...p}><path d="M8 6h13M8 12h13M8 18h13M4 6h.01M4 12h.01M4 18h.01"/></svg>,
  Star: (p) => <svg {..._iconProps} {...p}><path d="m12 3 2.6 5.9 6.4.6-4.9 4.4 1.5 6.4L12 17l-5.6 3.3 1.5-6.4L3 9.5l6.4-.6L12 3Z"/></svg>,
  Book: (p) => <svg {..._iconProps} {...p}><path d="M4 4v16a1 1 0 0 0 1 1h15M6 4h13v14H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"/></svg>,
  File: (p) => <svg {..._iconProps} {...p}><path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8l-5-5Z"/><path d="M14 3v5h5"/></svg>,
  Clock: (p) => <svg {..._iconProps} {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>,
  Chat: (p) => <svg {..._iconProps} {...p}><path d="M21 12a8 8 0 0 1-8 8H4l3-3a8 8 0 1 1 14-5Z"/></svg>,
  Share: (p) => <svg {..._iconProps} {...p}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg>,
  Cite: (p) => <svg {..._iconProps} {...p}><path d="M7 8h4v6c0 2-1 3-3 3M15 8h4v6c0 2-1 3-3 3"/></svg>,
  Sparkle: (p) => <svg {..._iconProps} {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/></svg>,
  Chevron: (p) => <svg {..._iconProps} {...p}><path d="m9 6 6 6-6 6"/></svg>,
  Settings: (p) => <svg {..._iconProps} {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></svg>,
  Bell: (p) => <svg {..._iconProps} {...p}><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M13.7 21a2 2 0 0 1-3.4 0"/></svg>,
  Google: (p) => <svg viewBox="0 0 24 24" {...p}><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.24 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"/><path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.2 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"/></svg>,
  Trending: (p) => <svg {..._iconProps} {...p}><path d="m3 17 6-6 4 4 8-8M14 7h7v7"/></svg>,
  Heart: (p) => <svg {..._iconProps} {...p}><path d="M12 21s-8-5-8-11a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6-8 11-8 11-.9.5-1.1.5-2 0Z"/></svg>,
  MoreH: (p) => <svg {..._iconProps} {...p}><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></svg>,
  Flag: (p) => <svg {..._iconProps} {...p}><path d="M4 21V4M4 4h13l-2 4 2 4H4"/></svg>,
  Eye: (p) => <svg {..._iconProps} {...p}><path d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>,
};

window.Icon = Icon;


/* ====== src/data.jsx ====== */
// Caleb's Library — shared data
// Community-owned, no institution. Contributors are self-declared.

const SUBJECTS = [
  { id: "biology",     name: "Biology",             count: 342 },
  { id: "chemistry",   name: "Chemistry",           count: 218 },
  { id: "physics",     name: "Physics",             count: 289 },
  { id: "mathematics", name: "Mathematics",         count: 401 },
  { id: "history",     name: "History",             count: 267 },
  { id: "literature",  name: "Literature",          count: 198 },
  { id: "philosophy",  name: "Philosophy",          count: 156 },
  { id: "economics",   name: "Economics",           count: 174 },
  { id: "cs",          name: "Computer Science",    count: 312 },
  { id: "psychology",  name: "Psychology",          count: 189 },
  { id: "engineering", name: "Engineering",         count: 245 },
  { id: "law",         name: "Law",                 count: 128 },
];

// Contributors — first names + last initial, community-anonymous by choice.
// No karma, no department requirement, no year.
const CONTRIBUTORS = [
  { id: "u01", name: "Eleanor V.",     initials: "EV", handle: "@eleanor",  bio: "English lit. Marginalia enthusiast.",              uploads: 47 },
  { id: "u02", name: "Marcus O.",      initials: "MO", handle: "@marcus",   bio: "Biology grad student.",                            uploads: 62 },
  { id: "u03", name: "Priya R.",       initials: "PR", handle: "@priya",    bio: "Applied maths. Notes-on-notes.",                   uploads: 34 },
  { id: "u04", name: "Theodore B.",    initials: "TB", handle: "@theo",     bio: "Philosophy. Kant apologist.",                      uploads: 51 },
  { id: "u05", name: "Amara O.",       initials: "AO", handle: "@amara",    bio: "Organic chemistry. Recovering pre-med.",           uploads: 28 },
  { id: "u06", name: "Wei C.",         initials: "WC", handle: "@wei",      bio: "CS. Wrote the search on this site.",               uploads: 41 },
  { id: "u07", name: "Sofia M.",       initials: "SM", handle: "@sofia",    bio: "History. French Revolution superfan.",             uploads: 39 },
  { id: "u08", name: "James W.",       initials: "JW", handle: "@james",    bio: "Physics. Loves entropy.",                          uploads: 45 },
  { id: "caleb", name: "Caleb H.",     initials: "CH", handle: "@caleb",    bio: "Started this library in a shared drive, 2019.",    uploads: 78, founder: true },
];

const PAPERS = [
  { id: "p001", title: "Photosynthesis in C4 Plants",                    subtitle: "Midterm Study Guide",                 subject: "biology",     type: "Study Guide",     year: 2026, pages: 18, upvotes: 342, downloads: 1240, views: 3420, contributor: "u02", teacher: "Prof. Halloway", cover: 0 },
  { id: "p002", title: "Renaissance Political Theory",                   subtitle: "Lecture Notes — Week 7",              subject: "history",     type: "Lecture Notes",   year: 2026, pages: 24, upvotes: 218, downloads: 890, views: 2180, contributor: "u07", teacher: "Prof. Adair", cover: 1 },
  { id: "p003", title: "Ordinary Differential Equations",                subtitle: "Full Course Notes",                    subject: "mathematics", type: "Course Notes",    year: 2026, pages: 87, upvotes: 512, downloads: 2140, views: 5680, contributor: "u03", teacher: "Prof. Nakamura", cover: 2 },
  { id: "p004", title: "Kant's Categorical Imperative",                  subtitle: "Essay & Analysis",                     subject: "philosophy",  type: "Essay",           year: 2026, pages: 12, upvotes: 189, downloads: 620, views: 1540, contributor: "u04", teacher: "Prof. Ostrowski", cover: 3 },
  { id: "p005", title: "Organic Chemistry Reactions",                    subtitle: "Master Sheet — CHEM 244",              subject: "chemistry",   type: "Cheat Sheet",     year: 2025, pages: 6,  upvotes: 894, downloads: 3210, views: 8420, contributor: "u05", teacher: "Prof. Wells", cover: 4 },
  { id: "p006", title: "Quantum Mechanics: Problem Set 4",               subtitle: "PHYS 401 — Solved",                    subject: "physics",     type: "Problem Set",     year: 2025, pages: 22, upvotes: 267, downloads: 1120, views: 2890, contributor: "u08", teacher: "Prof. Ibarra", cover: 5 },
  { id: "p007", title: "Data Structures & Algorithms",                   subtitle: "Complete Study Guide",                 subject: "cs",          type: "Study Guide",     year: 2026, pages: 64, upvotes: 671, downloads: 2890, views: 6120, contributor: "u06", teacher: "Prof. Larsen", cover: 6 },
  { id: "p008", title: "Beowulf & Old English Prosody",                  subtitle: "Lecture Notes",                        subject: "literature",  type: "Lecture Notes",   year: 2026, pages: 15, upvotes: 142, downloads: 480, views: 1210, contributor: "u01", teacher: "Prof. Ravenscroft", cover: 7 },
  { id: "p009", title: "Microeconomics: Consumer Theory",                subtitle: "Past Exam + Solutions",                subject: "economics",   type: "Past Exam",       year: 2024, pages: 14, upvotes: 385, downloads: 1580, views: 3720, contributor: "u03", teacher: "Prof. Marchetti", cover: 8 },
  { id: "p010", title: "Cognitive Bias in Decision Making",              subtitle: "Research Project",                     subject: "psychology",  type: "Project",         year: 2025, pages: 32, upvotes: 156, downloads: 540, views: 1420, contributor: "u07", teacher: "Prof. Ainsley", cover: 9 },
  { id: "p011", title: "Bridge Engineering Fundamentals",                subtitle: "Lecture Slides",                       subject: "engineering", type: "Slides",          year: 2026, pages: 48, upvotes: 203, downloads: 780, views: 1890, contributor: "u08", teacher: "Prof. Beaumont", cover: 10 },
  { id: "p012", title: "Constitutional Law Casebook",                    subtitle: "Study Guide Digest",                   subject: "law",         type: "Study Guide",     year: 2025, pages: 41, upvotes: 178, downloads: 620, views: 1550, contributor: "u04", teacher: "Prof. Ellsworth", cover: 11 },
  { id: "p013", title: "Cellular Respiration & the Krebs Cycle",         subtitle: "Detailed Notes",                       subject: "biology",     type: "Notes",           year: 2026, pages: 21, upvotes: 234, downloads: 890, views: 2100, contributor: "u02", teacher: "Prof. Halloway", cover: 12 },
  { id: "p014", title: "Linear Algebra: Eigenvalues",                    subtitle: "Deep Dive Study Guide",                subject: "mathematics", year: 2026, type: "Study Guide", pages: 29, upvotes: 421, downloads: 1720, views: 4230, contributor: "u03", teacher: "Prof. Nakamura", cover: 13 },
  { id: "p015", title: "The French Revolution",                          subtitle: "Causes & Consequences",                subject: "history",     type: "Essay",           year: 2025, pages: 18, upvotes: 167, downloads: 590, views: 1480, contributor: "u07", teacher: "Prof. Adair", cover: 14 },
  { id: "p016", title: "Thermodynamics: Entropy",                        subtitle: "Second Law Problem Set",               subject: "physics",     type: "Problem Set",     year: 2026, pages: 16, upvotes: 189, downloads: 720, views: 1820, contributor: "u08", teacher: "Prof. Ibarra", cover: 15 },
];

// Book covers — dark ink on cream, with tonal variation
// Every cover reads well against the paper background.
const COVERS = [
  { bg: "#171412", ink: "#f5f2ea", accent: "#8f887b" },  // charcoal
  { bg: "#241f1c", ink: "#f5f2ea", accent: "#8f887b" },
  { bg: "#2e2822", ink: "#f5f2ea", accent: "#a29a8b" },
  { bg: "#3d3733", ink: "#f5f2ea", accent: "#b8b1a3" },
  { bg: "#4a423c", ink: "#f5f2ea", accent: "#cec7b3" },
  { bg: "#5c534b", ink: "#f5f2ea", accent: "#ded9cd" },
  { bg: "#171412", ink: "#f5f2ea", accent: "#8f887b" },
  { bg: "#241f1c", ink: "#f5f2ea", accent: "#8f887b" },
  { bg: "#2e2822", ink: "#f5f2ea", accent: "#a29a8b" },
  { bg: "#3d3733", ink: "#f5f2ea", accent: "#b8b1a3" },
  { bg: "#4a423c", ink: "#f5f2ea", accent: "#cec7b3" },
  { bg: "#5c534b", ink: "#f5f2ea", accent: "#ded9cd" },
  // A few "inverted" covers — cream on ink for variety
  { bg: "#ede9dd", ink: "#171412", accent: "#4a423c" },
  { bg: "#e2ddce", ink: "#171412", accent: "#3d3733" },
  { bg: "#ded9cd", ink: "#171412", accent: "#241f1c" },
  { bg: "#cec7b3", ink: "#171412", accent: "#171412" },
];

const STATS = {
  totalPapers: 3247,
  contributors: 891,
  downloadsThisMonth: 24680,
  subjects: SUBJECTS.length,
};

window.SUBJECTS = SUBJECTS;
window.CONTRIBUTORS = CONTRIBUTORS;
window.PAPERS = PAPERS;
window.COVERS = COVERS;
window.STATS = STATS;

// Helpers
window.getContributor  = (id) => CONTRIBUTORS.find(c => c.id === id) || CONTRIBUTORS[0];
window.getSubject      = (id) => SUBJECTS.find(s => s.id === id);
window.getPaper        = (id) => PAPERS.find(p => p.id === id) || PAPERS[0];
window.papersBySubject = (id) => PAPERS.filter(p => p.subject === id);


/* ====== src/shared.jsx ====== */
// Shared UI components — Caleb's Library, light editorial

const { useState, useEffect, useRef, useMemo } = React;

/* ============================================================
   Book Cover — signature visual
   ============================================================ */
function BookCover({ paper, size = "md", style = {}, onClick }) {
  const cover = COVERS[paper.cover % COVERS.length];
  const sub = getSubject(paper.subject);

  const sizes = {
    xs:  { w: 68,  fs: 8,   sub: 6.5, pad: 6 },
    sm:  { w: 92,  fs: 11,  sub: 8,   pad: 8 },
    md:  { w: 132, fs: 15,  sub: 10,  pad: 12 },
    lg:  { w: 180, fs: 20,  sub: 12,  pad: 16 },
    xl:  { w: 240, fs: 26,  sub: 14,  pad: 20 },
  };
  const s = sizes[size] || sizes.md;

  return (
    <div
      className="book-cover"
      onClick={onClick}
      style={{
        width: s.w,
        background: cover.bg,
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
    >
      <div style={{
        position: "absolute", inset: 0,
        padding: `${s.pad}px ${s.pad}px ${s.pad}px ${s.pad + 8}px`,
        display: "flex", flexDirection: "column",
        color: cover.ink,
      }}>
        <div style={{
          height: 1, background: cover.accent, opacity: 0.5,
          marginBottom: s.pad * 0.6,
        }} />

        <div style={{
          fontSize: s.sub,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          fontFamily: "var(--font-sans)",
          fontWeight: 600,
          color: cover.accent,
          opacity: 0.95,
        }}>
          {sub?.name || "Notes"}
        </div>

        <div style={{
          fontSize: s.fs,
          lineHeight: 1.15,
          fontWeight: 500,
          marginTop: s.pad * 0.5,
          fontFamily: "var(--font-sans)",
          letterSpacing: "-0.015em",
          textWrap: "balance",
          hyphens: "auto",
        }}>
          {paper.title}
        </div>

        <div style={{ flex: 1 }} />

        <div style={{
          height: 1, background: cover.accent, opacity: 0.5,
          marginBottom: s.pad * 0.5,
        }} />
        <div style={{
          fontSize: s.sub,
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.06em",
          opacity: 0.8,
        }}>
          {paper.year} · {paper.pages}pp
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Paper card
   ============================================================ */
function PaperCard({ paper, onClick, size = "md" }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex", flexDirection: "column", gap: 12,
        cursor: "pointer",
        transition: "transform var(--dur-fast)",
      }}
      onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
      onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
    >
      <BookCover paper={paper} size={size} />
      <div>
        <div style={{
          fontFamily: "var(--font-sans)",
          fontSize: 14.5,
          color: "var(--ink-100)",
          lineHeight: 1.3,
          fontWeight: 500,
          marginBottom: 4,
          letterSpacing: "-0.01em",
          textWrap: "balance",
        }}>{paper.title}</div>
        <div className="mono-meta" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span>{paper.type}</span>
          <span style={{ opacity: 0.4 }}>·</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
            <Icon.ArrowUp style={{ width: 11, height: 11 }} />
            {paper.upvotes}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Avatar (data.color-agnostic — always monochromatic)
   ============================================================ */
function Avatar({ user, size = 32 }) {
  if (!user) return null;
  return (
    <div
      className="avatar"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {user.initials}
    </div>
  );
}

/* ============================================================
   Section header
   ============================================================ */
function SectionHeader({ eyebrow, title, action, style = {} }) {
  return (
    <div style={{
      display: "flex", alignItems: "flex-end", justifyContent: "space-between",
      marginBottom: 24, gap: 16, ...style,
    }}>
      <div>
        {eyebrow && (
          <div className="smallcaps" style={{ marginBottom: 6 }}>
            {eyebrow}
          </div>
        )}
        <div style={{
          fontFamily: "var(--font-sans)",
          fontSize: 26,
          color: "var(--ink-100)",
          letterSpacing: "-0.02em",
          fontWeight: 500,
          lineHeight: 1.1,
        }}>{title}</div>
      </div>
      {action}
    </div>
  );
}

/* ============================================================
   PDF preview mock — light paper page
   ============================================================ */
function PDFPreview({ paper, height = 520 }) {
  return (
    <div style={{
      background: "#fdfaf3",
      borderRadius: 4,
      boxShadow: "0 20px 60px rgba(23,20,18,0.15), 0 4px 12px rgba(23,20,18,0.08)",
      border: "1px solid rgba(23,20,18,0.06)",
      overflow: "hidden",
      height,
      position: "relative",
    }}>
      <div style={{
        padding: "40px 44px",
        color: "var(--ink-100)",
        fontFamily: "var(--font-sans)",
        height: "100%",
        display: "flex", flexDirection: "column",
      }}>
        <div className="smallcaps" style={{ marginBottom: 32, fontSize: 10 }}>
          Caleb's Library · {getSubject(paper.subject)?.name}
        </div>
        <div style={{
          fontSize: 30, lineHeight: 1.1, marginBottom: 8, fontWeight: 500,
          letterSpacing: "-0.02em",
        }}>{paper.title}</div>
        <div style={{ fontSize: 14, color: "var(--ink-40)", marginBottom: 4 }}>
          {paper.subtitle}
        </div>
        <div className="mono" style={{ color: "var(--ink-30)", marginBottom: 24 }}>
          {paper.teacher} · {paper.year}
        </div>

        <div style={{ height: 1, background: "var(--rule-strong)", marginBottom: 24 }} />

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>1. Introduction</div>
          {[100, 92, 96, 88, 74].map((w, i) => (
            <div key={i} style={{
              height: 8, width: `${w}%`,
              background: "var(--ink-100)",
              opacity: 0.09, borderRadius: 2,
            }} />
          ))}
          <div style={{ height: 12 }} />
          {[95, 100, 91, 68].map((w, i) => (
            <div key={i} style={{
              height: 8, width: `${w}%`,
              background: "var(--ink-100)",
              opacity: 0.09, borderRadius: 2,
            }} />
          ))}
          <div style={{ height: 20 }} />
          <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>2. Core Concepts</div>
          {[100, 87, 93, 82, 96, 71].map((w, i) => (
            <div key={i} style={{
              height: 8, width: `${w}%`,
              background: "var(--ink-100)",
              opacity: 0.09, borderRadius: 2,
            }} />
          ))}
        </div>

        <div style={{ flex: 1 }} />
        <div style={{
          textAlign: "center",
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          color: "var(--ink-40)",
          borderTop: "1px solid var(--rule)",
          paddingTop: 12,
        }}>— 1 —</div>
      </div>
    </div>
  );
}

/* ============================================================
   Ornament
   ============================================================ */
function Ornament({ style = {} }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--ink-30)", ...style }}>
      <div style={{ flex: 1, height: 1, background: "currentColor", opacity: 0.4 }} />
      <div style={{ width: 4, height: 4, background: "currentColor", borderRadius: "50%" }} />
      <div style={{ flex: 1, height: 1, background: "currentColor", opacity: 0.4 }} />
    </div>
  );
}

/* ============================================================
   Stat
   ============================================================ */
function Stat({ value, label }) {
  return (
    <div>
      <div style={{
        fontFamily: "var(--font-sans)",
        fontSize: 32,
        color: "var(--ink-100)",
        letterSpacing: "-0.03em",
        lineHeight: 1,
        fontWeight: 500,
      }}>{value}</div>
      <div className="smallcaps" style={{ marginTop: 6, fontSize: 10 }}>{label}</div>
    </div>
  );
}

Object.assign(window, {
  BookCover, PaperCard, Avatar, SectionHeader, PDFPreview, Ornament, Stat,
});


/* ====== src/screens/Home.jsx ====== */
function HomeScreen({ navigate }) {
  const [q, setQ] = React.useState("");
  const recent = PAPERS.slice(0, 6);
  const loved = [...PAPERS].sort((a, b) => b.upvotes - a.upvotes).slice(0, 4);
  const founder = getContributor("caleb");

  return (
    <div>
      {/* Masthead */}
      <section style={{
        padding: "80px 32px 40px",
        textAlign: "center",
        maxWidth: 900,
        margin: "0 auto",
      }}>
        <div className="smallcaps" style={{ marginBottom: 24 }}>
          Est. 2019 · A community library
        </div>
        <h1 style={{
          fontFamily: "var(--font-serif)",
          fontSize: 120,
          lineHeight: 0.9,
          margin: 0,
          color: "var(--ink-100)",
          letterSpacing: "-0.04em",
          fontWeight: 500,
          fontStyle: "italic",
        }}>
          Caleb's <span style={{ fontStyle: "normal" }}>Library.</span>
        </h1>
        <p style={{
          fontSize: 18,
          lineHeight: 1.55,
          color: "var(--ink-70)",
          marginTop: 24,
          maxWidth: 620,
          margin: "24px auto 0",
          textWrap: "balance",
          letterSpacing: "-0.005em",
        }}>
          A student-run library of notes, papers, and study guides.
          Open to anyone. Kept by whoever shows up.
        </p>

        {/* Big search */}
        <div style={{
          maxWidth: 640,
          margin: "48px auto 0",
          position: "relative",
        }}>
          <Icon.Search style={{
            position: "absolute", left: 22, top: "50%",
            transform: "translateY(-50%)",
            width: 20, height: 20, color: "var(--ink-40)",
          }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") navigate("search", { query: q }); }}
            placeholder="Search for a class, subject, or paper title…"
            style={{
              width: "100%",
              background: "#ffffff",
              border: "1px solid var(--rule-strong)",
              borderRadius: 8,
              padding: "18px 22px 18px 56px",
              fontSize: 16,
              fontFamily: "inherit",
              color: "var(--ink-100)",
              outline: "none",
              transition: "border-color var(--dur-fast), box-shadow var(--dur-fast)",
              boxShadow: "0 1px 2px rgba(23,20,18,0.04)",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--ink-100)";
              e.currentTarget.style.boxShadow = "0 4px 16px rgba(23,20,18,0.08)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--rule-strong)";
              e.currentTarget.style.boxShadow = "0 1px 2px rgba(23,20,18,0.04)";
            }}
          />
          <div style={{
            position: "absolute",
            right: 8, top: "50%",
            transform: "translateY(-50%)",
            display: "flex", gap: 4,
          }}>
            <span style={{
              padding: "3px 8px",
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              color: "var(--ink-40)",
              background: "var(--paper-2)",
              border: "1px solid var(--rule)",
              borderRadius: 3,
            }}>Enter ↵</span>
          </div>
        </div>

        {/* Quick browse tags */}
        <div style={{ marginTop: 32, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: "var(--ink-40)", padding: "6px 0" }}>Or browse:</span>
          {SUBJECTS.slice(0, 8).map(s => (
            <button
              key={s.id}
              onClick={() => navigate("subject", { id: s.id })}
              style={{
                padding: "6px 14px",
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 500,
                color: "var(--ink-70)",
                background: "transparent",
                border: "1px solid var(--rule-strong)",
                transition: "all var(--dur-fast)",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--ink-100)"; e.currentTarget.style.color = "var(--paper)"; e.currentTarget.style.borderColor = "var(--ink-100)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--ink-70)"; e.currentTarget.style.borderColor = "var(--rule-strong)"; }}
            >{s.name}</button>
          ))}
          <button
            onClick={() => navigate("browse")}
            style={{
              padding: "6px 14px",
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 500,
              color: "var(--ink-100)",
              background: "transparent",
              border: "1px dashed var(--rule-strong)",
              display: "inline-flex", alignItems: "center", gap: 4,
            }}
          >
            All 12 subjects <Icon.ArrowRight style={{ width: 11, height: 11 }} />
          </button>
        </div>

        {/* Stats strip */}
        <div style={{
          marginTop: 64,
          paddingTop: 24,
          borderTop: "1px solid var(--rule)",
          display: "flex", justifyContent: "center", gap: 64,
        }}>
          <Stat value="3,247" label="Papers" />
          <Stat value="891" label="Contributors" />
          <Stat value="24.6k" label="Reads / month" />
          <Stat value="12" label="Subjects" />
        </div>
      </section>

      {/* Recent uploads */}
      <section style={{ maxWidth: "var(--max-content)", margin: "0 auto", padding: "80px 32px 0" }}>
        <SectionHeader
          eyebrow="This week"
          title="Recently added"
          action={
            <button className="btn-ghost" onClick={() => navigate("browse")}>
              View all <Icon.ArrowRight style={{ width: 12, height: 12 }} />
            </button>
          }
        />
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, 1fr)",
          gap: 24,
        }}>
          {recent.map(p => (
            <PaperCard key={p.id} paper={p} size="sm" onClick={() => navigate("paper", { id: p.id })} />
          ))}
        </div>
      </section>

      {/* Most loved */}
      <section style={{ maxWidth: "var(--max-content)", margin: "0 auto", padding: "80px 32px 0" }}>
        <SectionHeader
          eyebrow="All-time"
          title="Most loved by readers"
        />
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 24,
          border: "1px solid var(--rule)",
          borderRadius: 8,
          overflow: "hidden",
        }}>
          {loved.map((p, i) => (
            <LovedRow key={p.id} paper={p} rank={i + 1} onClick={() => navigate("paper", { id: p.id })} />
          ))}
        </div>
      </section>

      {/* How to contribute — one-line pitch, minimal */}
      <section style={{ maxWidth: 900, margin: "96px auto 0", padding: "0 32px" }}>
        <div style={{
          padding: "48px 40px",
          border: "1px solid var(--rule)",
          borderRadius: 8,
          background: "var(--bg-elevated)",
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: 32,
          alignItems: "center",
        }}>
          <div>
            <div className="smallcaps" style={{ marginBottom: 12 }}>Have notes to share?</div>
            <div style={{
              fontFamily: "var(--font-sans)",
              fontSize: 30,
              color: "var(--ink-100)",
              letterSpacing: "-0.02em",
              lineHeight: 1.15,
              fontWeight: 500,
              marginBottom: 8,
              textWrap: "balance",
            }}>
              Pass along the notes that carried you through.
            </div>
            <div style={{ color: "var(--ink-70)", fontSize: 14, lineHeight: 1.55, maxWidth: 520 }}>
              Upload a PDF, add a title, and it goes on the shelves once a moderator confirms it. No account. No signup. Two minutes.
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => navigate("upload")} style={{ padding: "14px 24px", fontSize: 14 }}>
            Contribute a paper <Icon.ArrowRight style={{ width: 14, height: 14 }} />
          </button>
        </div>
      </section>

      {/* Founder note */}
      <section style={{ maxWidth: 780, margin: "80px auto 0", padding: "0 32px" }}>
        <div style={{
          padding: "40px 8px",
          display: "grid",
          gridTemplateColumns: "auto 1fr",
          gap: 24,
        }}>
          <Avatar user={founder} size={56} />
          <div>
            <div style={{
              fontFamily: "var(--font-serif)",
              fontSize: 22,
              fontStyle: "italic",
              color: "var(--ink-100)",
              lineHeight: 1.45,
              letterSpacing: "-0.005em",
              textWrap: "balance",
            }}>
              “I started this as a shared drive with three friends in 2019.
              It grew because people kept adding things. That's the whole model —
              add what you can, take what you need.”
            </div>
            <div style={{ marginTop: 16, fontSize: 13, color: "var(--ink-40)" }}>
              <span style={{ color: "var(--ink-100)", fontWeight: 500 }}>Caleb H.</span> — founder, still uploading
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function LovedRow({ paper, rank, onClick }) {
  const contributor = getContributor(paper.contributor);
  return (
    <div
      onClick={onClick}
      style={{
        display: "grid",
        gridTemplateColumns: "48px 64px 1fr auto",
        gap: 20,
        padding: "24px 28px",
        cursor: "pointer",
        borderBottom: "1px solid var(--rule)",
        alignItems: "center",
        transition: "background var(--dur-fast)",
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = "var(--paper-2)"}
      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
    >
      <div style={{
        fontFamily: "var(--font-serif)",
        fontStyle: "italic",
        fontSize: 34,
        color: "var(--ink-30)",
        lineHeight: 1,
        letterSpacing: "-0.02em",
      }}>
        {String(rank).padStart(2, "0")}
      </div>
      <BookCover paper={paper} size="xs" />
      <div>
        <div style={{
          fontFamily: "var(--font-sans)",
          fontSize: 16,
          color: "var(--ink-100)",
          fontWeight: 500,
          letterSpacing: "-0.01em",
          marginBottom: 4,
        }}>{paper.title}</div>
        <div style={{ fontSize: 12, color: "var(--ink-40)" }}>
          {getSubject(paper.subject)?.name} · {paper.type} · {contributor?.name}
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{
          fontFamily: "var(--font-mono)",
          fontSize: 14,
          color: "var(--ink-100)",
          fontWeight: 500,
        }}>▲ {paper.upvotes}</div>
        <div className="mono-meta" style={{ fontSize: 10, marginTop: 2 }}>
          {(paper.downloads / 1000).toFixed(1)}k reads
        </div>
      </div>
    </div>
  );
}

window.HomeScreen = HomeScreen;


/* ====== src/screens/Browse.jsx ====== */
function BrowseScreen({ navigate }) {
  const [view, setView] = React.useState("shelf");
  const [activeSubject, setActiveSubject] = React.useState("all");
  const [activeType, setActiveType] = React.useState("all");

  const filtered = PAPERS.filter(p => {
    if (activeSubject !== "all" && p.subject !== activeSubject) return false;
    if (activeType !== "all" && p.type !== activeType) return false;
    return true;
  });

  const types = ["all", ...new Set(PAPERS.map(p => p.type))];

  return (
    <div style={{ maxWidth: "var(--max-content)", margin: "0 auto", padding: "48px 32px 0" }}>
      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <div className="smallcaps" style={{ marginBottom: 12 }}>The library</div>
        <h1 style={{
          fontFamily: "var(--font-sans)",
          fontSize: 44,
          margin: 0,
          color: "var(--ink-100)",
          letterSpacing: "-0.03em",
          fontWeight: 500,
          lineHeight: 1.05,
        }}>Everything, sorted by subject.</h1>
        <p style={{
          color: "var(--ink-70)",
          fontSize: 15,
          marginTop: 12,
          maxWidth: 620,
        }}>
          Hover a book to lift it. Click to open. Every paper was uploaded by someone
          who wanted the next reader to have an easier time.
        </p>
      </div>

      {/* Filter bar */}
      <div style={{
        display: "flex", alignItems: "center", gap: 16,
        marginBottom: 40,
        padding: "12px 16px",
        background: "var(--bg-elevated)",
        border: "1px solid var(--rule)",
        borderRadius: 6,
        flexWrap: "wrap",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--ink-40)", fontSize: 11 }}>
          <Icon.Filter style={{ width: 13, height: 13 }} />
          <span className="smallcaps" style={{ fontSize: 10 }}>Filter</span>
        </div>

        <FilterPills
          value={activeSubject}
          onChange={setActiveSubject}
          options={[{ id: "all", label: "All" }, ...SUBJECTS.slice(0, 8).map(s => ({ id: s.id, label: s.name }))]}
        />

        <div style={{ width: 1, height: 20, background: "var(--rule)" }} />

        <FilterPills
          value={activeType}
          onChange={setActiveType}
          options={types.map(t => ({ id: t, label: t === "all" ? "All types" : t }))}
        />

        <div style={{ flex: 1 }} />

        <div className="mono-meta">
          {filtered.length} paper{filtered.length !== 1 ? "s" : ""}
        </div>

        <div style={{
          display: "flex", gap: 2,
          background: "var(--paper-2)",
          padding: 3, borderRadius: 4,
        }}>
          <ViewToggleBtn active={view === "shelf"} onClick={() => setView("shelf")}>
            <Icon.Books style={{ width: 13, height: 13 }} /> Shelves
          </ViewToggleBtn>
          <ViewToggleBtn active={view === "grid"} onClick={() => setView("grid")}>
            <Icon.Grid style={{ width: 13, height: 13 }} /> Grid
          </ViewToggleBtn>
        </div>
      </div>

      {view === "shelf" ? (
        <ShelfView papers={filtered} navigate={navigate} />
      ) : (
        <GridView papers={filtered} navigate={navigate} />
      )}
    </div>
  );
}

function FilterPills({ value, onChange, options }) {
  return (
    <div style={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
      {options.map(opt => {
        const active = opt.id === value;
        return (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            style={{
              padding: "4px 10px",
              fontSize: 12,
              fontWeight: active ? 600 : 500,
              borderRadius: 3,
              background: active ? "var(--ink-100)" : "transparent",
              color: active ? "var(--paper)" : "var(--ink-70)",
              transition: "all var(--dur-fast)",
              whiteSpace: "nowrap",
            }}
          >{opt.label}</button>
        );
      })}
    </div>
  );
}

function ViewToggleBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "5px 10px",
        borderRadius: 3,
        background: active ? "#ffffff" : "transparent",
        color: active ? "var(--ink-100)" : "var(--ink-40)",
        fontSize: 12,
        fontWeight: 500,
        boxShadow: active ? "0 1px 2px rgba(23,20,18,0.08)" : "none",
        transition: "all var(--dur-fast)",
      }}
    >{children}</button>
  );
}

/* Shelves — light theme. Ink-toned wooden band replaced with a thin dark rule. */
function ShelfView({ papers, navigate }) {
  const bySubject = {};
  papers.forEach(p => {
    (bySubject[p.subject] = bySubject[p.subject] || []).push(p);
  });
  const subjectIds = Object.keys(bySubject);

  if (subjectIds.length === 0) {
    return (
      <div style={{
        padding: "80px 20px", textAlign: "center",
        color: "var(--ink-40)",
        border: "1px dashed var(--rule-strong)",
        borderRadius: 6,
      }}>
        <div style={{ fontSize: 22, color: "var(--ink-100)", marginBottom: 8, fontWeight: 500 }}>
          These shelves are empty
        </div>
        <div>Try loosening your filters.</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 56 }}>
      {subjectIds.map(sId => {
        const subj = getSubject(sId);
        const items = bySubject[sId];
        return (
          <div key={sId}>
            {/* Shelf label */}
            <div style={{
              display: "flex", alignItems: "flex-end", justifyContent: "space-between",
              marginBottom: 20,
              paddingBottom: 12,
              borderBottom: "1px solid var(--rule)",
            }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                <div style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: 24,
                  color: "var(--ink-100)",
                  fontWeight: 500,
                  letterSpacing: "-0.02em",
                }}>{subj.name}</div>
                <div className="mono-meta">{items.length} on the shelf</div>
              </div>
              <button className="btn-ghost" onClick={() => navigate("subject", { id: sId })} style={{ fontSize: 12 }}>
                Open department <Icon.ArrowRight style={{ width: 12, height: 12 }} />
              </button>
            </div>

            {/* Shelf */}
            <div style={{ position: "relative", padding: "16px 8px 0" }}>
              <div style={{
                display: "flex", gap: 20, flexWrap: "wrap",
                paddingBottom: 20,
                position: "relative", zIndex: 2,
              }}>
                {items.map(p => (
                  <div key={p.id} style={{ display: "flex", flexDirection: "column", gap: 8, width: 132 }}>
                    <BookCover paper={p} size="md" onClick={() => navigate("paper", { id: p.id })} />
                  </div>
                ))}
              </div>
              {/* Neutral ink shelf */}
              <div style={{
                height: 4,
                background: "var(--ink-100)",
                borderRadius: 1,
                boxShadow: "0 8px 20px rgba(23,20,18,0.14)",
                position: "relative",
              }} />
              <div style={{
                height: 24,
                background: "linear-gradient(180deg, rgba(23,20,18,0.10), transparent)",
                filter: "blur(4px)",
                marginTop: -2,
              }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function GridView({ papers, navigate }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(6, 1fr)",
      gap: 32,
    }}>
      {papers.map(p => (
        <PaperCard key={p.id} paper={p} size="sm" onClick={() => navigate("paper", { id: p.id })} />
      ))}
    </div>
  );
}

window.BrowseScreen = BrowseScreen;


/* ====== src/screens/Search.jsx ====== */
function SearchScreen({ navigate, route }) {
  const initialQ = route.query || "photosynthesis";
  const [q, setQ] = React.useState(initialQ);
  const [sort, setSort] = React.useState("relevant");
  const [selectedSubjects, setSelectedSubjects] = React.useState(new Set());
  const [selectedTypes, setSelectedTypes] = React.useState(new Set());
  const [yearRange, setYearRange] = React.useState([2024, 2026]);

  const filtered = PAPERS.filter(p => {
    if (selectedSubjects.size && !selectedSubjects.has(p.subject)) return false;
    if (selectedTypes.size && !selectedTypes.has(p.type)) return false;
    if (p.year < yearRange[0] || p.year > yearRange[1]) return false;
    return true;
  });
  const results = filtered.slice(0, 12);

  const toggleSet = (setter, val) => setter(prev => {
    const s = new Set(prev);
    s.has(val) ? s.delete(val) : s.add(val);
    return s;
  });

  return (
    <div style={{ maxWidth: "var(--max-content)", margin: "0 auto", padding: "48px 32px 0" }}>
      {/* Big query header */}
      <div style={{ marginBottom: 32 }}>
        <div className="smallcaps" style={{ marginBottom: 12 }}>Search</div>
        <div style={{ position: "relative", maxWidth: 780 }}>
          <input
            className="input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{
              fontSize: 28,
              padding: "16px 20px 16px 56px",
              background: "#ffffff",
              borderColor: "var(--rule-strong)",
              letterSpacing: "-0.02em",
              fontWeight: 500,
            }}
          />
          <Icon.Search style={{
            position: "absolute", left: 20, top: "50%", transform: "translateY(-50%)",
            width: 20, height: 20, color: "var(--ink-40)",
          }} />
        </div>
        <div style={{ marginTop: 14, color: "var(--ink-70)", fontSize: 14 }}>
          <span style={{ color: "var(--ink-100)", fontWeight: 500 }}>{results.length}</span> results for
          <span style={{ color: "var(--ink-100)", fontWeight: 500, marginLeft: 6 }}>"{q}"</span>
        </div>
      </div>

      {/* 2-col */}
      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 40 }}>
        {/* Facets */}
        <aside>
          <FacetGroup title="Subject">
            {SUBJECTS.slice(0, 8).map(s => (
              <FacetCheckbox
                key={s.id}
                checked={selectedSubjects.has(s.id)}
                onChange={() => toggleSet(setSelectedSubjects, s.id)}
                label={s.name}
                count={s.count}
              />
            ))}
          </FacetGroup>

          <FacetGroup title="Type">
            {["Study Guide", "Lecture Notes", "Past Exam", "Problem Set", "Essay", "Cheat Sheet"].map(t => (
              <FacetCheckbox
                key={t}
                checked={selectedTypes.has(t)}
                onChange={() => toggleSet(setSelectedTypes, t)}
                label={t}
                count={PAPERS.filter(p => p.type === t).length}
              />
            ))}
          </FacetGroup>

          <FacetGroup title="Year">
            <div style={{ padding: "8px 4px" }}>
              <div style={{
                display: "flex", justifyContent: "space-between",
                fontFamily: "var(--font-mono)", fontSize: 12,
                color: "var(--ink-100)",
                marginBottom: 8,
              }}>
                <span>{yearRange[0]}</span>
                <span style={{ color: "var(--ink-30)" }}>→</span>
                <span>{yearRange[1]}</span>
              </div>
              <input type="range" min="2020" max="2026" value={yearRange[0]}
                onChange={(e) => setYearRange([+e.target.value, yearRange[1]])}
                style={{ width: "100%", accentColor: "var(--ink-100)" }} />
              <input type="range" min="2020" max="2026" value={yearRange[1]}
                onChange={(e) => setYearRange([yearRange[0], +e.target.value])}
                style={{ width: "100%", accentColor: "var(--ink-100)" }} />
            </div>
          </FacetGroup>

          <button
            onClick={() => { setSelectedSubjects(new Set()); setSelectedTypes(new Set()); setYearRange([2020, 2026]); }}
            style={{
              marginTop: 12,
              width: "100%",
              padding: "10px 12px",
              fontSize: 12,
              color: "var(--ink-70)",
              borderRadius: 4,
              border: "1px solid var(--rule)",
              background: "transparent",
              transition: "all var(--dur-fast)",
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--ink-100)"}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = ""}
          >
            Reset all filters
          </button>
        </aside>

        {/* Results */}
        <main>
          <div style={{
            display: "flex", alignItems: "center", gap: 20,
            paddingBottom: 16,
            borderBottom: "1px solid var(--rule)",
            marginBottom: 8,
          }}>
            <span className="smallcaps" style={{ fontSize: 10 }}>Sort by</span>
            {[
              { id: "relevant",  label: "Most relevant" },
              { id: "recent",    label: "Newest" },
              { id: "popular",   label: "Most upvoted" },
              { id: "downloads", label: "Most downloaded" },
            ].map(o => (
              <button
                key={o.id}
                onClick={() => setSort(o.id)}
                style={{
                  fontSize: 12.5,
                  padding: "4px 0",
                  color: sort === o.id ? "var(--ink-100)" : "var(--ink-40)",
                  fontWeight: sort === o.id ? 600 : 500,
                  borderBottom: `1.5px solid ${sort === o.id ? "var(--ink-100)" : "transparent"}`,
                }}
              >{o.label}</button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            {results.map(p => (
              <SearchResultRow key={p.id} paper={p} q={q} onClick={() => navigate("paper", { id: p.id })} />
            ))}
          </div>

          <div style={{
            display: "flex", justifyContent: "center", gap: 4,
            marginTop: 40, paddingTop: 24,
            borderTop: "1px solid var(--rule)",
          }}>
            {[1,2,3,4,5].map(n => (
              <button key={n} style={{
                width: 32, height: 32, fontSize: 13,
                borderRadius: 3,
                background: n === 1 ? "var(--ink-100)" : "transparent",
                color: n === 1 ? "var(--paper)" : "var(--ink-40)",
                fontFamily: "var(--font-mono)",
                fontWeight: 500,
              }}>{n}</button>
            ))}
            <span style={{ padding: 6, color: "var(--ink-30)" }}>…</span>
            <button style={{
              width: 32, height: 32, fontSize: 13, borderRadius: 3,
              color: "var(--ink-40)", fontFamily: "var(--font-mono)",
            }}>27</button>
          </div>
        </main>
      </div>
    </div>
  );
}

function FacetGroup({ title, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div className="smallcaps" style={{
        color: "var(--ink-100)",
        marginBottom: 10,
        fontSize: 10.5,
        paddingBottom: 8,
        borderBottom: "1px solid var(--rule)",
      }}>{title}</div>
      <div style={{ display: "flex", flexDirection: "column" }}>{children}</div>
    </div>
  );
}

function FacetCheckbox({ label, count, checked, onChange }) {
  return (
    <label style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "6px 2px",
      cursor: "pointer",
      color: "var(--ink-70)",
      fontSize: 13,
      transition: "color var(--dur-fast)",
    }}
    onMouseEnter={(e) => e.currentTarget.style.color = "var(--ink-100)"}
    onMouseLeave={(e) => e.currentTarget.style.color = ""}
    >
      <div style={{
        width: 14, height: 14,
        border: `1.5px solid ${checked ? "var(--ink-100)" : "var(--ink-30)"}`,
        borderRadius: 2,
        background: checked ? "var(--ink-100)" : "transparent",
        display: "grid", placeItems: "center",
        flexShrink: 0,
      }}>
        {checked && <Icon.Check style={{ width: 10, height: 10, color: "var(--paper)" }} />}
      </div>
      <input type="checkbox" checked={!!checked} onChange={onChange || (() => {})} style={{ display: "none" }} />
      <span style={{ flex: 1 }}>{label}</span>
      <span className="mono" style={{ color: "var(--ink-30)", fontSize: 10 }}>{count}</span>
    </label>
  );
}

function SearchResultRow({ paper, q, onClick }) {
  const subj = getSubject(paper.subject);
  const contributor = getContributor(paper.contributor);

  const highlightMatch = (text, query) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return parts.map((p, i) => p.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} style={{ background: "var(--ink-100)", color: "var(--paper)", padding: "0 3px", borderRadius: 2 }}>{p}</mark>
    ) : p);
  };

  return (
    <div
      onClick={onClick}
      style={{
        display: "grid",
        gridTemplateColumns: "80px 1fr auto",
        gap: 24,
        padding: "24px 16px",
        borderBottom: "1px solid var(--rule)",
        cursor: "pointer",
        alignItems: "flex-start",
        transition: "background var(--dur-fast)",
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = "var(--paper-2)"}
      onMouseLeave={(e) => e.currentTarget.style.background = ""}
    >
      <BookCover paper={paper} size="xs" />

      <div>
        <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
          <span className="tag">{subj?.name}</span>
          <span className="tag tag-paper">{paper.type}</span>
        </div>
        <div style={{
          fontFamily: "var(--font-sans)",
          fontSize: 20,
          color: "var(--ink-100)",
          fontWeight: 500,
          letterSpacing: "-0.02em",
          lineHeight: 1.25,
          marginBottom: 4,
        }}>
          {highlightMatch(paper.title, q)}
        </div>
        <div style={{ color: "var(--ink-70)", fontSize: 13, marginBottom: 10 }}>
          {paper.subtitle} · {paper.teacher}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12, color: "var(--ink-40)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Avatar user={contributor} size={18} />
            <span>{contributor?.name}</span>
          </div>
          <span>·</span>
          <span>{paper.year}</span>
          <span>·</span>
          <span>{paper.pages} pages</span>
        </div>
      </div>

      <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "4px 10px",
          background: "var(--paper-2)",
          border: "1px solid var(--rule)",
          borderRadius: 3,
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          color: "var(--ink-100)",
          fontWeight: 500,
        }}>
          <Icon.ArrowUp style={{ width: 11, height: 11 }} />
          {paper.upvotes}
        </div>
        <div className="mono-meta">{paper.downloads.toLocaleString()} reads</div>
      </div>
    </div>
  );
}

window.SearchScreen = SearchScreen;


/* ====== src/screens/Subject.jsx ====== */
function SubjectScreen({ navigate, route }) {
  const id = route.id || "biology";
  const subject = getSubject(id) || SUBJECTS[0];
  const papers = papersBySubject(subject.id);
  const contributors = [...new Set(papers.map(p => p.contributor))].map(getContributor);
  const featured = papers.slice(0, 4);
  const rest = papers.slice(4);

  return (
    <div>
      {/* Subject hero — monochromatic band */}
      <div style={{
        background: "var(--paper-2)",
        borderBottom: "1px solid var(--rule)",
        padding: "64px 32px 48px",
      }}>
        <div style={{ maxWidth: "var(--max-content)", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--ink-40)", marginBottom: 20 }}>
            <span style={{ cursor: "pointer" }} onClick={() => navigate("home")}>Library</span>
            <Icon.Chevron style={{ width: 10, height: 10 }} />
            <span style={{ cursor: "pointer" }} onClick={() => navigate("browse")}>All subjects</span>
            <Icon.Chevron style={{ width: 10, height: 10 }} />
            <span style={{ color: "var(--ink-100)" }}>{subject.name}</span>
          </div>

          <div className="smallcaps" style={{ marginBottom: 12 }}>Department</div>
          <h1 style={{
            fontFamily: "var(--font-sans)",
            fontSize: 68,
            lineHeight: 1,
            margin: 0,
            color: "var(--ink-100)",
            letterSpacing: "-0.035em",
            fontWeight: 500,
          }}>{subject.name}</h1>
          <div style={{
            display: "flex", gap: 40, marginTop: 32,
            color: "var(--ink-70)",
            fontSize: 13,
          }}>
            <div>
              <span style={{ fontSize: 22, color: "var(--ink-100)", fontWeight: 500, marginRight: 8, letterSpacing: "-0.02em" }}>{subject.count}</span>
              <span className="smallcaps" style={{ fontSize: 10 }}>Papers</span>
            </div>
            <div>
              <span style={{ fontSize: 22, color: "var(--ink-100)", fontWeight: 500, marginRight: 8, letterSpacing: "-0.02em" }}>{contributors.length}</span>
              <span className="smallcaps" style={{ fontSize: 10 }}>Contributors</span>
            </div>
            <div>
              <span style={{ fontSize: 22, color: "var(--ink-100)", fontWeight: 500, marginRight: 8, letterSpacing: "-0.02em" }}>14</span>
              <span className="smallcaps" style={{ fontSize: 10 }}>Courses</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "var(--max-content)", margin: "0 auto", padding: "48px 32px 0" }}>
        <SectionHeader eyebrow="Curated by moderators" title="This term's essentials" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 32, marginBottom: 64 }}>
          {featured.map(p => (
            <PaperCard key={p.id} paper={p} size="md" onClick={() => navigate("paper", { id: p.id })} />
          ))}
        </div>

        <SectionHeader eyebrow="Browse by course" title="Every course, every paper" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, marginBottom: 64 }}>
          {[
            `${subject.name.slice(0,3).toUpperCase()} 101 — Introduction`,
            `${subject.name.slice(0,3).toUpperCase()} 201 — Foundations`,
            `${subject.name.slice(0,3).toUpperCase()} 210 — Applied Studies`,
            `${subject.name.slice(0,3).toUpperCase()} 302 — Advanced Topics`,
            `${subject.name.slice(0,3).toUpperCase()} 340 — Seminar`,
            `${subject.name.slice(0,3).toUpperCase()} 401 — Independent Study`,
          ].map((c, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 16,
              padding: "16px 20px",
              border: "1px solid var(--rule)",
              borderRadius: 4,
              cursor: "pointer",
              transition: "all var(--dur-fast)",
              background: "var(--bg-elevated)",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--ink-100)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = ""; }}
            >
              <div style={{
                width: 3, height: 20, background: "var(--ink-100)",
              }} />
              <div style={{ flex: 1, fontSize: 15, color: "var(--ink-100)", fontWeight: 500 }}>
                {c}
              </div>
              <div className="mono-meta">{20 + i * 7} papers</div>
              <Icon.ArrowRight style={{ width: 14, height: 14, color: "var(--ink-40)" }} />
            </div>
          ))}
        </div>

        <SectionHeader eyebrow={`${papers.length} in the collection`} title="All papers" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 24 }}>
          {(rest.length > 0 ? rest : featured).map(p => (
            <PaperCard key={p.id} paper={p} size="sm" onClick={() => navigate("paper", { id: p.id })} />
          ))}
        </div>

        <SectionHeader eyebrow="Top contributors" title="The people behind these papers" style={{ marginTop: 64 }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {contributors.slice(0, 4).map(c => c && (
            <div key={c.id} onClick={() => navigate("profile", { id: c.id })}
              style={{
                padding: 20,
                border: "1px solid var(--rule)",
                borderRadius: 6,
                display: "flex", alignItems: "center", gap: 14,
                cursor: "pointer",
                transition: "all var(--dur-fast)",
                background: "var(--bg-elevated)",
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--ink-100)"}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = ""}
            >
              <Avatar user={c} size={44} />
              <div>
                <div style={{ color: "var(--ink-100)", fontWeight: 500, fontSize: 15 }}>{c.name}</div>
                <div className="mono-meta" style={{ marginTop: 2 }}>{c.uploads} contributions</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
window.SubjectScreen = SubjectScreen;


/* ====== src/screens/PaperDetail.jsx ====== */
function PaperDetailScreen({ navigate, route }) {
  const paper = getPaper(route.id) || PAPERS[0];
  const contributor = getContributor(paper.contributor);
  const subject = getSubject(paper.subject);
  const [tab, setTab] = React.useState("preview");
  const [voted, setVoted] = React.useState(0);
  const [saved, setSaved] = React.useState(false);

  const related = PAPERS.filter(p => p.subject === paper.subject && p.id !== paper.id).slice(0, 4);

  const citations = {
    APA:     `${contributor?.name}. (${paper.year}). ${paper.title}: ${paper.subtitle}. Caleb's Library.`,
    MLA:     `${contributor?.name}. "${paper.title}." ${paper.subtitle}, Caleb's Library, ${paper.year}.`,
    Chicago: `${contributor?.name}. "${paper.title}." ${paper.subtitle}. Caleb's Library, ${paper.year}.`,
    BibTeX:  `@misc{${paper.id},\n  author = {${contributor?.name}},\n  title  = {${paper.title}},\n  year   = {${paper.year}},\n  note   = {${paper.subtitle}},\n  url    = {calebslibrary.org/paper/${paper.id}}\n}`,
  };

  return (
    <div style={{ maxWidth: "var(--max-content)", margin: "0 auto", padding: "40px 32px 0" }}>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--ink-40)", marginBottom: 24 }}>
        <span style={{ cursor: "pointer" }} onClick={() => navigate("browse")}>Library</span>
        <Icon.Chevron style={{ width: 10, height: 10 }} />
        <span style={{ cursor: "pointer" }} onClick={() => navigate("subject", { id: paper.subject })}>{subject?.name}</span>
        <Icon.Chevron style={{ width: 10, height: 10 }} />
        <span style={{ color: "var(--ink-100)" }}>{paper.type}</span>
      </div>

      {/* Header */}
      <div style={{ display: "grid", gridTemplateColumns: "180px 1fr auto", gap: 40, marginBottom: 40 }}>
        <BookCover paper={paper} size="lg" />
        <div>
          <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
            <span className="tag">{subject?.name}</span>
            <span className="tag tag-paper">{paper.type}</span>
            <span className="tag tag-paper">{paper.year}</span>
          </div>
          <h1 style={{
            fontFamily: "var(--font-sans)",
            fontSize: 44,
            lineHeight: 1.05,
            margin: 0,
            letterSpacing: "-0.03em",
            color: "var(--ink-100)",
            fontWeight: 500,
            textWrap: "balance",
          }}>{paper.title}</h1>
          <div style={{ fontSize: 17, color: "var(--ink-70)", marginTop: 8 }}>
            {paper.subtitle}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 24, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => navigate("profile", { id: contributor.id })}>
              <Avatar user={contributor} size={32} />
              <div>
                <div style={{ fontSize: 13, color: "var(--ink-100)", fontWeight: 500 }}>{contributor?.name}</div>
                <div className="mono-meta">{contributor?.uploads} contributions</div>
              </div>
            </div>
            <div style={{ width: 1, height: 24, background: "var(--rule)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--ink-70)" }}>
              <Icon.File style={{ width: 14, height: 14 }} /> {paper.pages} pages · PDF
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--ink-70)" }}>
              <Icon.Eye style={{ width: 14, height: 14 }} /> {paper.views.toLocaleString()}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--ink-70)" }}>
              <Icon.Clock style={{ width: 14, height: 14 }} /> Uploaded 3 weeks ago
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 220 }}>
          <button className="btn btn-primary" style={{ padding: "12px 20px", justifyContent: "center" }}>
            <Icon.Download style={{ width: 16, height: 16 }} />
            Download PDF
          </button>
          <div style={{ display: "flex", gap: 6 }}>
            <button className="btn btn-secondary" style={{ flex: 1, justifyContent: "center", padding: "10px" }} onClick={() => setSaved(!saved)}>
              <Icon.Bookmark style={{ width: 15, height: 15, fill: saved ? "var(--ink-100)" : "none" }} />
              {saved ? "Saved" : "Save"}
            </button>
            <button className="btn btn-secondary" style={{ flex: 1, justifyContent: "center", padding: "10px" }}>
              <Icon.Share style={{ width: 15, height: 15 }} /> Share
            </button>
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: 2,
            border: "1px solid var(--rule-strong)",
            borderRadius: 4,
            padding: 4,
            marginTop: 4,
          }}>
            <button
              onClick={() => setVoted(voted === 1 ? 0 : 1)}
              style={{
                flex: 1, padding: 8,
                borderRadius: 3,
                background: voted === 1 ? "var(--ink-100)" : "transparent",
                color: voted === 1 ? "var(--paper)" : "var(--ink-70)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 500,
              }}
            >
              <Icon.ArrowUp style={{ width: 14, height: 14 }} />
              {paper.upvotes + (voted === 1 ? 1 : 0)}
            </button>
            <div style={{ width: 1, height: 20, background: "var(--rule)" }} />
            <button
              onClick={() => setVoted(voted === -1 ? 0 : -1)}
              style={{
                padding: 8, width: 40,
                borderRadius: 3,
                background: voted === -1 ? "var(--ink-100)" : "transparent",
                color: voted === -1 ? "var(--paper)" : "var(--ink-70)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <Icon.ArrowDown style={{ width: 14, height: 14 }} />
            </button>
          </div>
          <button className="btn-ghost" style={{ fontSize: 12, padding: "6px", justifyContent: "center", display: "flex", alignItems: "center", gap: 6 }}>
            <Icon.Flag style={{ width: 12, height: 12 }} /> Report an issue
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 40 }}>
        <div>
          <div style={{
            display: "flex", gap: 4,
            borderBottom: "1px solid var(--rule)",
            marginBottom: 24,
          }}>
            {[
              { id: "preview",   label: "Preview" },
              { id: "citation",  label: "Citation" },
              { id: "comments",  label: "Discussion (14)" },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{
                  padding: "12px 16px",
                  fontSize: 14,
                  fontWeight: 500,
                  color: tab === t.id ? "var(--ink-100)" : "var(--ink-40)",
                  borderBottom: `2px solid ${tab === t.id ? "var(--ink-100)" : "transparent"}`,
                  marginBottom: -1,
                }}
              >{t.label}</button>
            ))}
          </div>

          {tab === "preview" && (
            <div>
              <div style={{
                background: "var(--paper-2)",
                border: "1px solid var(--rule)",
                borderRadius: 6,
                padding: 32,
                position: "relative",
              }}>
                <PDFPreview paper={paper} height={720} />
                <div style={{
                  position: "absolute", bottom: 32, left: 0, right: 0,
                  display: "flex", justifyContent: "center", gap: 12,
                }}>
                  <div style={{
                    background: "rgba(23,20,18,0.92)",
                    backdropFilter: "blur(6px)",
                    padding: "8px 14px",
                    borderRadius: 999,
                    display: "flex", alignItems: "center", gap: 14,
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    color: "var(--paper)",
                  }}>
                    <button style={{ opacity: 0.5, color: "var(--paper)" }}><Icon.ArrowLeft style={{ width: 14, height: 14 }} /></button>
                    <span>Page 1 of {paper.pages}</span>
                    <button style={{ color: "var(--paper)" }}><Icon.ArrowRight style={{ width: 14, height: 14 }} /></button>
                  </div>
                </div>
              </div>
              <div style={{ textAlign: "center", marginTop: 20, fontSize: 12, color: "var(--ink-40)" }}>
                Scroll to preview more pages · Download for the full document
              </div>
            </div>
          )}

          {tab === "citation" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {Object.entries(citations).map(([style, text]) => (
                <div key={style} style={{
                  border: "1px solid var(--rule)",
                  borderRadius: 6,
                  padding: 20,
                  background: "var(--bg-elevated)",
                }}>
                  <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    marginBottom: 12,
                  }}>
                    <div className="smallcaps">{style}</div>
                    <button className="btn-ghost" style={{ fontSize: 12, padding: "4px 10px" }}>Copy</button>
                  </div>
                  <div style={{
                    fontFamily: style === "BibTeX" ? "var(--font-mono)" : "var(--font-sans)",
                    fontSize: style === "BibTeX" ? 12 : 14,
                    color: "var(--ink-100)",
                    lineHeight: 1.6,
                    whiteSpace: "pre-wrap",
                  }}>{text}</div>
                </div>
              ))}
            </div>
          )}

          {tab === "comments" && (
            <div>
              <div style={{
                display: "flex", gap: 12, marginBottom: 24,
                padding: 16,
                border: "1px solid var(--rule)",
                borderRadius: 6,
                background: "var(--bg-elevated)",
              }}>
                <Avatar user={CONTRIBUTORS[0]} size={32} />
                <div style={{ flex: 1 }}>
                  <textarea
                    placeholder="Add to the discussion. Anyone can comment; a name is nice but not required."
                    style={{
                      width: "100%", background: "transparent",
                      border: "none", outline: "none",
                      color: "var(--ink-100)", fontFamily: "inherit",
                      fontSize: 14, lineHeight: 1.55, resize: "vertical", minHeight: 60,
                    }}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                    <input placeholder="Your name (optional)" style={{
                      background: "transparent", border: "none", outline: "none",
                      fontFamily: "inherit", fontSize: 12, color: "var(--ink-70)", padding: 4,
                    }} />
                    <button className="btn btn-primary" style={{ fontSize: 13, padding: "6px 14px" }}>Post</button>
                  </div>
                </div>
              </div>

              {[
                { u: 1, t: "2 days ago", body: "This absolutely saved me for the midterm. The diagram on page 12 is worth the download alone." },
                { u: 5, t: "1 week ago", body: "Small correction — the enzyme name on page 8 should be RuBisCO (with a lowercase b). Otherwise, phenomenal work.", replies: 2 },
                { u: 3, t: "3 weeks ago", body: "Requested access for our class group. Prof. Halloway referenced these notes explicitly last lecture." },
              ].map((c, i) => (
                <div key={i} style={{ display: "flex", gap: 12, padding: "16px 4px", borderBottom: "1px solid var(--rule)" }}>
                  <Avatar user={CONTRIBUTORS[c.u]} size={32} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 13, color: "var(--ink-100)", fontWeight: 500 }}>{CONTRIBUTORS[c.u].name}</span>
                      <span className="mono-meta">{c.t}</span>
                    </div>
                    <div style={{ color: "var(--ink-70)", fontSize: 14, lineHeight: 1.55 }}>{c.body}</div>
                    <div style={{ display: "flex", gap: 16, marginTop: 10, fontSize: 12, color: "var(--ink-40)" }}>
                      <button style={{ display: "flex", alignItems: "center", gap: 4 }}><Icon.ArrowUp style={{ width: 11, height: 11 }} />{12 - i * 3}</button>
                      <button>Reply</button>
                      {c.replies && <span>{c.replies} replies</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside>
          <div style={{
            border: "1px solid var(--rule)",
            borderRadius: 6,
            padding: 20,
            marginBottom: 24,
            background: "var(--bg-elevated)",
          }}>
            <div className="smallcaps" style={{ marginBottom: 14 }}>Details</div>
            {[
              ["Course", `${paper.subject.slice(0,3).toUpperCase()} 302`],
              ["Professor", paper.teacher],
              ["Semester", `Fall ${paper.year}`],
              ["Language", "English"],
              ["License", "CC BY-NC 4.0"],
              ["Size", `${(paper.pages * 0.08).toFixed(1)} MB`],
            ].map(([k, v]) => (
              <div key={k} style={{
                display: "flex", justifyContent: "space-between",
                padding: "8px 0",
                fontSize: 13,
                borderBottom: "1px solid var(--rule)",
              }}>
                <span style={{ color: "var(--ink-40)" }}>{k}</span>
                <span style={{ color: "var(--ink-100)", fontFamily: "var(--font-mono)", fontSize: 12 }}>{v}</span>
              </div>
            ))}
          </div>

          <div className="smallcaps" style={{ marginBottom: 14 }}>Related</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {related.map(p => (
              <div key={p.id} onClick={() => navigate("paper", { id: p.id })} style={{
                display: "flex", gap: 10,
                padding: 10,
                borderRadius: 4,
                cursor: "pointer",
                transition: "background var(--dur-fast)",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--paper-2)"}
              onMouseLeave={(e) => e.currentTarget.style.background = ""}
              >
                <BookCover paper={p} size="xs" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13,
                    color: "var(--ink-100)",
                    fontWeight: 500,
                    lineHeight: 1.3,
                    letterSpacing: "-0.005em",
                    marginBottom: 4,
                  }}>{p.title}</div>
                  <div className="mono-meta">{p.type} · ▲{p.upvotes}</div>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
window.PaperDetailScreen = PaperDetailScreen;


/* ====== src/screens/Upload.jsx ====== */
function UploadScreen({ navigate }) {
  const [step, setStep] = React.useState(1);
  const [file, setFile] = React.useState(null);
  const [dragging, setDragging] = React.useState(false);
  const [form, setForm] = React.useState({
    contributorName: "",
    contributorEmail: "",
    title: "",
    subject: "",
    type: "Study Guide",
    course: "",
    professor: "",
    year: 2026,
    description: "",
  });

  return (
    <div style={{ maxWidth: 780, margin: "0 auto", padding: "48px 32px 0" }}>
      <div style={{ marginBottom: 40 }}>
        <div className="smallcaps" style={{ marginBottom: 12 }}>Contribute</div>
        <h1 style={{
          fontFamily: "var(--font-sans)",
          fontSize: 44,
          margin: 0,
          color: "var(--ink-100)",
          letterSpacing: "-0.03em",
          lineHeight: 1.05,
          fontWeight: 500,
        }}>Add to the library.</h1>
        <p style={{ color: "var(--ink-70)", fontSize: 15, marginTop: 12, maxWidth: 560, lineHeight: 1.55 }}>
          Your notes carried you through the semester. Pass them along.
          <span style={{ color: "var(--ink-100)" }}> No account required</span> — just tell us who you are so we can credit you, and a moderator will review before it goes live.
        </p>
      </div>

      {/* Stepper */}
      <div style={{
        display: "flex", alignItems: "center",
        marginBottom: 40,
        padding: "20px 24px",
        background: "var(--bg-elevated)",
        border: "1px solid var(--rule)",
        borderRadius: 6,
      }}>
        {[
          { n: 1, t: "Upload file" },
          { n: 2, t: "Your details" },
          { n: 3, t: "Review & submit" },
        ].map((s, i) => (
          <React.Fragment key={s.n}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 26, height: 26,
                borderRadius: "50%",
                display: "grid", placeItems: "center",
                background: step >= s.n ? "var(--ink-100)" : "transparent",
                border: `1.5px solid ${step >= s.n ? "var(--ink-100)" : "var(--ink-30)"}`,
                color: step >= s.n ? "var(--paper)" : "var(--ink-40)",
                fontSize: 13, fontWeight: 600,
              }}>
                {step > s.n ? <Icon.Check style={{ width: 12, height: 12 }} /> : s.n}
              </div>
              <div>
                <div className="smallcaps" style={{ fontSize: 9 }}>Step {s.n}</div>
                <div style={{
                  fontSize: 13.5,
                  color: step >= s.n ? "var(--ink-100)" : "var(--ink-40)",
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                }}>{s.t}</div>
              </div>
            </div>
            {i < 2 && <div style={{ flex: 1, height: 1, background: step > s.n ? "var(--ink-100)" : "var(--rule)", margin: "0 20px", transition: "background var(--dur-med)" }} />}
          </React.Fragment>
        ))}
      </div>

      {step === 1 && (
        <div>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const f = e.dataTransfer.files[0];
              if (f) setFile({ name: f.name, size: f.size });
            }}
            onClick={() => setFile({ name: "photosynthesis-c4-notes.pdf", size: 1_240_000 })}
            style={{
              border: `2px dashed ${dragging ? "var(--ink-100)" : "var(--rule-strong)"}`,
              borderRadius: 8,
              padding: "72px 32px",
              textAlign: "center",
              background: dragging ? "var(--paper-2)" : "var(--bg-elevated)",
              transition: "all var(--dur-fast)",
              cursor: "pointer",
            }}
          >
            <div style={{
              width: 56, height: 56,
              margin: "0 auto 20px",
              display: "grid", placeItems: "center",
              background: "var(--paper-2)",
              borderRadius: "50%",
              color: "var(--ink-100)",
            }}>
              <Icon.Upload style={{ width: 22, height: 22 }} />
            </div>
            <div style={{
              fontSize: 26,
              color: "var(--ink-100)",
              fontWeight: 500,
              marginBottom: 8,
              letterSpacing: "-0.02em",
            }}>
              {file ? "One file, ready to catalog." : "Drop a file to begin."}
            </div>
            <div style={{ color: "var(--ink-70)", marginBottom: 20, fontSize: 14 }}>
              {file
                ? "Continue below to add details, or drop another file."
                : "PDF, DOCX, PPTX, or images. Up to 25 MB per file."}
            </div>
            {!file && (
              <button className="btn btn-primary" style={{ padding: "12px 24px" }}>
                Choose a file
              </button>
            )}
          </div>

          {file && (
            <div style={{
              marginTop: 20,
              padding: 16,
              border: "1px solid var(--rule)",
              borderRadius: 6,
              display: "flex", alignItems: "center", gap: 16,
              background: "var(--bg-elevated)",
            }}>
              <div style={{
                width: 44, height: 56,
                background: "var(--ink-100)",
                color: "var(--paper)",
                display: "grid", placeItems: "center",
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                fontWeight: 600,
                borderRadius: 2,
              }}>PDF</div>
              <div style={{ flex: 1 }}>
                <div style={{ color: "var(--ink-100)", fontWeight: 500 }}>{file.name}</div>
                <div className="mono-meta" style={{ marginTop: 2 }}>{(file.size / 1_000_000).toFixed(2)} MB · Uploaded</div>
              </div>
              <div style={{
                width: 20, height: 20,
                borderRadius: "50%",
                background: "var(--ink-100)",
                color: "var(--paper)",
                display: "grid", placeItems: "center",
              }}>
                <Icon.Check style={{ width: 12, height: 12 }} />
              </div>
              <button className="btn-ghost" style={{ padding: 6 }} onClick={() => setFile(null)}>
                <Icon.X style={{ width: 15, height: 15 }} />
              </button>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 32 }}>
            <button className="btn btn-secondary" onClick={() => navigate("home")}>Cancel</button>
            <button
              className="btn btn-primary"
              style={{ opacity: file ? 1 : 0.4, pointerEvents: file ? "auto" : "none" }}
              onClick={() => setStep(2)}
            >
              Continue <Icon.ArrowRight style={{ width: 14, height: 14 }} />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          {/* CONTRIBUTOR SECTION — new for no-auth */}
          <div style={{
            padding: 24,
            border: "1px solid var(--ink-100)",
            borderRadius: 6,
            marginBottom: 32,
            background: "var(--bg-elevated)",
          }}>
            <div className="smallcaps" style={{ color: "var(--ink-100)", marginBottom: 6 }}>Who's contributing?</div>
            <div style={{ fontSize: 15, color: "var(--ink-100)", fontWeight: 500, marginBottom: 4 }}>
              Since there's no account, we ask each time.
            </div>
            <div style={{ fontSize: 13, color: "var(--ink-70)", marginBottom: 20, lineHeight: 1.55 }}>
              Your name will appear as the contributor. Your email is used only to reach you
              if a moderator has a question — it stays private.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <FormField label="Your name" required>
                <input className="input" placeholder="First name, or a handle"
                  value={form.contributorName}
                  onChange={(e) => setForm({ ...form, contributorName: e.target.value })} />
              </FormField>
              <FormField label="Email" required hint="Never shown publicly">
                <input className="input" type="email" placeholder="you@example.com"
                  value={form.contributorEmail}
                  onChange={(e) => setForm({ ...form, contributorEmail: e.target.value })} />
              </FormField>
            </div>
          </div>

          {/* Paper details */}
          <div style={{ display: "grid", gap: 20 }}>
            <FormField label="Title" required>
              <input className="input" placeholder="e.g. Photosynthesis in C4 Plants"
                value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </FormField>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <FormField label="Subject" required>
                <select className="input" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}>
                  <option value="">Choose a subject…</option>
                  {SUBJECTS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </FormField>
              <FormField label="Type" required>
                <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  {["Study Guide", "Lecture Notes", "Past Exam", "Problem Set", "Essay", "Cheat Sheet", "Slides", "Project"].map(t =>
                    <option key={t}>{t}</option>
                  )}
                </select>
              </FormField>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 120px", gap: 16 }}>
              <FormField label="Course code">
                <input className="input" placeholder="e.g. BIO 302" value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })} />
              </FormField>
              <FormField label="Professor">
                <input className="input" placeholder="e.g. Prof. Halloway" value={form.professor} onChange={(e) => setForm({ ...form, professor: e.target.value })} />
              </FormField>
              <FormField label="Year">
                <input className="input" type="number" value={form.year} onChange={(e) => setForm({ ...form, year: +e.target.value })} />
              </FormField>
            </div>

            <FormField label="Description" hint="One paragraph. What's in here, and who does it help?">
              <textarea className="input" rows={4}
                style={{ resize: "vertical", fontFamily: "inherit", lineHeight: 1.55 }}
                placeholder="A quick note about what these cover…"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </FormField>

            <FormField label="License">
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { id: "cc-by-nc", title: "CC BY-NC 4.0 — Attribution, non-commercial", rec: true },
                  { id: "cc-by",    title: "CC BY 4.0 — Attribution required", rec: false },
                  { id: "public",   title: "Public Domain (CC0)", rec: false },
                ].map(l => (
                  <label key={l.id} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 12px",
                    border: `1px solid ${l.rec ? "var(--ink-100)" : "var(--rule)"}`,
                    borderRadius: 4,
                    cursor: "pointer",
                    background: l.rec ? "var(--paper-2)" : "transparent",
                  }}>
                    <input type="radio" name="license" defaultChecked={l.rec} style={{ accentColor: "var(--ink-100)" }} />
                    <span style={{ fontSize: 13, color: "var(--ink-100)", flex: 1 }}>{l.title}</span>
                    {l.rec && <span className="tag" style={{ fontSize: 9 }}>RECOMMENDED</span>}
                  </label>
                ))}
              </div>
            </FormField>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 32 }}>
            <button className="btn btn-secondary" onClick={() => setStep(1)}>
              <Icon.ArrowLeft style={{ width: 14, height: 14 }} /> Back
            </button>
            <button className="btn btn-primary" onClick={() => setStep(3)}>
              Review <Icon.ArrowRight style={{ width: 14, height: 14 }} />
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "160px 1fr",
            gap: 32,
            padding: 32,
            border: "1px solid var(--rule)",
            borderRadius: 6,
            background: "var(--bg-elevated)",
          }}>
            <div style={{
              aspectRatio: "2 / 3",
              background: "var(--ink-100)",
              color: "var(--paper)",
              display: "flex", flexDirection: "column",
              padding: 16,
              borderRadius: "2px 6px 6px 2px",
              boxShadow: "var(--shadow-book)",
            }}>
              <div style={{ fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--paper-3)", fontWeight: 600 }}>
                {form.subject ? getSubject(form.subject)?.name : "Subject"}
              </div>
              <div style={{ fontSize: 15, marginTop: 12, lineHeight: 1.15, fontWeight: 500, letterSpacing: "-0.015em" }}>
                {form.title || "Your paper title"}
              </div>
              <div style={{ flex: 1 }} />
              <div style={{ fontSize: 9, fontFamily: "var(--font-mono)", opacity: 0.7 }}>
                {form.year} · {file ? Math.round(file.size / 40000) : 24}pp
              </div>
            </div>

            <div>
              <div className="smallcaps" style={{ marginBottom: 6 }}>Preview</div>
              <div style={{
                fontSize: 28,
                color: "var(--ink-100)",
                fontWeight: 500,
                lineHeight: 1.1,
                marginBottom: 8,
                letterSpacing: "-0.02em",
              }}>{form.title || "Untitled paper"}</div>
              <div style={{ color: "var(--ink-70)", marginBottom: 20 }}>
                {form.course && `${form.course} · `}{form.professor || "—"}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
                {[
                  ["Contributor", form.contributorName || "—"],
                  ["Subject", getSubject(form.subject)?.name || "—"],
                  ["Type", form.type],
                  ["Year", form.year],
                ].map(([k,v]) => (
                  <div key={k}>
                    <div className="mono-meta" style={{ fontSize: 10 }}>{k}</div>
                    <div style={{ color: "var(--ink-100)", fontSize: 13, marginTop: 2 }}>{v}</div>
                  </div>
                ))}
              </div>

              <div style={{
                padding: 14,
                background: "var(--paper-2)",
                border: "1px solid var(--rule)",
                borderRadius: 4,
                display: "flex", gap: 10,
                fontSize: 13, lineHeight: 1.5,
                color: "var(--ink-70)",
              }}>
                <Icon.Info style={{ width: 15, height: 15, color: "var(--ink-100)", flexShrink: 0, marginTop: 2 }} />
                <div>
                  A moderator will review within 24–48 hours. If they need to reach you,
                  they'll email <span style={{ color: "var(--ink-100)" }}>{form.contributorEmail || "your address"}</span>.
                  Your name will appear as the contributor once it's live.
                </div>
              </div>
            </div>
          </div>

          <label style={{ display: "flex", alignItems: "flex-start", gap: 10, marginTop: 24, cursor: "pointer" }}>
            <input type="checkbox" defaultChecked style={{ accentColor: "var(--ink-100)", marginTop: 3 }} />
            <span style={{ fontSize: 13, color: "var(--ink-70)", lineHeight: 1.55 }}>
              I confirm this is my own work (or I have permission to share it),
              and I understand it will be publicly readable once approved.
            </span>
          </label>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 32 }}>
            <button className="btn btn-secondary" onClick={() => setStep(2)}>
              <Icon.ArrowLeft style={{ width: 14, height: 14 }} /> Back
            </button>
            <button className="btn btn-primary" onClick={() => navigate("home")}>
              Submit for review <Icon.Check style={{ width: 14, height: 14 }} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FormField({ label, hint, required, children }) {
  return (
    <div>
      <label style={{
        display: "flex", alignItems: "center", gap: 6,
        fontSize: 12, color: "var(--ink-100)",
        marginBottom: 8, fontWeight: 500, letterSpacing: "0.01em",
      }}>
        {label}
        {required && <span style={{ color: "var(--ink-100)" }}>*</span>}
        {hint && <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--ink-40)", fontWeight: 400 }}>{hint}</span>}
      </label>
      {children}
    </div>
  );
}

window.UploadScreen = UploadScreen;


/* ====== src/screens/Profile.jsx ====== */
function ProfileScreen({ navigate, route }) {
  const user = getContributor(route.id) || CONTRIBUTORS[0];
  const papers = PAPERS.filter(p => p.contributor === user.id);
  const [tab, setTab] = React.useState("papers");

  return (
    <div>
      {/* Profile hero */}
      <div style={{
        background: "var(--paper-2)",
        borderBottom: "1px solid var(--rule)",
        padding: "56px 32px 40px",
      }}>
        <div style={{
          maxWidth: "var(--max-content)", margin: "0 auto",
          display: "flex", gap: 32, alignItems: "flex-end", flexWrap: "wrap",
        }}>
          <div style={{ width: 96, height: 96, background: "var(--ink-100)", color: "var(--paper)", borderRadius: "50%", display: "grid", placeItems: "center", fontSize: 40, fontWeight: 500 }}>
            {user.initials}
          </div>
          <div style={{ flex: 1, minWidth: 280 }}>
            <div className="smallcaps" style={{ marginBottom: 8 }}>
              Contributor {user.founder && "· Founder"}
            </div>
            <h1 style={{
              fontFamily: "var(--font-sans)",
              fontSize: 52,
              lineHeight: 1,
              margin: 0,
              color: "var(--ink-100)",
              letterSpacing: "-0.035em",
              fontWeight: 500,
            }}>{user.name}</h1>
            <div style={{ marginTop: 12, color: "var(--ink-70)", fontSize: 15, maxWidth: 520, lineHeight: 1.55 }}>
              {user.bio}
            </div>
            <div style={{ marginTop: 14, display: "flex", gap: 6 }}>
              <span className="tag">{user.handle}</span>
              {user.founder && <span className="tag" style={{ background: "var(--ink-100)", color: "var(--paper)", borderColor: "var(--ink-100)" }}>Founder</span>}
            </div>
          </div>
          <div style={{ display: "flex", gap: 40 }}>
            <Stat value={user.uploads} label="Contributions" />
            <Stat value={(user.uploads * 187).toLocaleString()} label="Reads" />
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "var(--max-content)", margin: "0 auto", padding: "40px 32px 0" }}>
        <div style={{
          display: "flex", gap: 4,
          borderBottom: "1px solid var(--rule)",
          marginBottom: 32,
        }}>
          {[
            { id: "papers",  label: `Papers (${papers.length})` },
            { id: "shelves", label: "Curated shelves" },
            { id: "about",   label: "About" },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{
                padding: "12px 16px",
                fontSize: 14, fontWeight: 500,
                color: tab === t.id ? "var(--ink-100)" : "var(--ink-40)",
                borderBottom: `2px solid ${tab === t.id ? "var(--ink-100)" : "transparent"}`,
                marginBottom: -1,
              }}
            >{t.label}</button>
          ))}
        </div>

        {tab === "papers" && (
          <>
            <SectionHeader eyebrow="On the shelf" title="Contributed papers" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 32 }}>
              {papers.map(p => (
                <PaperCard key={p.id} paper={p} size="md" onClick={() => navigate("paper", { id: p.id })} />
              ))}
              {papers.length < 4 && [...Array(4 - papers.length)].map((_, i) => (
                <div key={i} style={{
                  aspectRatio: "2 / 3",
                  border: "1px dashed var(--rule-strong)",
                  borderRadius: 4,
                  display: "grid", placeItems: "center",
                  color: "var(--ink-30)",
                  fontSize: 12,
                }}>Empty slot</div>
              ))}
            </div>
          </>
        )}

        {tab === "shelves" && (
          <>
            <SectionHeader eyebrow="Personal collections" title="Curated shelves" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
              {[
                { name: "Beowulf & Old English", count: 8 },
                { name: "Modernist essays",      count: 12 },
                { name: "First-year survival",   count: 6 },
              ].map((s, i) => (
                <div key={i} style={{
                  padding: 24,
                  border: "1px solid var(--rule)",
                  borderRadius: 6,
                  background: "var(--bg-elevated)",
                }}>
                  <Icon.Books style={{ width: 20, height: 20, color: "var(--ink-100)", marginBottom: 16 }} />
                  <div style={{ fontSize: 20, color: "var(--ink-100)", fontWeight: 500, letterSpacing: "-0.015em" }}>
                    {s.name}
                  </div>
                  <div className="mono-meta" style={{ marginTop: 6 }}>{s.count} papers</div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === "about" && (
          <div style={{ maxWidth: 640 }}>
            <SectionHeader eyebrow="Notes on a contributor" title={`About ${user.name.split(" ")[0]}`} />
            <div style={{
              padding: 32,
              background: "var(--bg-elevated)",
              border: "1px solid var(--rule)",
              borderRadius: 6,
              fontSize: 15,
              lineHeight: 1.65,
              color: "var(--ink-100)",
            }}>
              {user.bio}
              <br /><br />
              Contributor since 2023. Uploads mostly at the end of each semester,
              when whatever carried them through gets passed forward.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
window.ProfileScreen = ProfileScreen;


/* ====== src/screens/Admin.jsx ====== */
function AdminScreen({ navigate }) {
  const [unlocked, setUnlocked] = React.useState(() => localStorage.getItem("calebs_admin") === "1");
  const [passphrase, setPassphrase] = React.useState("");
  const [wrongTry, setWrongTry] = React.useState(false);
  const [selected, setSelected] = React.useState(0);
  const [filter, setFilter] = React.useState("pending");

  // Passphrase gate
  if (!unlocked) {
    const submit = (e) => {
      e && e.preventDefault && e.preventDefault();
      // any non-empty passphrase works in this demo
      if (passphrase.trim().length > 0) {
        localStorage.setItem("calebs_admin", "1");
        setUnlocked(true);
      } else {
        setWrongTry(true);
      }
    };
    return (
      <div style={{ maxWidth: 440, margin: "0 auto", padding: "96px 32px 0" }}>
        <div style={{
          padding: "40px 32px",
          border: "1px solid var(--rule)",
          borderRadius: 8,
          background: "var(--bg-elevated)",
        }}>
          <div style={{
            width: 44, height: 44,
            background: "var(--ink-100)", color: "var(--paper)",
            borderRadius: "50%",
            display: "grid", placeItems: "center",
            marginBottom: 20,
          }}>
            <Icon.Shield style={{ width: 20, height: 20 }} />
          </div>
          <div className="smallcaps" style={{ marginBottom: 8 }}>Moderators only</div>
          <h1 style={{
            fontFamily: "var(--font-sans)",
            fontSize: 32, margin: 0, marginBottom: 8,
            color: "var(--ink-100)",
            letterSpacing: "-0.025em",
            fontWeight: 500,
          }}>Enter passphrase</h1>
          <p style={{ color: "var(--ink-70)", fontSize: 13.5, lineHeight: 1.55, marginTop: 0, marginBottom: 24 }}>
            The moderation queue is behind a shared passphrase. Ask an existing moderator
            for the current one — it rotates each semester.
          </p>
          <form onSubmit={submit}>
            <input
              className="input"
              type="password"
              placeholder="passphrase"
              value={passphrase}
              onChange={(e) => { setPassphrase(e.target.value); setWrongTry(false); }}
              autoFocus
              style={{ fontSize: 15, padding: "12px 14px", background: "var(--paper)" }}
            />
            {wrongTry && (
              <div style={{ marginTop: 10, fontSize: 12, color: "var(--ink-100)" }}>
                That's not the passphrase.
              </div>
            )}
            <button type="submit" className="btn btn-primary" style={{
              width: "100%", justifyContent: "center", marginTop: 16, padding: "12px",
            }}>
              Unlock <Icon.ArrowRight style={{ width: 14, height: 14 }} />
            </button>
          </form>
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--rule)", fontSize: 12, color: "var(--ink-40)" }}>
            Not a moderator? <span onClick={() => navigate("about")} style={{ color: "var(--ink-100)", cursor: "pointer", textDecoration: "underline" }}>Read about how moderation works.</span>
          </div>
        </div>
      </div>
    );
  }

  const queue = [
    { id: "q01", paper: PAPERS[7],  status: "pending", flags: 0, submitted: "6 hours ago",   ai: 0.02 },
    { id: "q02", paper: PAPERS[10], status: "pending", flags: 0, submitted: "9 hours ago",   ai: 0.04 },
    { id: "q03", paper: PAPERS[12], status: "pending", flags: 1, submitted: "yesterday",     ai: 0.11, note: "Contains full solutions to a currently-assigned problem set." },
    { id: "q04", paper: PAPERS[5],  status: "pending", flags: 0, submitted: "yesterday",     ai: 0.03 },
    { id: "q05", paper: PAPERS[9],  status: "pending", flags: 2, submitted: "2 days ago",    ai: 0.42, note: "Multiple pages appear generated. Flagged by 2 moderators." },
    { id: "q06", paper: PAPERS[14], status: "pending", flags: 0, submitted: "2 days ago",    ai: 0.06 },
  ];
  const current = queue[selected];

  return (
    <div>
      <div style={{
        background: "var(--paper-2)",
        borderBottom: "1px solid var(--rule)",
        padding: "24px 32px",
      }}>
        <div style={{ maxWidth: "var(--max-content)", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
          <div>
            <div className="smallcaps" style={{ marginBottom: 6 }}>Moderators · You're signed in</div>
            <h1 style={{
              fontFamily: "var(--font-sans)",
              fontSize: 32, margin: 0,
              color: "var(--ink-100)",
              letterSpacing: "-0.02em",
              fontWeight: 500,
            }}>Moderation queue</h1>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              { id: "pending",  label: "Pending",   count: 12 },
              { id: "flagged",  label: "Flagged",   count: 3 },
              { id: "approved", label: "Approved",  count: 218 },
              { id: "rejected", label: "Rejected",  count: 7 },
            ].map(f => (
              <button key={f.id} onClick={() => setFilter(f.id)}
                style={{
                  padding: "8px 14px", fontSize: 13, fontWeight: 500,
                  borderRadius: 4,
                  background: filter === f.id ? "var(--ink-100)" : "transparent",
                  color: filter === f.id ? "var(--paper)" : "var(--ink-70)",
                  border: `1px solid ${filter === f.id ? "var(--ink-100)" : "var(--rule-strong)"}`,
                  display: "flex", gap: 8, alignItems: "center",
                }}
              >
                {f.label}
                <span style={{
                  padding: "1px 6px", fontSize: 10, fontFamily: "var(--font-mono)",
                  borderRadius: 2,
                  background: filter === f.id ? "rgba(255,255,255,0.15)" : "var(--paper-2)",
                }}>{f.count}</span>
              </button>
            ))}
            <button
              onClick={() => { localStorage.removeItem("calebs_admin"); setUnlocked(false); }}
              className="btn-ghost"
              style={{ fontSize: 12 }}
            >Sign out</button>
          </div>
        </div>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "360px 1fr",
        maxWidth: "var(--max-content)",
        margin: "0 auto",
        borderLeft: "1px solid var(--rule)",
        borderRight: "1px solid var(--rule)",
      }}>
        <div style={{ borderRight: "1px solid var(--rule)", background: "var(--bg-elevated)" }}>
          {queue.map((q, i) => {
            const contributor = getContributor(q.paper.contributor);
            const isActive = selected === i;
            return (
              <div key={q.id} onClick={() => setSelected(i)}
                style={{
                  padding: "16px 20px",
                  borderBottom: "1px solid var(--rule)",
                  borderLeft: `3px solid ${isActive ? "var(--ink-100)" : "transparent"}`,
                  background: isActive ? "var(--paper-2)" : "transparent",
                  cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span className="mono" style={{ color: "var(--ink-40)", fontSize: 10 }}>#{q.id.toUpperCase()}</span>
                  {q.flags > 0 && (
                    <span style={{
                      padding: "1px 6px", fontSize: 9,
                      fontFamily: "var(--font-mono)",
                      background: "var(--ink-100)", color: "var(--paper)",
                      borderRadius: 2,
                    }}>{q.flags} FLAG{q.flags > 1 ? "S" : ""}</span>
                  )}
                  {q.ai > 0.3 && (
                    <span style={{
                      padding: "1px 6px", fontSize: 9,
                      fontFamily: "var(--font-mono)",
                      background: "var(--paper-3)",
                      color: "var(--ink-100)",
                      borderRadius: 2,
                    }}>AI: {(q.ai * 100).toFixed(0)}%</span>
                  )}
                </div>
                <div style={{ fontSize: 15, color: "var(--ink-100)", fontWeight: 500, lineHeight: 1.25, letterSpacing: "-0.005em" }}>
                  {q.paper.title}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                  <Avatar user={contributor} size={16} />
                  <span style={{ fontSize: 11, color: "var(--ink-70)" }}>{contributor?.name}</span>
                  <span style={{ marginLeft: "auto" }} className="mono-meta">{q.submitted}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ padding: 32 }}>
          {current && <AdminReviewPanel item={current} />}
        </div>
      </div>
    </div>
  );
}

function AdminReviewPanel({ item }) {
  const contributor = getContributor(item.paper.contributor);
  const subject = getSubject(item.paper.subject);

  return (
    <div>
      {item.note && (
        <div style={{
          padding: "14px 18px",
          background: "var(--ink-100)",
          color: "var(--paper)",
          borderRadius: 4,
          display: "flex", gap: 12,
          marginBottom: 24,
        }}>
          <Icon.Flag style={{ width: 16, height: 16, flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Requires attention</div>
            <div style={{ fontSize: 13, lineHeight: 1.5, opacity: 0.85 }}>{item.note}</div>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 24, marginBottom: 32 }}>
        <BookCover paper={item.paper} size="md" />
        <div>
          <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
            <span className="tag">{subject?.name}</span>
            <span className="tag tag-paper">{item.paper.type}</span>
          </div>
          <div style={{
            fontSize: 28,
            color: "var(--ink-100)",
            lineHeight: 1.1,
            marginBottom: 8,
            fontWeight: 500,
            letterSpacing: "-0.025em",
          }}>{item.paper.title}</div>
          <div style={{ color: "var(--ink-70)", marginBottom: 16 }}>{item.paper.subtitle}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13, color: "var(--ink-70)" }}>
            <Avatar user={contributor} size={22} />
            <span>{contributor?.name}</span>
            <span>·</span>
            <span className="mono" style={{ color: "var(--ink-100)" }}>{contributor?.uploads} contribs</span>
          </div>
        </div>
      </div>

      <div className="smallcaps" style={{ marginBottom: 14 }}>Automated checks</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 32 }}>
        {[
          { label: "Plagiarism",       value: "0.4%",       ok: true },
          { label: "AI-generated",     value: `${(item.ai * 100).toFixed(0)}%`, ok: item.ai < 0.15 },
          { label: "Duplicate check",  value: "None",       ok: true },
          { label: "Sensitive",        value: "Clean",      ok: true },
        ].map((c, i) => (
          <div key={i} style={{
            padding: 14,
            border: `1px solid ${c.ok ? "var(--rule)" : "var(--ink-100)"}`,
            borderRadius: 4,
            background: c.ok ? "var(--bg-elevated)" : "var(--paper-2)",
          }}>
            <div className="smallcaps" style={{ fontSize: 9, marginBottom: 6 }}>{c.label}</div>
            <div style={{
              fontSize: 15,
              fontFamily: "var(--font-mono)",
              color: "var(--ink-100)",
              fontWeight: 500,
            }}>
              {c.ok ? "✓ " : "⚠ "}{c.value}
            </div>
          </div>
        ))}
      </div>

      <div className="smallcaps" style={{ marginBottom: 14 }}>Document preview</div>
      <div style={{ marginBottom: 32, maxWidth: 500 }}>
        <PDFPreview paper={item.paper} height={420} />
      </div>

      <div style={{
        padding: 20,
        background: "var(--bg-elevated)",
        border: "1px solid var(--rule)",
        borderRadius: 6,
      }}>
        <div className="smallcaps" style={{ marginBottom: 14 }}>Decision</div>
        <textarea
          placeholder="Add a note to the contributor (optional)…"
          style={{
            width: "100%",
            background: "var(--paper)",
            border: "1px solid var(--rule-strong)",
            color: "var(--ink-100)",
            padding: 12, borderRadius: 4,
            fontFamily: "inherit",
            fontSize: 13,
            resize: "vertical", minHeight: 60,
            outline: "none",
          }}
        />
        <div style={{ display: "flex", gap: 10, marginTop: 16, justifyContent: "flex-end" }}>
          <button className="btn btn-ghost" style={{ fontSize: 13 }}>Request changes</button>
          <button className="btn btn-secondary" style={{ padding: "10px 18px" }}>
            <Icon.X style={{ width: 14, height: 14 }} /> Reject
          </button>
          <button className="btn btn-primary" style={{ padding: "10px 18px" }}>
            <Icon.Check style={{ width: 14, height: 14 }} /> Approve & publish
          </button>
        </div>
      </div>
    </div>
  );
}

window.AdminScreen = AdminScreen;


/* ====== src/screens/About.jsx ====== */
function AboutScreen({ navigate }) {
  return (
    <div style={{ maxWidth: 780, margin: "0 auto", padding: "72px 32px 0" }}>
      <div style={{ marginBottom: 48 }}>
        <div className="smallcaps" style={{ marginBottom: 16 }}>How it works</div>
        <h1 style={{
          fontFamily: "var(--font-serif)",
          fontSize: 72,
          lineHeight: 1,
          margin: 0,
          letterSpacing: "-0.03em",
          color: "var(--ink-100)",
          fontWeight: 500,
          fontStyle: "italic",
          textWrap: "balance",
        }}>What Caleb's Library is.</h1>
        <div style={{
          fontFamily: "var(--font-sans)",
          fontSize: 20,
          color: "var(--ink-70)",
          marginTop: 24,
          lineHeight: 1.5,
          maxWidth: 640,
          letterSpacing: "-0.01em",
        }}>
          An open, community-run collection of student notes, study guides, and papers.
          Free to read, free to contribute, run by whoever shows up.
        </div>
      </div>

      <Ornament style={{ marginBottom: 48 }} />

      <div style={{
        fontSize: 16,
        lineHeight: 1.75,
        color: "var(--ink-100)",
        letterSpacing: "-0.005em",
      }}>
        <p style={{ marginTop: 0 }}>
          It began, as most useful things do, as a shared folder.
          Caleb H. and three friends kept their notes in one place in 2019.
          That folder spread — first to their year, then to the years below them,
          then to departments they'd never taken.
        </p>
        <p>
          Today it holds three thousand documents.
          Every one of them was left behind by a student who wanted the next
          person to have a slightly easier time than they did.
        </p>

        <h2 style={{
          fontFamily: "var(--font-sans)",
          fontSize: 28, marginTop: 56, marginBottom: 20,
          letterSpacing: "-0.025em",
          color: "var(--ink-100)",
          fontWeight: 500,
        }}>Three rules.</h2>

        <ol style={{ paddingLeft: 0, listStyle: "none" }}>
          {[
            { t: "Attribution is not optional.", b: "Every paper carries the name of the person who contributed it. Take credit for your work; give credit to others'." },
            { t: "No commercial reuse.", b: "The library is a gift from the community to the community. It stays that way." },
            { t: "Moderators have the last word.", b: "A small rotating group of contributors reviews every submission. They approve, request changes, or reject. Their decisions are appealable, but final." },
          ].map((r, i) => (
            <li key={i} style={{
              display: "grid",
              gridTemplateColumns: "72px 1fr",
              gap: 20,
              marginBottom: 24,
              paddingTop: 20,
              borderTop: i > 0 ? "1px solid var(--rule)" : "none",
            }}>
              <div style={{
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                color: "var(--ink-40)",
                letterSpacing: 0.04,
                paddingTop: 6,
              }}>
                {["RULE 01","RULE 02","RULE 03"][i]}
              </div>
              <div>
                <div style={{
                  fontSize: 20,
                  color: "var(--ink-100)",
                  marginBottom: 6,
                  fontWeight: 500,
                  letterSpacing: "-0.015em",
                }}>{r.t}</div>
                <div style={{ color: "var(--ink-70)", fontSize: 15, lineHeight: 1.65 }}>
                  {r.b}
                </div>
              </div>
            </li>
          ))}
        </ol>

        <h2 style={{
          fontFamily: "var(--font-sans)",
          fontSize: 28, marginTop: 56, marginBottom: 20,
          letterSpacing: "-0.025em",
          color: "var(--ink-100)",
          fontWeight: 500,
        }}>Who runs this.</h2>

        <p>
          Nobody, and everybody. Caleb started it; a rotating group of about a dozen
          contributors keeps it running. There's no university behind it,
          no company, no ads. If it stops working, whoever's around fixes it.
        </p>

        <p>
          Uploads ask for a name and email — the email stays private and is only
          used if a moderator needs to reach you.
          There are no accounts to create, nothing to log in to. Read, upload, or leave.
        </p>

        <h2 style={{
          fontFamily: "var(--font-sans)",
          fontSize: 28, marginTop: 56, marginBottom: 20,
          letterSpacing: "-0.025em",
          color: "var(--ink-100)",
          fontWeight: 500,
        }}>Want to help.</h2>

        <p>
          Upload something. Comment on something. Flag something that shouldn't be here.
          If you want to be a moderator, contribute a dozen papers first — we ask the
          top contributors when a moderator spot opens.
        </p>
      </div>

      {/* Contributors card */}
      <div style={{
        marginTop: 72,
        padding: 32,
        border: "1px solid var(--rule)",
        borderRadius: 6,
        background: "var(--bg-elevated)",
      }}>
        <div className="smallcaps" style={{ marginBottom: 20 }}>Current moderators</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          {CONTRIBUTORS.slice(0, 8).map(c => (
            <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10 }}
              onClick={() => navigate("profile", { id: c.id })}
            >
              <Avatar user={c} size={28} />
              <div style={{ minWidth: 0, cursor: "pointer" }}>
                <div style={{ fontSize: 12, color: "var(--ink-100)", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {c.name}
                </div>
                <div className="mono-meta" style={{ fontSize: 10 }}>{c.handle}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 48, marginBottom: 96, display: "flex", gap: 12 }}>
        <button className="btn btn-primary" onClick={() => navigate("upload")}>Contribute a paper</button>
        <button className="btn btn-secondary" onClick={() => navigate("browse")}>Browse the library</button>
      </div>
    </div>
  );
}
window.AboutScreen = AboutScreen;


/* ====== src/screens/NotFound.jsx ====== */
function NotFoundScreen({ navigate }) {
  return (
    <div style={{
      maxWidth: 720, textAlign: "center",
      margin: "0 auto",
      padding: "120px 32px 96px",
    }}>
      {/* Fallen books */}
      <div style={{
        display: "flex", justifyContent: "center",
        marginBottom: 40, position: "relative",
        height: 240,
      }}>
        <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%) translateY(20px) rotate(-14deg)", zIndex: 1 }}>
          <BookCover paper={PAPERS[3]} size="md" />
        </div>
        <div style={{ position: "absolute", left: "50%", transform: "translateX(-70%) translateY(70px) rotate(-38deg)", zIndex: 2, opacity: 0.7 }}>
          <BookCover paper={PAPERS[7]} size="sm" />
        </div>
        <div style={{ position: "absolute", left: "50%", transform: "translateX(-30%) translateY(90px) rotate(24deg)", zIndex: 2, opacity: 0.7 }}>
          <BookCover paper={PAPERS[11]} size="sm" />
        </div>
      </div>

      <div style={{
        fontFamily: "var(--font-serif)",
        fontSize: 96,
        fontStyle: "italic",
        color: "var(--ink-100)",
        lineHeight: 1,
        marginBottom: 16,
        fontWeight: 500,
        letterSpacing: "-0.03em",
      }}>404</div>

      <h1 style={{
        fontFamily: "var(--font-sans)",
        fontSize: 40,
        color: "var(--ink-100)",
        margin: 0,
        letterSpacing: "-0.025em",
        fontWeight: 500,
      }}>This page wandered off the shelves.</h1>

      <p style={{
        fontSize: 17,
        color: "var(--ink-70)",
        marginTop: 20, marginBottom: 40,
        lineHeight: 1.6,
        letterSpacing: "-0.005em",
      }}>
        Whatever you were looking for isn't here — or isn't here anymore.
        Perhaps a moderator moved it, or it was withdrawn from circulation.
      </p>

      <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
        <button className="btn btn-primary" onClick={() => navigate("home")}>
          <Icon.Home style={{ width: 14, height: 14 }} /> Back to the library
        </button>
        <button className="btn btn-secondary" onClick={() => navigate("browse")}>
          Browse everything
        </button>
      </div>
    </div>
  );
}
window.NotFoundScreen = NotFoundScreen;


/* ====== src/App.jsx ====== */
// Caleb's Library — App shell (v3, light editorial)

function App() {
  const [route, setRoute] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem("calebs_route") || "null") || { screen: "home" }; }
    catch { return { screen: "home" }; }
  });
  const [bannerOpen, setBannerOpen] = React.useState(() => {
    return localStorage.getItem("calebs_banner_dismissed") !== "1";
  });

  React.useEffect(() => {
    localStorage.setItem("calebs_route", JSON.stringify(route));
  }, [route]);

  const navigate = (screen, params = {}) => {
    if (screen === "back") { window.history.back(); return; }
    setRoute({ screen, ...params });
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const SCREENS = {
    home:     window.HomeScreen,
    browse:   window.BrowseScreen,
    search:   window.SearchScreen,
    subject:  window.SubjectScreen,
    paper:    window.PaperDetailScreen,
    upload:   window.UploadScreen,
    profile:  window.ProfileScreen,
    admin:    window.AdminScreen,
    about:    window.AboutScreen,
    notfound: window.NotFoundScreen,
  };
  const ScreenComponent = SCREENS[route.screen] || SCREENS.notfound;

  const dismissBanner = () => {
    setBannerOpen(false);
    localStorage.setItem("calebs_banner_dismissed", "1");
  };

  return (
    <div>
      {bannerOpen && <OpenBanner onDismiss={dismissBanner} onLearnMore={() => navigate("about")} />}
      <TopStrip navigate={navigate} route={route} />
      <main data-screen-label={route.screen} key={route.screen} className="screen-wrap">
        <ScreenComponent navigate={navigate} route={route} />
      </main>
      <Footer navigate={navigate} />
    </div>
  );
}

/* ============================================================
   Open banner — top of page, dismissible
   ============================================================ */
function OpenBanner({ onDismiss, onLearnMore }) {
  return (
    <div style={{
      height: "var(--banner-h)",
      background: "var(--ink-100)",
      color: "var(--paper)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 24,
      fontSize: 12,
      letterSpacing: "-0.005em",
      position: "relative",
    }}>
      <span style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <span style={{
          display: "inline-block",
          width: 6, height: 6, borderRadius: "50%",
          background: "var(--paper)",
          opacity: 0.7,
        }} />
        <span>
          <strong style={{ fontWeight: 600 }}>Free. Open. No account needed.</strong>
          <span style={{ opacity: 0.7, marginLeft: 10 }}>
            Anyone can read. Anyone can contribute.
          </span>
        </span>
        <button
          onClick={onLearnMore}
          style={{
            color: "var(--paper)",
            opacity: 0.8,
            textDecoration: "underline",
            textUnderlineOffset: 3,
            fontSize: 12,
            padding: 0,
          }}
        >How it works →</button>
      </span>
      <button
        onClick={onDismiss}
        aria-label="Dismiss banner"
        style={{
          position: "absolute", right: 12, top: "50%",
          transform: "translateY(-50%)",
          color: "var(--paper)",
          opacity: 0.5,
          padding: 6,
          borderRadius: 3,
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
        onMouseLeave={(e) => e.currentTarget.style.opacity = 0.5}
      >
        <Icon.X style={{ width: 14, height: 14 }} />
      </button>
    </div>
  );
}

/* ============================================================
   Top strip — logo, search, contribute
   ============================================================ */
function TopStrip({ navigate, route }) {
  const [q, setQ] = React.useState("");
  return (
    <header style={{
      height: "var(--top-h)",
      borderBottom: "1px solid var(--rule)",
      background: "rgba(245, 242, 234, 0.92)",
      backdropFilter: "blur(8px)",
      position: "sticky",
      top: 0,
      zIndex: 30,
    }}>
      <div style={{
        maxWidth: "var(--max-content)",
        margin: "0 auto",
        height: "100%",
        display: "flex",
        alignItems: "center",
        gap: 20,
        padding: "0 32px",
      }}>
        {/* Logo */}
        <div
          onClick={() => navigate("home")}
          style={{ display: "flex", alignItems: "baseline", gap: 6, cursor: "pointer" }}
        >
          <span style={{
            fontFamily: "var(--font-serif)",
            fontSize: 22,
            fontWeight: 500,
            color: "var(--ink-100)",
            letterSpacing: "-0.02em",
            fontStyle: "italic",
          }}>Caleb's</span>
          <span style={{
            fontFamily: "var(--font-sans)",
            fontSize: 12,
            fontWeight: 500,
            color: "var(--ink-40)",
            textTransform: "uppercase",
            letterSpacing: "0.14em",
          }}>Library</span>
        </div>

        {/* Mini search — hidden on home (home has big one), shown elsewhere */}
        {route.screen !== "home" && (
          <div style={{ flex: 1, maxWidth: 480, position: "relative" }}>
            <Icon.Search style={{
              position: "absolute", left: 12, top: "50%",
              transform: "translateY(-50%)",
              width: 14, height: 14, color: "var(--ink-40)",
            }} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") navigate("search", { query: q }); }}
              placeholder="Search the library…"
              style={{
                width: "100%",
                background: "var(--paper-2)",
                border: "1px solid transparent",
                borderRadius: 4,
                padding: "8px 12px 8px 34px",
                fontSize: 13,
                fontFamily: "inherit",
                color: "var(--ink-100)",
                outline: "none",
                transition: "border-color var(--dur-fast), background var(--dur-fast)",
              }}
              onFocus={(e) => { e.currentTarget.style.background = "var(--paper)"; e.currentTarget.style.borderColor = "var(--rule-strong)"; }}
              onBlur={(e) => { e.currentTarget.style.background = "var(--paper-2)"; e.currentTarget.style.borderColor = "transparent"; }}
            />
          </div>
        )}

        <div style={{ flex: route.screen === "home" ? 1 : 0 }} />

        {/* Right nav */}
        <nav style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button className="btn-ghost" onClick={() => navigate("browse")}>Browse</button>
          <button className="btn-ghost" onClick={() => navigate("about")}>About</button>
          <button className="btn btn-primary" onClick={() => navigate("upload")} style={{ padding: "8px 14px" }}>
            <Icon.Plus style={{ width: 13, height: 13 }} /> Contribute
          </button>
        </nav>
      </div>
    </header>
  );
}

/* ============================================================
   Footer — thin, community credit
   ============================================================ */
function Footer({ navigate }) {
  return (
    <footer style={{
      marginTop: 96,
      borderTop: "1px solid var(--rule)",
      padding: "40px 32px 48px",
      background: "var(--paper-2)",
    }}>
      <div style={{
        maxWidth: "var(--max-content)",
        margin: "0 auto",
        display: "grid",
        gridTemplateColumns: "2fr 1fr 1fr 1fr",
        gap: 40,
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 12 }}>
            <span style={{
              fontFamily: "var(--font-serif)",
              fontSize: 20, fontStyle: "italic",
              color: "var(--ink-100)",
              letterSpacing: "-0.02em",
              fontWeight: 500,
            }}>Caleb's</span>
            <span className="smallcaps" style={{ fontSize: 10 }}>Library</span>
          </div>
          <div style={{ fontSize: 13, color: "var(--ink-40)", lineHeight: 1.6, maxWidth: 360 }}>
            An open, community-run library of student notes and study material.
            Started by Caleb H. in 2019 from a shared drive. Kept going by whoever shows up.
          </div>
        </div>
        <div>
          <div className="smallcaps" style={{ fontSize: 10, marginBottom: 12 }}>Library</div>
          <FooterLink onClick={() => navigate("browse")}>Browse</FooterLink>
          <FooterLink onClick={() => navigate("search")}>Search</FooterLink>
          <FooterLink onClick={() => navigate("upload")}>Contribute</FooterLink>
        </div>
        <div>
          <div className="smallcaps" style={{ fontSize: 10, marginBottom: 12 }}>Community</div>
          <FooterLink onClick={() => navigate("about")}>How it works</FooterLink>
          <FooterLink onClick={() => navigate("admin")}>Moderation</FooterLink>
          <FooterLink onClick={() => window.open("mailto:hi@calebslibrary.org", "_blank")}>Get in touch</FooterLink>
        </div>
        <div>
          <div className="smallcaps" style={{ fontSize: 10, marginBottom: 12 }}>Legal</div>
          <FooterLink>Code of Conduct</FooterLink>
          <FooterLink>Copyright</FooterLink>
          <FooterLink>Privacy</FooterLink>
        </div>
      </div>
      <div style={{
        maxWidth: "var(--max-content)",
        margin: "40px auto 0",
        paddingTop: 24,
        borderTop: "1px solid var(--rule)",
        display: "flex", justifyContent: "space-between",
        fontSize: 12,
        color: "var(--ink-40)",
      }}>
        <div className="mono">© 2026 · Caleb's Library · A community project</div>
        <div>Made with care. Kept alive by contributors.</div>
      </div>
    </footer>
  );
}
function FooterLink({ children, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        fontSize: 13,
        color: "var(--ink-70)",
        cursor: "pointer",
        padding: "4px 0",
        transition: "color var(--dur-fast)",
      }}
      onMouseEnter={(e) => e.currentTarget.style.color = "var(--ink-100)"}
      onMouseLeave={(e) => e.currentTarget.style.color = ""}
    >{children}</div>
  );
}

// Boot
ReactDOM.createRoot(document.getElementById("root")).render(<App />);

