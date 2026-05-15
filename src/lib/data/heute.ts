import {
  formatBerlinTime,
  getBerlinToday,
  isSameBerlinDay,
} from "@/lib/date/berlin";
import { createClient } from "@/lib/supabase/server";

export type TodayCheckin = {
  id: string;
  created_at: string;
  level_before: number;
  situation: string | null;
  input_raw: string | null;
};

export type TodayHabit = {
  id: string;
  name: string;
  beschreibung: string | null;
  target_minutes: number | null;
  completed: boolean;
};

function getExcerpt(checkin: TodayCheckin): string | null {
  const text = checkin.situation?.trim() || checkin.input_raw?.trim();
  if (!text) return null;
  return text.length > 80 ? `${text.slice(0, 80)}…` : text;
}

export async function loadHeuteData() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const today = getBerlinToday();
  const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

  const [checkinsRes, habitsRes, completionsRes] = await Promise.all([
    supabase
      .from("checkins")
      .select("id, created_at, level_before, situation, input_raw")
      .eq("user_id", user.id)
      .gte("created_at", since)
      .order("created_at", { ascending: true }),
    supabase
      .from("habits")
      .select("id, name, beschreibung, target_minutes")
      .eq("user_id", user.id)
      .eq("aktiv", true)
      .order("name"),
    supabase
      .from("habit_completions")
      .select("habit_id")
      .eq("user_id", user.id)
      .eq("completed_date", today),
  ]);

  const checkinsToday = (checkinsRes.data ?? []).filter((row) =>
    isSameBerlinDay(row.created_at, today)
  ) as TodayCheckin[];

  const completedIds = new Set(
    (completionsRes.data ?? []).map((row) => row.habit_id)
  );

  const habits: TodayHabit[] = (habitsRes.data ?? []).map((habit) => ({
    ...habit,
    completed: completedIds.has(habit.id),
  }));

  const sparkline = checkinsToday.map((checkin) => ({
    id: checkin.id,
    time: formatBerlinTime(checkin.created_at),
    level: checkin.level_before,
  }));

  const listItems = checkinsToday
    .slice()
    .reverse()
    .map((checkin) => ({
      ...checkin,
      excerpt: getExcerpt(checkin),
    }));

  return {
    checkinsToday,
    habits,
    sparkline,
    listItems,
  };
}
