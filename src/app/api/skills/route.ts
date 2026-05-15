import { NextResponse } from "next/server";
import { skillFormSchema } from "@/lib/skills/schema";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  const { data: skills, error } = await supabase
    .from("skills")
    .select("id, name, kategorie, aktiv, level_min, level_max")
    .eq("user_id", user.id)
    .order("name");

  if (error) {
    return NextResponse.json({ error: "Skills konnten nicht geladen werden" }, { status: 500 });
  }

  return NextResponse.json({ skills: skills ?? [] });
}

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Eingabe" }, { status: 400 });
  }

  const parsed = skillFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültige Eingabe" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("skills")
    .insert({
      user_id: user.id,
      name: parsed.data.name,
      kategorie: parsed.data.kategorie,
      dauer_minuten: parsed.data.dauer_minuten ?? null,
      level_min: parsed.data.level_min,
      level_max: parsed.data.level_max,
      beschreibung: parsed.data.beschreibung?.trim() || null,
      aktiv: parsed.data.aktiv ?? true,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: "Skill konnte nicht erstellt werden" }, { status: 500 });
  }

  return NextResponse.json({ id: data.id });
}
