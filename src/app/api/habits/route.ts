import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const habitSchema = z.object({
  name: z.string().min(1),
  beschreibung: z.string().optional(),
  target_minutes: z.coerce.number().int().min(1).max(600).nullable().optional(),
  aktiv: z.boolean().optional(),
});

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("habits")
    .select("id, name, beschreibung, target_minutes, aktiv")
    .eq("user_id", user.id)
    .order("name");

  if (error) {
    return NextResponse.json({ error: "Habits konnten nicht geladen werden" }, { status: 500 });
  }

  return NextResponse.json({ habits: data ?? [] });
}

export async function POST(request: Request) {
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
    return NextResponse.json({ error: "Ungueltige Eingabe" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("habits")
    .insert({
      user_id: user.id,
      name: body.name,
      beschreibung: body.beschreibung?.trim() || null,
      target_minutes: body.target_minutes ?? null,
      aktiv: body.aktiv ?? true,
    })
    .select("id, name, beschreibung, target_minutes, aktiv")
    .single();

  if (error) {
    return NextResponse.json({ error: "Habit konnte nicht erstellt werden" }, { status: 500 });
  }

  return NextResponse.json({ habit: data });
}
