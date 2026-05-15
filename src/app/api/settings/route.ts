import { NextResponse } from "next/server";
import { z } from "zod";
import { hashPin } from "@/lib/pin/hash";
import { createClient } from "@/lib/supabase/server";

const contactSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
});

const patchSchema = z.object({
  pin: z.string().regex(/^\d{4}$/).optional(),
  disablePin: z.boolean().optional(),
  notfallkontakte: z.array(contactSchema).optional(),
  reminder_times: z.array(z.string().regex(/^\d{2}:\d{2}$/)).length(3).optional(),
});

function parseContacts(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (item): item is { name: string; phone: string } =>
      typeof item === "object" &&
      item !== null &&
      "name" in item &&
      "phone" in item &&
      typeof (item as { name: unknown }).name === "string" &&
      typeof (item as { phone: unknown }).phone === "string"
  );
}

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  const { data: settings } = await supabase
    .from("settings")
    .select("pin_hash, notfallkontakte, reminder_times, push_subscription")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!settings) {
    return NextResponse.json({
      pinEnabled: false,
      notfallkontakte: [],
      reminder_times: ["10:00", "15:00", "21:00"],
      pushSubscribed: false,
    });
  }

  return NextResponse.json({
    pinEnabled: Boolean(settings.pin_hash),
    notfallkontakte: parseContacts(settings.notfallkontakte),
    reminder_times: settings.reminder_times ?? ["10:00", "15:00", "21:00"],
    pushSubscribed: Boolean(settings.push_subscription),
  });
}

export async function PATCH(request: Request) {
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

  if (body.disablePin) {
    updates.pin_hash = null;
  } else if (body.pin) {
    updates.pin_hash = hashPin(body.pin);
  }

  if (body.notfallkontakte !== undefined) {
    updates.notfallkontakte = body.notfallkontakte;
  }

  if (body.reminder_times !== undefined) {
    updates.reminder_times = body.reminder_times;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Keine Aenderungen" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("settings")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!existing) {
    const { error } = await supabase.from("settings").insert({
      user_id: user.id,
      ...updates,
    });
    if (error) {
      return NextResponse.json({ error: "Speichern fehlgeschlagen" }, { status: 500 });
    }
  } else {
    const { error } = await supabase
      .from("settings")
      .update(updates)
      .eq("user_id", user.id);
    if (error) {
      return NextResponse.json({ error: "Speichern fehlgeschlagen" }, { status: 500 });
    }
  }

  const { data: settings } = await supabase
    .from("settings")
    .select("pin_hash, notfallkontakte, reminder_times, push_subscription")
    .eq("user_id", user.id)
    .single();

  return NextResponse.json({
    pinEnabled: Boolean(settings?.pin_hash),
    notfallkontakte: parseContacts(settings?.notfallkontakte),
    reminder_times: settings?.reminder_times ?? ["10:00", "15:00", "21:00"],
    pushSubscribed: Boolean(settings?.push_subscription),
  });
}
