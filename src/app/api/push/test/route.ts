import { NextResponse } from "next/server";
import { parsePushSubscription } from "@/lib/push/cron";
import { sendPushNotification } from "@/lib/push/vapid";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  const { data: settings, error } = await supabase
    .from("settings")
    .select("push_subscription")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Datenbankfehler" }, { status: 500 });
  }

  const subscription = parsePushSubscription(settings?.push_subscription);
  if (!subscription) {
    return NextResponse.json(
      { error: "Keine push_subscription in der Datenbank gespeichert" },
      { status: 400 }
    );
  }

  try {
    await sendPushNotification(subscription, {
      title: "Test von MoodiApp",
      body: "Wenn du das siehst, funktioniert Push grundsätzlich.",
    });
    return NextResponse.json({ ok: true, message: "Test-Push wurde gesendet" });
  } catch (err) {
    const detail = err instanceof Error ? err.message : "Unbekannter Fehler";
    console.error("Test-Push fehlgeschlagen:", err);
    return NextResponse.json(
      { error: `Senden fehlgeschlagen: ${detail}` },
      { status: 500 }
    );
  }
}
