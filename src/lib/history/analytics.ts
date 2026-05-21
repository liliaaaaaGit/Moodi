
export type HistoryRange = "week" | "month" | "all";

export type RawCheckin = {
  id: string;
  created_at: string;
  level_before: number;
  situation: string | null;
  input_raw: string | null;
  chosen_skill_id: string | null;
  hilfreich: string | null;
  trigger_id: string | null;
  not_spiraling_context: string | null;
  triggers?: { label: string } | null;
};

export type RankedInsightItem = {
  label: string;
  count: number;
  avgLevel: number;
};

type LabelGroup = {
  displayLabel: string;
  count: number;
  levelSum: number;
};

function normalizeLabelKey(label: string): string {
  return label.trim().toLowerCase();
}

function addToLabelGroup(
  groups: Map<string, LabelGroup>,
  rawLabel: string,
  levelBefore: number
) {
  const trimmed = rawLabel.trim();
  if (!trimmed) return;

  const key = normalizeLabelKey(trimmed);
  const existing = groups.get(key);
  if (existing) {
    existing.count += 1;
    existing.levelSum += levelBefore;
    return;
  }

  groups.set(key, {
    displayLabel: trimmed,
    count: 1,
    levelSum: levelBefore,
  });
}

function toRankedItems(
  groups: Map<string, LabelGroup>,
  limit: number,
  tieBreakByAvgLevel: boolean
): RankedInsightItem[] {
  return Array.from(groups.values())
    .map((entry) => ({
      label: entry.displayLabel,
      count: entry.count,
      avgLevel: Math.round((entry.levelSum / entry.count) * 10) / 10,
    }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      if (tieBreakByAvgLevel && b.avgLevel !== a.avgLevel) {
        return b.avgLevel - a.avgLevel;
      }
      return a.label.localeCompare(b.label, "de");
    })
    .slice(0, limit);
}

type TriggerJoinRow = { label: string } | { label: string }[] | null;

/** Supabase liefert FK-Joins je nach Typisierung als Objekt oder Array. */
export function normalizeTriggerJoin(
  triggers: TriggerJoinRow | undefined
): { label: string } | null {
  if (!triggers) return null;
  if (Array.isArray(triggers)) return triggers[0] ?? null;
  return triggers;
}

export function normalizeHistoryCheckins<T extends Omit<RawCheckin, "triggers"> & {
  triggers?: TriggerJoinRow;
}>(rows: T[]): RawCheckin[] {
  return rows.map((row) => ({
    ...row,
    triggers: normalizeTriggerJoin(row.triggers),
  }));
}

export type SkillRow = { id: string; name: string };

const WEEKDAY_LABELS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

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

/** Top-5 Stressor-Labels (Level ≥ 6), gruppiert case-insensitive nach TRIM. */
export function extractStressors(
  checkins: RawCheckin[],
  range: HistoryRange,
  limit = 5
): RankedInsightItem[] {
  const groups = new Map<string, LabelGroup>();

  for (const checkin of filterByRange(checkins, range)) {
    if (checkin.level_before < 6 || !checkin.trigger_id) continue;
    const label = checkin.triggers?.label;
    if (!label) continue;
    addToLabelGroup(groups, label, checkin.level_before);
  }

  return toRankedItems(groups, limit, true);
}

/** Top-7 Entspannungskontexte (Level 0–4), gruppiert case-insensitive nach TRIM. */
export function extractNotSpiraling(
  checkins: RawCheckin[],
  range: HistoryRange,
  limit = 7
): RankedInsightItem[] {
  const groups = new Map<string, LabelGroup>();

  for (const checkin of filterByRange(checkins, range)) {
    if (checkin.level_before >= 5) continue;
    const label = checkin.not_spiraling_context;
    if (!label) continue;
    addToLabelGroup(groups, label, checkin.level_before);
  }

  return toRankedItems(groups, limit, false);
}

function computeAvgLevel(checkins: RawCheckin[]): number {
  if (checkins.length === 0) return 0;
  const sum = checkins.reduce((acc, c) => acc + c.level_before, 0);
  return Math.round((sum / checkins.length) * 10) / 10;
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
    avgLevel: computeAvgLevel(filtered),
    stressors: extractStressors(allCheckins, range, 5),
    notSpiraling: extractNotSpiraling(allCheckins, range, 7),
    helpfulSkills: extractHelpfulSkills(allCheckins, skillMap),
    breathRitual: buildBreathRitual(breathCompletions),
  };
}
