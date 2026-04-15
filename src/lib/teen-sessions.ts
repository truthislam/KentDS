/**
 * Teen Course Session Generator
 * 
 * Auto-generates rolling teen driving course sessions based on configurable rules.
 * These are sensible industry defaults — all values are admin-editable via the CMS.
 * 
 * KEY RULES (from client):
 * - Total course hours: 30 (state-regulated, cannot be less)
 * - Weekday: Mon/Tue/Wed, 5-7 PM → 6 hrs/week → 5 weeks exactly
 * - Weekend: Sat/Sun, 4-6 PM → 4 hrs/week → 7 full weeks + 1 day in week 8 = 30 hrs
 * - New weekday session starts next Monday after previous ends
 * - New weekend session starts next Saturday after previous ends
 */

export interface TeenSession {
  id?: string;
  type: "Weekday" | "Weekend";
  startDate: string;   // ISO date: "2026-04-06"
  endDate: string;     // ISO date: "2026-05-06"
  days: string[];      // ["Mon", "Tue", "Wed"]
  timeStart: string;   // "5:00 PM"
  timeEnd: string;     // "7:00 PM"
  totalHours: number;  // 30
  capacity: number;    // 25
  enrolled: number;    // 0
  isActive: boolean;   // true
  scheduleDisplay: string; // Pre-computed: "5 pm - 7 pm Mon, Tue, Wed"
}

// ─── Day-of-week helpers ───
const DAY_INDEX: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
};

/**
 * Find the next occurrence of a given day-of-week on or after `from`.
 */
function nextDayOfWeek(from: Date, dayName: string): Date {
  const target = DAY_INDEX[dayName];
  const d = new Date(from);
  d.setHours(0, 0, 0, 0);
  const diff = (target - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + (diff === 0 ? 0 : diff));
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function toISO(date: Date): string {
  // Use local date components to avoid timezone shifts
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function shortTime(time: string): string {
  return time
    .replace(":00", "")
    .replace(" AM", " am")
    .replace(" PM", " pm");
}

// ─── Weekday course: 5 weeks exactly ───
// Mon/Tue/Wed × 2 hrs = 6 hrs/week × 5 weeks = 30 hrs
// Last class day = Wednesday of week 5
function computeWeekdayEnd(startDate: Date): Date {
  // Start is a Monday. End = Wednesday of week 5
  // Week 1 starts on startDate (Monday)
  // Wednesday of week 5 = startDate + (4 weeks × 7 days) + 2 days
  return addDays(startDate, 4 * 7 + 2);
}

// ─── Weekend course: 7 full weeks + 1 day in week 8 ───
// Sat/Sun × 2 hrs = 4 hrs/week × 7 weeks = 28 hrs + 1 day (Sat) = 30 hrs
// Last class day = Saturday of week 8
function computeWeekendEnd(startDate: Date): Date {
  // Start is a Saturday. 7 full weekends = 7 × 7 = 49 days to reach Saturday of week 8
  // Week 1: Sat + Sun = 4 hrs (total: 4)
  // Week 7: Sat + Sun = 4 hrs (total: 28)
  // Week 8: Sat only = 2 hrs (total: 30)
  // Saturday of week 8 = startDate + 7 * 7 = startDate + 49 days
  return addDays(startDate, 49);
}

/**
 * Generate `count` rolling sessions for a given type.
 * Each new session starts the next Monday (weekday) or Saturday (weekend) after the previous one ends.
 */
export function generateSessions(
  type: "Weekday" | "Weekend",
  count: number = 6,
  fromDate?: Date,
): TeenSession[] {
  const from = fromDate || new Date();
  const isWeekday = type === "Weekday";

  const days = isWeekday ? ["Mon", "Tue", "Wed"] : ["Sat", "Sun"];
  const timeStart = isWeekday ? "5:00 PM" : "4:00 PM";
  const timeEnd = isWeekday ? "7:00 PM" : "6:00 PM";
  const capacity = isWeekday ? 25 : 20;
  const firstDay = isWeekday ? "Mon" : "Sat";
  const scheduleDisplay = `${shortTime(timeStart)} - ${shortTime(timeEnd)} ${days.join(", ")}`;

  // Find the first valid start day
  let nextStart = nextDayOfWeek(from, firstDay);

  const sessions: TeenSession[] = [];

  for (let i = 0; i < count; i++) {
    const endDate = isWeekday
      ? computeWeekdayEnd(nextStart)
      : computeWeekendEnd(nextStart);

    sessions.push({
      type,
      startDate: toISO(nextStart),
      endDate: toISO(endDate),
      days: [...days],
      timeStart,
      timeEnd,
      totalHours: 30,
      capacity,
      enrolled: 0,
      isActive: true,
      scheduleDisplay,
    });

    // Next session starts the next Monday/Saturday after this session's end date
    nextStart = nextDayOfWeek(addDays(endDate, 1), firstDay);
  }

  return sessions;
}

/**
 * Format a session for the dropdown display.
 * Matches client screenshot: "April 20 - May 18, 2026 5 pm - 7 pm Mon, Tue, Wed"
 */
export function formatSessionLabel(session: TeenSession): string {
  const start = new Date(session.startDate + "T00:00:00");
  const end = new Date(session.endDate + "T00:00:00");

  const startStr = start.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  const endStr = end.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return `${startStr} – ${endStr}`;
}

/**
 * Generate all default sessions (both weekday and weekend).
 */
export function generateAllDefaultSessions(count: number = 6): TeenSession[] {
  return [
    ...generateSessions("Weekday", count),
    ...generateSessions("Weekend", count),
  ];
}
