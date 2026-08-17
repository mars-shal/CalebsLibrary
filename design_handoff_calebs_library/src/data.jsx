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
