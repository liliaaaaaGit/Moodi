import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const habitSchema = z.object({
  name: z.string().min(1).optional(),
  beschreibung: z.string().nullable().optional(),
  target_minutes: z.coerce.number().int().min(1).max(600).nullable().optional(),
  aktiv: z.boolean().optional(),
});

type RouteContext = { params: { id: string } };

export async function PATCH(request: Request, { params }: RouteContext) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  let body: z.infer<typeof habitSchema>;
  try {
    body = habitSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Ungültige Eingabe" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("habits")
    .update({
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.beschreibung !== undefined ? { beschreibung: body.beschreibung } : {}),
      ...(body.target_minutes !== undefined ? { target_minutes: body.target_minutes } : {}),
      ...(body.aktiv !== undefined ? { aktiv: body.aktiv } : {}),
    })
    .eq("id", params.id)
    .eq("user_id", user.id)
    .select("id, name, beschreibung, target_minutes, aktiv")
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: "Habit nicht gefunden" }, { status: 404 });
  }

  return NextResponse.json({ habit: data });
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
    .from("habits")
    .delete()
    .eq("id", params.id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: "Habit konnte nicht gelöscht werden" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
