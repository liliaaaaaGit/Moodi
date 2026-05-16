import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { fetchSvvSkill } from "@/lib/checkin/suggest-skill";
import { createClient } from "@/lib/supabase/server";

const skillStatusEnum = z.enum([
  "gemacht",
  "nicht_gemacht",
  "anderer",
  "uebersprungen",
]);

const patchSchema = z.object({
  level_before: z.number().int().min(0).max(10).optional(),
  situation: z.string().max(5000).nullable().optional(),
  gedanken: z.string().max(5000).nullable().optional(),
  koerper: z.string().max(5000).nullable().optional(),
  gefuehl: z.string().max(5000).nullable().optional(),
  beduerfnis: z.string().max(5000).nullable().optional(),
  level_after: z.number().int().min(0).max(10).nullable().optional(),
  hilfreich: z.enum(["ja", "bisschen", "nein"]).nullable().optional(),
  comment: z.string().max(2000).nullable().optional(),
  chosen_skill_id: z.string().uuid().nullable().optional(),
  chosen_long_skill_id: z.string().uuid().nullable().optional(),
  chosen_svv_skill_id: z.string().uuid().nullable().optional(),
  skill_status: skillStatusEnum.nullable().optional(),
  long_skill_status: skillStatusEnum.nullable().optional(),
  svv_skill_status: skillStatusEnum.nullable().optional(),
});

type RouteContext = {
  params: { id: string };
};

async function loadSkill(
  supabase: ReturnType<typeof createClient>,
  skillId: string | null
) {
  if (!skillId) return null;
  const { data: skill } = await supabase
    .from("skills")
    .select("id, name, kategorie, dauer_minuten, beschreibung")
    .eq("id", skillId)
    .maybeSingle();
  return skill;
}

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
      "id, created_at, level_before, level_after, input_raw, situation, gedanken, koerper, gefuehl, beduerfnis, suggested_skill_id, suggested_long_skill_id, chosen_skill_id, chosen_long_skill_id, chosen_svv_skill_id, svv_flag, crisis_flag, hilfreich, comment, skill_status, long_skill_status, svv_skill_status"
    )
    .eq("id", params.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !checkin) {
    return NextResponse.json({ error: "Check-in nicht gefunden" }, { status: 404 });
  }

  const [suggestedSkill, suggestedLongSkill, svvSkill] = await Promise.all([
    loadSkill(supabase, checkin.suggested_skill_id),
    loadSkill(supabase, checkin.suggested_long_skill_id),
    checkin.svv_flag
      ? fetchSvvSkill(supabase, user.id)
      : Promise.resolve(null),
  ]);

  return NextResponse.json({
    checkin: {
      ...checkin,
      suggested_skill: suggestedSkill,
      suggested_long_skill: suggestedLongSkill,
      svv_skill: svvSkill,
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
    return NextResponse.json({ error: "Ungültige Eingabe" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};

  if (body.level_before !== undefined) updates.level_before = body.level_before;
  if (body.situation !== undefined) updates.situation = body.situation;
  if (body.gedanken !== undefined) updates.gedanken = body.gedanken;
  if (body.koerper !== undefined) updates.koerper = body.koerper;
  if (body.gefuehl !== undefined) updates.gefuehl = body.gefuehl;
  if (body.beduerfnis !== undefined) updates.beduerfnis = body.beduerfnis;
  if (body.level_after !== undefined) updates.level_after = body.level_after;
  if (body.hilfreich !== undefined) updates.hilfreich = body.hilfreich;
  if (body.comment !== undefined) updates.comment = body.comment;
  if (body.chosen_skill_id !== undefined) updates.chosen_skill_id = body.chosen_skill_id;
  if (body.chosen_long_skill_id !== undefined) {
    updates.chosen_long_skill_id = body.chosen_long_skill_id;
  }
  if (body.chosen_svv_skill_id !== undefined) {
    updates.chosen_svv_skill_id = body.chosen_svv_skill_id;
  }
  if (body.skill_status !== undefined) updates.skill_status = body.skill_status;
  if (body.long_skill_status !== undefined) {
    updates.long_skill_status = body.long_skill_status;
  }
  if (body.svv_skill_status !== undefined) {
    updates.svv_skill_status = body.svv_skill_status;
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

  revalidatePath("/");
  revalidatePath("/history");

  return NextResponse.json({ ok: true, checkinId: data.id });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("checkins")
    .delete()
    .eq("id", params.id)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: "Check-in nicht gefunden" }, { status: 404 });
  }

  revalidatePath("/");
  revalidatePath("/history");

  return NextResponse.json({ ok: true });
}
