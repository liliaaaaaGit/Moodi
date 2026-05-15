import { NextResponse } from "next/server";
import { skillFormSchema } from "@/lib/skills/schema";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: { id: string } };

export async function PATCH(request: Request, { params }: RouteContext) {
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
    return NextResponse.json({ error: "Ungueltige Eingabe" }, { status: 400 });
  }

  const parsed = skillFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungueltige Eingabe" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("skills")
    .update({
      name: parsed.data.name,
      kategorie: parsed.data.kategorie,
      dauer_minuten: parsed.data.dauer_minuten ?? null,
      level_min: parsed.data.level_min,
      level_max: parsed.data.level_max,
      beschreibung: parsed.data.beschreibung?.trim() || null,
      aktiv: parsed.data.aktiv ?? true,
    })
    .eq("id", params.id)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: "Skill nicht gefunden" }, { status: 404 });
  }

  return NextResponse.json({ id: data.id });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  const { error } = await supabase
    .from("skills")
    .delete()
    .eq("id", params.id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: "Skill konnte nicht geloescht werden" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
