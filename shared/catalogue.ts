// Shared catalogue core — framework-free (no Vue/RN/zod).
// Ported from src/schema/catalogue.ts. The Zod source of truth stays in
// src/schema/catalogue.ts for the backend; this interface MUST mirror it.
// If the Zod schema changes, update CatalogueItem here in lockstep.

export const FOUNDER_EMAIL = 'caleb.library.project@gmail.com';

export const CODE_SUBJECTS: Record<string, string> = {
  CSC: 'Computer Science',
  CPE: 'Computer Engineering',
  CEN: 'Computer Engineering',
  ICT: 'Information & Communication Technology',
  TEL: 'Telecommunications Engineering',
  EEE: 'Electrical / Electronics Engineering',
  ELE: 'Electrical / Electronics Engineering',
  MCE: 'Mechanical Engineering',
  MME: 'Mechatronics Engineering',
  CVE: 'Civil Engineering',
  CHE: 'Chemical Engineering',
  CHM: 'Chemistry',
  AGE: 'Agricultural Engineering',
  AGB: 'Agricultural Engineering',
  BME: 'Biomedical Engineering',
  MTH: 'Mathematics',
  STA: 'Statistics',
  PHY: 'Physics',
  GST: 'General Studies',
  LAB: 'Laboratory',
  WSP: 'Workshop',
  COS: 'Computer Studies',
  ENT: 'Entrepreneurship Studies',
  IFT: 'Information Technology',
  SEN: 'Software Engineering',
  GET: 'General Engineering',
  ARC: 'Architecture',
  GES: 'General Studies',
  FAA: 'Fine & Applied Arts',
  MCT: 'Mechatronics Engineering',
  MEE: 'Mechanical Engineering',
  ENV: 'Environmental Management',
  BIO: 'Biology',
  AMS: 'Applied Mathematics & Statistics',
  ENG: 'Engineering',
};

export const LEVEL_DESC: Record<string, string> = {
  '1': 'Foundation Level',
  '2': 'Intermediate Level',
  '3': 'Advanced Level',
  '4': 'Final Year',
  '5': 'Postgraduate',
};

export const DEFAULT_LICENSE = 'CC BY-NC 4.0';

export interface CatalogueItem {
  id: string;
  title: string;
  subtitle: string;
  subject: string;
  subjectName: string;
  course: string;
  courseName: string;
  type: string;
  year: number;
  pages: number;
  upvotes: number;
  downvotes: number;
  downloads: number;
  views: number;
  contributor: string;
  contributorName: string;
  teacher: string;
  cover: number;
  mimeType: string;
  fileExt: string;
  sizeLabel: string;
  previewUrl: string;
  downloadUrl: string;
  createdAt: string;
  parents: string[];
  college: string;
  program: string;
  level: string;
  levelYear: string;
  semester: string;
  deptSection: string;
  license: string;
  fileId: string;
  storageId?: string;
}

export interface SyncResult {
  count: number;
  syncedAt: number;
}

export function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'untitled'
  );
}

// "BUT-MTH 103 (Elementary Mathematics III)" → { code: "MTH", number: "103", parenthetical: "Elementary Mathematics III" }
export function parseCourseName(name: string): {
  code: string;
  number: string;
  parenthetical: string;
} {
  const cleaned = name.replace(/^BUT-/i, '');
  const m = /^([A-Za-z]{2,6})\s*(\d{3})\s*(?:\(([^)]*)\))?/.exec(cleaned);
  if (m) {
    return {
      code: m[1]?.toUpperCase() ?? '',
      number: m[2] ?? '',
      parenthetical: (m[3] ?? '').trim(),
    };
  }
  return { code: '', number: '', parenthetical: '' };
}

export function levelYearOf(courseNumber: string): string {
  return courseNumber.charAt(0) || '';
}

export function hashString(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = (h * 33) ^ str.charCodeAt(i);
  }
  return Math.abs(h);
}

// Paper type inferred from the real filename — Drive has no type metadata
export function typeFromName(name: string): string {
  const n = name.toLowerCase();
  if (/(past ?question|past ?exam|exam|test)/.test(n)) return 'Past Exam';
  if (/(problem ?set|assignment|tutorial)/.test(n)) return 'Problem Set';
  if (/(cheat ?sheet|formula|summary)/.test(n)) return 'Cheat Sheet';
  if (/(guide|revision|revised)/.test(n)) return 'Study Guide';
  if (/(essay|report|project|thesis)/.test(n)) return 'Essay';
  if (/(slide|lecture|note)/.test(n)) return 'Lecture Notes';
  if (/(ppt|pptx)$/.test(name.toLowerCase())) return 'Slides';
  return 'Notes';
}

export function extFromName(name: string): string {
  const m = /\.([a-z0-9]+)$/i.exec(name);
  return m?.[1]?.toLowerCase() ?? '';
}

export function formatBytes(bytes: number): string {
  if (!bytes) return '—';
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

// Pages estimated from byte size (deterministic per-file hash fallback)
export function estimatePages(bytes: number, hash: number): number {
  if (bytes > 0) {
    const bySize = Math.round(bytes / 30000);
    return Math.min(250, Math.max(2, bySize));
  }
  return 6 + (hash % 40);
}
