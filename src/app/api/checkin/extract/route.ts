import { NextResponse } from "next/server";
import { z } from "zod";
import { isCrisis } from "@/lib/checkin/crisis";
import { ExtractParseError, extractCheckinText } from "@/lib/checkin/extract";
import {
  fetchSvvSkill,
  pickSuggestedLongSkill,
  pickSuggestedShortSkill,
  skillToPayload,
} from "@/lib/checkin/suggest-skill";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  level: z.number().int().min(0).max(10),
  text: z.string().max(8000),
});

const emptyExtracted = {
  situation: "",
  gedanken: "",
  koerper: "",
  gefuehl: "",
  beduerfnis: "",
};

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
    return NextResponse.json({ error: "Ungültige Eingabe" }, { status: 400 });
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

  let extracted = { ...emptyExtracted };
  let svvFlag = false;

  if (trimmedText) {
    try {
      const aiResult = await extractCheckinText(level, trimmedText);
      extracted = {
        situation: aiResult.situation,
        gedanken: aiResult.gedanken,
        koerper: aiResult.koerper,
        gefuehl: aiResult.gefuehl,
        beduerfnis: aiResult.beduerfnis,
      };
      svvFlag = aiResult.svv_intent;
    } catch (err) {
      const message =
        err instanceof ExtractParseError
          ? "Auswertung fehlgeschlagen. Bitte versuche es erneut."
          : err instanceof Error && err.message === "OPENAI_API_KEY fehlt"
            ? "KI ist nicht konfiguriert."
            : "Auswertung fehlgeschlagen. Bitte versuche es erneut.";

      return NextResponse.json({ error: message }, { status: 502 });
    }
  }

  const [suggestedSkill, suggestedLongSkill] = await Promise.all([
    pickSuggestedShortSkill(supabase, user.id, level),
    pickSuggestedLongSkill(supabase, user.id, level),
  ]);

  const svvSkill = svvFlag ? await fetchSvvSkill(supabase, user.id) : null;

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
      suggested_long_skill_id: suggestedLongSkill?.id ?? null,
      svv_flag: svvFlag,
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
    suggestedSkill: skillToPayload(suggestedSkill),
    suggestedLongSkill: skillToPayload(suggestedLongSkill),
    svvFlag,
    svvSkill: skillToPayload(svvSkill),
  });
}
