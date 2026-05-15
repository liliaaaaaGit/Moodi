import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const levelParam = searchParams.get("level");
  const level = levelParam ? Number(levelParam) : NaN;

  if (!Number.isInteger(level) || level < 0 || level > 10) {
    return NextResponse.json({ error: "Ungültiges Level" }, { status: 400 });
  }

  const { data: skills, error } = await supabase
    .from("skills")
    .select("id, name, kategorie, dauer_minuten, beschreibung, level_min, level_max")
    .eq("user_id", user.id)
    .eq("aktiv", true)
    .lte("level_min", level)
    .gte("level_max", level)
    .order("name");

  if (error) {
    return NextResponse.json({ error: "Skills konnten nicht geladen werden" }, { status: 500 });
  }

  return NextResponse.json({ skills: skills ?? [] });
}
