import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return "";
  const stringValue = String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function toCsvRow(values: unknown[]) {
  return values.map(escapeCsv).join(",");
}

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  const [checkinsRes, completionsRes] = await Promise.all([
    supabase.from("checkins").select("*").eq("user_id", user.id).order("created_at"),
    supabase
      .from("habit_completions")
      .select("id, habit_id, completed_at, completed_date, user_id")
      .eq("user_id", user.id)
      .order("completed_at"),
  ]);

  if (checkinsRes.error || completionsRes.error) {
    return NextResponse.json({ error: "Export fehlgeschlagen" }, { status: 500 });
  }

  const checkins = checkinsRes.data ?? [];
  const completions = completionsRes.data ?? [];

  const checkinHeaders = checkins.length
    ? Object.keys(checkins[0])
    : [
        "id",
        "user_id",
        "created_at",
        "level_before",
        "level_after",
        "input_raw",
        "situation",
        "gedanken",
        "koerper",
        "gefuehl",
        "beduerfnis",
        "suggested_skill_id",
        "chosen_skill_id",
        "skill_status",
        "hilfreich",
        "comment",
        "crisis_flag",
      ];

  const lines: string[] = [];
  lines.push("CHECKINS");
  lines.push(toCsvRow(checkinHeaders));
  for (const row of checkins) {
    lines.push(toCsvRow(checkinHeaders.map((key) => (row as Record<string, unknown>)[key])));
  }

  lines.push("");
  lines.push("HABIT_COMPLETIONS");
  const completionHeaders = ["id", "habit_id", "user_id", "completed_at", "completed_date"];
  lines.push(toCsvRow(completionHeaders));
  for (const row of completions) {
    lines.push(toCsvRow(completionHeaders.map((key) => (row as Record<string, unknown>)[key])));
  }

  const csv = lines.join("\n");
  const filename = `moodi-export-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
