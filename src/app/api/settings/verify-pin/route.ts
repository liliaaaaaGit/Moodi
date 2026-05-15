import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyPin } from "@/lib/pin/hash";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  pin: z.string().regex(/^\d{4}$/),
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
    return NextResponse.json({ error: "Ungültige PIN" }, { status: 400 });
  }

  const { data: settings } = await supabase
    .from("settings")
    .select("pin_hash")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!settings?.pin_hash) {
    return NextResponse.json({ ok: true });
  }

  if (!verifyPin(body.pin, settings.pin_hash)) {
    return NextResponse.json({ error: "Falsche PIN" }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
