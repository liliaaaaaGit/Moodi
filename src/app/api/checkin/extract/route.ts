import { NextResponse } from "next/server";
import { z } from "zod";
import { isCrisis } from "@/lib/checkin/crisis";
import { extractCheckinText } from "@/lib/checkin/extract";
import { pickSuggestedSkill } from "@/lib/checkin/suggest-skill";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  level: z.number().int().min(0).max(10),
  text: z.string().max(8000),
});

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Ungueltige Eingabe" }, { status: 400 });
  }

  const { level, text } = body;
  const trimmedText = text.trim();

  if (isCrisis({ level, text: trimmedText })) {
    const { data, error } = await supabase
      .from("checkins")
      .insert({
        user_id: user.id,
        level_before: level,
        input_raw: trimmedText || null,
        crisis_flag: true,
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Check-in konnte nicht gespeichert werden" },
        { status: 500 }
      );
    }

    return NextResponse.json({ crisis: true, checkinId: data.id });
  }

  let extracted = {
    situation: "",
    gedanken: "",
    koerper: "",
    gefuehl: "",
    beduerfnis: "",
  };

  if (trimmedText) {
    try {
      extracted = await extractCheckinText(level, trimmedText);
    } catch {
      return NextResponse.json(
        { error: "Auswertung fehlgeschlagen. Bitte versuche es erneut." },
        { status: 502 }
      );
    }
  }

  const suggestedSkill = await pickSuggestedSkill(supabase, user.id, level);

  const { data, error } = await supabase
    .from("checkins")
    .insert({
      user_id: user.id,
      level_before: level,
      input_raw: trimmedText || null,
      situation: extracted.situation || null,
      gedanken: extracted.gedanken || null,
      koerper: extracted.koerper || null,
      gefuehl: extracted.gefuehl || null,
      beduerfnis: extracted.beduerfnis || null,
      suggested_skill_id: suggestedSkill?.id ?? null,
      crisis_flag: false,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Check-in konnte nicht gespeichert werden" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    crisis: false,
    checkinId: data.id,
    suggestedSkill: suggestedSkill
      ? {
          id: suggestedSkill.id,
          name: suggestedSkill.name,
          kategorie: suggestedSkill.kategorie,
          dauer_minuten: suggestedSkill.dauer_minuten,
          beschreibung: suggestedSkill.beschreibung,
        }
      : null,
  });
}
