import { NextResponse } from "next/server";
import {
  pickCrisisShortSkills,
  pickUmgebungswechselSkills,
} from "@/lib/checkin/crisis-skills";
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
    .select(
      "id, name, kategorie, dauer_minuten, beschreibung, aktiv, ist_lang, level_max"
    )
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json(
      { error: "Skills konnten nicht geladen werden" },
      { status: 500 }
    );
  }

  const rows = skills ?? [];
  const active = rows.filter((skill) => skill.aktiv);

  return NextResponse.json({
    shortSkills: pickCrisisShortSkills(active),
    umgebungSkills: pickUmgebungswechselSkills(rows),
  });
}
