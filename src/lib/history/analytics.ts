import { getBerlinHour } from "@/lib/date/berlin";
import { GERMAN_STOP_WORDS } from "@/lib/history/stopwords";

export type HistoryRange = "week" | "month" | "all";
export type TimeBucket = "morning" | "midday" | "evening" | "night";

export type RawCheckin = {
  id: string;
  created_at: string;
  level_before: number;
  situation: string | null;
  input_raw: string | null;
  chosen_skill_id: string | null;
  hilfreich: string | null;
};

export type SkillRow = { id: string; name: string };

const WEEKDAY_LABELS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const BUCKET_LABELS: Record<TimeBucket, string> = {
  morning: "Morgen",
  midday: "Mittag",
  evening: "Abend",
  night: "Nacht",
};

function getBerlinWeekdayIndex(iso: string): number {
  const short = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Berlin",
    weekday: "short",
  }).format(new Date(iso));
  const map: Record<string, number> = {
    Mon: 0,
    Tue: 1,
    Wed: 2,
    Thu: 3,
    Fri: 4,
    Sat: 5,
    Sun: 6,
  };
  return map[short] ?? 0;
}

export function getTimeBucket(hour: number): TimeBucket {
  if (hour >= 6 && hour < 11) return "morning";
  if (hour >= 11 && hour < 16) return "midday";
  if (hour >= 16 && hour < 21) return "evening";
  return "night";
}

function daysAgoBerlin(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toLocaleDateString("en-CA", { timeZone: "Europe/Berlin" });
}

function isOnOrAfterBerlinDay(iso: string, startDay: string): boolean {
  const day = new Date(iso).toLocaleDateString("en-CA", {
    timeZone: "Europe/Berlin",
  });
  return day >= startDay;
}

function filterByRange(checkins: RawCheckin[], range: HistoryRange): RawCheckin[] {
  if (range === "all") return checkins;
  const days = range === "week" ? 7 : 30;
  const startDay = daysAgoBerlin(days - 1);
  return checkins.filter((c) => isOnOrAfterBerlinDay(c.created_at, startDay));
}

