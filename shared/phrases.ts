// Shared masthead phrases — framework-free delight.
// Ported from src/views/HomeView.vue (DAY/NIGHT/SEASON/WEEKDAY pools,
// phraseFor, nextBoundary). Pure Date math, no timers — the UI layer owns
// scheduling (refresh at the next 6am/6pm boundary).

export const DAY_PHRASES = [
  'What do you wanna learn today?',
  'Good morning — what are we studying?',
  'Locked in. I see you.',
  'Semester survival starts here.',
  "Coffee in hand? Let's find your book.",
  "Lecture notes not cutting it? Let's dig deeper.",
  "Deadline szn or just curious today?",
  "What's today's rabbit hole?",
  'Back at it. What are we reading?',
  "Library's open, brain's (hopefully) online.",
];

export const NIGHT_PHRASES = [
  'Hey night owl…',
  'Burning the midnight oil?',
  "It's late — the library is still open.",
  'Night shift. I see you.',
  'Essay due tomorrow? I got you.',
  '3am thoughts, 3am research.',
  'The library never sleeps. Neither do you, apparently.',
  "Cramming or just can't sleep?",
  "Quiet hours, loud thoughts. What's up?",
  "Everyone else is asleep. We're not.",
  'Last-minute reading list? Let’s go.',
  'Dark mode on. Brain still on too.',
];

export type Season = 'exam' | 'test' | 'term' | '';

export const SEASON_PHRASES: Record<Exclude<Season, ''>, string[]> = {
  exam: [
    'Exam season — one past paper at a time.',
    "Finals week. The library's your study room.",
    'Past papers, mock exams, last-minute notes.',
    "Final stretch. One more paper and you're done.",
    "Exams don't wait. Neither does the library.",
  ],
  test: [
    'Mid-terms are coming. Stock up now.',
    'Test week survival starts here.',
    'Practice sets for the tests ahead.',
    "Cram session? The library's got you.",
  ],
  term: [
    'New term, new syllabus. Grab your reading list.',
    'Welcome back — your courses are waiting.',
    'New semester, fresh notes ahead.',
    "First week back. Let's get organized.",
  ],
};

export const WEEKDAY_PHRASES: Record<number, string[]> = {
  0: ['Sunday reset — light read or deep dive?', 'Weekend stay-in-study mode.'],
  1: ['Monday fresh start. Pick a course.', 'New week, new rabbit hole.'],
  2: ['Tuesday traction. Keep the streak.', 'Mid-quad day. What needs a second look?'],
  3: ['Hump day — push through one more.', 'Wednesday. Halfway to the weekend.'],
  4: ['Thursday grind. Almost there.', 'Weekend preview. One more topic?'],
  5: ['Friday wind-down. Review or relax?', 'Last push before the weekend.'],
  6: ['Saturday study sesh.', 'Weekend deep-dive. No rush.'],
};

export function seasonFor(date: Date): Season {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const inWindow = (fromM: number, fromD: number, toM: number, toD: number): boolean => {
    const from = fromM * 100 + fromD;
    const to = toM * 100 + toD;
    const today = m * 100 + d;
    return today >= from && today <= to;
  };
  if (inWindow(11, 15, 12, 31) || inWindow(3, 10, 4, 30)) return 'exam';
  if (inWindow(10, 1, 11, 14) || inWindow(2, 15, 3, 9)) return 'test';
  if (inWindow(1, 5, 2, 14) || inWindow(8, 15, 9, 30)) return 'term';
  return '';
}

export function phraseFor(date: Date): string {
  const h = date.getHours();
  const isNight = h >= 18 || h < 6;
  const base = isNight ? NIGHT_PHRASES : DAY_PHRASES;
  const season = seasonFor(date);
  const seasonal = season ? SEASON_PHRASES[season] : undefined;
  const weekday = WEEKDAY_PHRASES[date.getDay()];
  const pool = [...base, ...(seasonal ?? []), ...(weekday ?? [])];
  const dayNum = Math.floor(date.getTime() / 86400000);
  return pool[dayNum % pool.length]!;
}

// Exam windows (month/day) mirrored from seasonFor: finals Nov15–Dec31 and
// Mar10–Apr30. Used for the exam-countdown pill (days left in a live window,
// or days until the next one when within 60 days).
const EXAM_WINDOWS = [
  { fromM: 11, fromD: 15, toM: 12, toD: 31 },
  { fromM: 3, fromD: 10, toM: 4, toD: 30 },
];

export interface ExamCountdown {
  label: string;
  days: number;
  live: boolean;
}

export function examCountdown(date: Date): ExamCountdown | null {
  const day = 86400000;
  const at = (m: number, d: number, y: number) => new Date(y, m - 1, d).getTime();
  const now = date.getTime();
  const y = date.getFullYear();
  let best: ExamCountdown | null = null;
  for (const yy of [y, y + 1]) {
    for (const w of EXAM_WINDOWS) {
      const start = at(w.fromM, w.fromD, yy);
      const end = at(w.toM, w.toD, yy);
      if (now >= start && now <= end) {
        return { label: 'Finals SZN', days: Math.max(0, Math.ceil((end - now) / day)), live: true };
      }
      const until = Math.ceil((start - now) / day);
      if (until > 0 && until <= 60 && (!best || until < best.days)) {
        best = { label: 'Finals SZN', days: until, live: false };
      }
    }
  }
  return best;
}

// Next 6am/6pm boundary after `now` — UI refresh target for day/night flips.
export function nextBoundaryMs(now: Date): number {
  const at6 = new Date(now);
  at6.setHours(6, 0, 0, 0);
  if (at6 <= now) at6.setDate(at6.getDate() + 1);
  const at18 = new Date(now);
  at18.setHours(18, 0, 0, 0);
  if (at18 <= now) at18.setDate(at18.getDate() + 1);
  return Math.min(at6.getTime(), at18.getTime());
}
