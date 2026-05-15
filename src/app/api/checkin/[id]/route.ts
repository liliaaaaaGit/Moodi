import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const patchSchema = z.object({
  chosen_skill_id: z.string().uuid().nullable().optional(),
  skill_status: z
    .enum(["gemacht", "nicht_gemacht", "anderer", "uebersprungen"])
    .optional(),
  level_after: z.number().int().min(0).max(10).optional(),
  hilfreich: z.enum(["ja", "bisschen", "nein"]).optional(),
  comment: z.string().max(2000).nullable().optional(),
});

type RouteContext = {
  params: { id: string };
};

export async function GET(_request: Request, { params }: RouteContext) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  const { data: checkin, error } = await supabase
    .from("checkins")
    .select(
      "id, level_before, level_after, input_raw, situation, gedanken, koerper, gefuehl, beduerfnis, suggested_skill_id, crisis_flag, hilfreich, comment, skill_status, chosen_skill_id"
    )
    .eq("id", params.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !checkin) {
    return NextResponse.json({ error: "Check-in nicht gefunden" }, { status: 404 });
  }

  let suggestedSkill = null;
  if (checkin.suggested_skill_id) {
    const { data: skill } = await supabase
      .from("skills")
      .select("id, name, kategorie, dauer_minuten, beschreibung")
      .eq("id", checkin.suggested_skill_id)
      .maybeSingle();
    suggestedSkill = skill;
  }

  return NextResponse.json({
    checkin: {
      ...checkin,
      suggested_skill: suggestedSkill,
    },
  });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  let body: z.infer<typeof patchSchema>;
  try {
    body = patchSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Ungueltige Eingabe" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};

  if (body.chosen_skill_id !== undefined) {
    updates.chosen_skill_id = body.chosen_skill_id;
  }
  if (body.skill_status !== undefined) {
    updates.skill_status = body.skill_status;
  }
  if (body.level_after !== undefined) {
    updates.level_after = body.level_after;
  }
  if (body.hilfreich !== undefined) {
    updates.hilfreich = body.hilfreich;
  }
  if (body.comment !== undefined) {
    updates.comment = body.comment;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Keine Felder zum Aktualisieren" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("checkins")
    .update(updates)
    .eq("id", params.id)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: "Check-in nicht gefunden" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, checkinId: data.id });
}