function formatChartLabel(iso: string, range: HistoryRange): string {
  const date = new Date(iso);
  if (range === "week") {
    const wd = WEEKDAY_LABELS[getBerlinWeekdayIndex(iso)];
    const time = new Intl.DateTimeFormat("de-DE", {
      timeZone: "Europe/Berlin",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
    return `${wd} ${time}`;
  }
  if (range === "month") {
    return new Intl.DateTimeFormat("de-DE", {
      timeZone: "Europe/Berlin",
      day: "2-digit",
      month: "2-digit",
    }).format(date);
  }
  return new Intl.DateTimeFormat("de-DE", {
    timeZone: "Europe/Berlin",
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).format(date);
}

function extractTopTriggers(checkins: RawCheckin[], limit = 5) {
  const startDay = daysAgoBerlin(6);
  const recent = checkins.filter((c) => isOnOrAfterBerlinDay(c.created_at, startDay));
  const counts = new Map<string, number>();

  for (const checkin of recent) {
    const text = (checkin.situation ?? checkin.input_raw ?? "").toLowerCase();
    const words = text.match(/[a-zäöüß]{3,}/gi) ?? [];
    for (const word of words) {
      const normalized = word.toLowerCase();
      if (GERMAN_STOP_WORDS.has(normalized)) continue;
      counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word, count]) => ({ word, count }));
}

function extractHelpfulSkills(
  checkins: RawCheckin[],
  skillMap: Map<string, string>
) {
  const startDay = daysAgoBerlin(13);
  const counts = new Map<string, number>();

  for (const checkin of checkins) {
    if (!isOnOrAfterBerlinDay(checkin.created_at, startDay)) continue;
    if (checkin.hilfreich !== "ja" && checkin.hilfreich !== "bisschen") continue;
    if (!checkin.chosen_skill_id) continue;
    const name = skillMap.get(checkin.chosen_skill_id) ?? "Unbekannt";
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));
}

function buildHeatmap(checkins: RawCheckin[]) {
  const sums = new Map<string, { total: number; count: number }>();

  for (const checkin of checkins) {
    const weekday = getBerlinWeekdayIndex(checkin.created_at);
    const bucket = getTimeBucket(getBerlinHour(new Date(checkin.created_at)));
    const key = `${weekday}-${bucket}`;
    const entry = sums.get(key) ?? { total: 0, count: 0 };
    entry.total += checkin.level_before;
    entry.count += 1;
    sums.set(key, entry);
  }

  const cells: {
    weekday: number;
    weekdayLabel: string;
    bucket: TimeBucket;
    bucketLabel: string;
    avgLevel: number | null;
    count: number;
  }[] = [];

  const buckets: TimeBucket[] = ["morning", "midday", "evening", "night"];
  for (let weekday = 0; weekday < 7; weekday += 1) {
    for (const bucket of buckets) {
      const entry = sums.get(`${weekday}-${bucket}`);
      cells.push({
        weekday,
        weekdayLabel: WEEKDAY_LABELS[weekday],
        bucket,
        bucketLabel: BUCKET_LABELS[bucket],
        avgLevel: entry ? entry.total / entry.count : null,
        count: entry?.count ?? 0,
      });
    }
  }

  return cells;
}

function buildBreathRitual(
  completions: { completed_date: string }[]
) {
  const completedSet = new Set(completions.map((c) => c.completed_date));
  const days: { date: string; label: string; completed: boolean }[] = [];

  for (let i = 6; i >= 0; i -= 1) {
    const date = daysAgoBerlin(i);
    const label = new Intl.DateTimeFormat("de-DE", {
      timeZone: "Europe/Berlin",
      weekday: "short",
    }).format(new Date(`${date}T12:00:00`));
    days.push({
      date,
      label,
      completed: completedSet.has(date),
    });
  }

  return {
    days,
    completedCount: days.filter((d) => d.completed).length,
  };
}

export function buildHistoryAnalytics(
  allCheckins: RawCheckin[],
  skills: SkillRow[],
  breathCompletions: { completed_date: string }[],
  range: HistoryRange
) {
  const skillMap = new Map(skills.map((s) => [s.id, s.name]));
  const filtered = filterByRange(allCheckins, range).sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const chartPoints = filtered.map((checkin) => ({
    id: checkin.id,
    label: formatChartLabel(checkin.created_at, range),
    level: checkin.level_before,
    created_at: checkin.created_at,
    situation: checkin.situation ?? checkin.input_raw ?? null,
    skillName: checkin.chosen_skill_id
      ? skillMap.get(checkin.chosen_skill_id) ?? null
      : null,
    dateLabel: new Intl.DateTimeFormat("de-DE", {
      timeZone: "Europe/Berlin",
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(checkin.created_at)),
  }));

  return {
    range,
    chartPoints,
    heatmap: buildHeatmap(filtered),
    topTriggers: extractTopTriggers(allCheckins),
    helpfulSkills: extractHelpfulSkills(allCheckins, skillMap),
    breathRitual: buildBreathRitual(breathCompletions),
    weekdayLabels: WEEKDAY_LABELS,
    bucketLabels: BUCKET_LABELS,
  };
}

export function heatmapColor(avgLevel: number | null): string {
  if (avgLevel === null) return "#f5f8fc";
  const t = Math.min(1, Math.max(0, avgLevel / 10));
  const low = { r: 219, g: 233, b: 244 };
  const high = { r: 201, g: 123, b: 123 };
  const r = Math.round(low.r + (high.r - low.r) * t);
  const g = Math.round(low.g + (high.g - low.g) * t);
  const b = Math.round(low.b + (high.b - low.b) * t);
  return `rgb(${r}, ${g}, ${b})`;
}
