import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  level: z.number().int().min(0).max(10),
  text: z.string().max(8000).optional().default(""),
  checkinId: z.string().uuid().optional(),
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
    return NextResponse.json({ error: "Ungültige Eingabe" }, { status: 400 });
  }

  if (body.checkinId) {
    const { data: existing } = await supabase
      .from("checkins")
      .select("id, crisis_flag")
      .eq("id", body.checkinId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing?.crisis_flag) {
      return NextResponse.json({ checkinId: existing.id });
    }
  }

  const trimmedText = (body.text ?? "").trim();

  const { data, error } = await supabase
    .from("checkins")
    .insert({
      user_id: user.id,
      level_before: body.level,
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

  return NextResponse.json({ checkinId: data.id });
}
