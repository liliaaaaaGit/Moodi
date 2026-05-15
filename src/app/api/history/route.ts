import { NextResponse } from "next/server";
import { z } from "zod";
import {
  buildHistoryAnalytics,
  type HistoryRange,
} from "@/lib/history/analytics";
import { createClient } from "@/lib/supabase/server";

const rangeSchema = z.enum(["week", "month", "all"]);

export async function GET(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = rangeSchema.safeParse(searchParams.get("range") ?? "week");
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültiger Zeitraum" }, { status: 400 });
  }

  const range = parsed.data as HistoryRange;

  const [checkinsRes, skillsRes, habitRes] = await Promise.all([
    supabase
      .from("checkins")
      .select(
        "id, created_at, level_before, situation, input_raw, chosen_skill_id, hilfreich"
      )
      .eq("user_id", user.id)
      .eq("crisis_flag", false)
      .order("created_at", { ascending: true }),
    supabase.from("skills").select("id, name").eq("user_id", user.id),
    supabase
      .from("habits")
      .select("id")
      .eq("user_id", user.id)
      .eq("name", "Atemfokus 5 Minuten")
      .maybeSingle(),
  ]);

  if (checkinsRes.error) {
    return NextResponse.json(
      { error: "Check-ins konnten nicht geladen werden" },
      { status: 500 }
    );
  }

  let breathCompletions: { completed_date: string }[] = [];
  if (habitRes.data?.id) {
    const startDay = new Date();
    startDay.setDate(startDay.getDate() - 13);
    const { data } = await supabase
      .from("habit_completions")
      .select("completed_date")
      .eq("user_id", user.id)
      .eq("habit_id", habitRes.data.id)
      .gte(
        "completed_date",
        startDay.toLocaleDateString("en-CA", { timeZone: "Europe/Berlin" })
      );
    breathCompletions = data ?? [];
  }

  const analytics = buildHistoryAnalytics(
    checkinsRes.data ?? [],
    skillsRes.data ?? [],
    breathCompletions,
    range
  );

  return NextResponse.json(analytics);
}
