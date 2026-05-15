import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  expirationTime: z.number().nullable().optional(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

const bodySchema = z.object({
  subscription: subscriptionSchema,
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
    return NextResponse.json({ error: "Ungueltige Subscription" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("settings")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const push_subscription = body.subscription;

  if (existing) {
    const { error } = await supabase
      .from("settings")
      .update({ push_subscription })
      .eq("user_id", user.id);
    if (error) {
      return NextResponse.json({ error: "Speichern fehlgeschlagen" }, { status: 500 });
    }
  } else {
    const { error } = await supabase.from("settings").insert({
      user_id: user.id,
      push_subscription,
    });
    if (error) {
      return NextResponse.json({ error: "Speichern fehlgeschlagen" }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
