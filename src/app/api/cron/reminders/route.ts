import { NextResponse } from "next/server";
import { getBerlinTimeParts, getBerlinToday } from "@/lib/date/berlin";
import {
  getDueReminderTimes,
  isValidReminderSlot,
  parsePushSubscription,
  type ReminderSlot,
} from "@/lib/push/cron";
import { sendPushNotification } from "@/lib/push/vapid";
import { createAdminClient } from "@/lib/supabase/admin";

function verifyCronSecret(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) {
    console.error("CRON_SECRET fehlt — automatische Erinnerungen werden blockiert");
    return false;
  }
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${cronSecret}`;
}

async function userHasIncompleteHabits(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
  today: string
): Promise<boolean> {
  const { data: habits } = await supabase
    .from("habits")
    .select("id")
    .eq("user_id", userId)
    .eq("aktiv", true);

  if (!habits?.length) return false;

  const habitIds = habits.map((h) => h.id);
  const { data: completions } = await supabase
    .from("habit_completions")
    .select("habit_id")
    .eq("user_id", userId)
    .eq("completed_date", today)
    .in("habit_id", habitIds);

  const completed = new Set((completions ?? []).map((row) => row.habit_id));
  return habitIds.some((id) => !completed.has(id));
}

export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json(
      {
        error:
          "Unauthorized — CRON_SECRET in Vercel setzen und mit Authorization: Bearer übereinstimmen",
      },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const slotParam = searchParams.get("slot");
  const slot: ReminderSlot | null =
    slotParam && isValidReminderSlot(slotParam) ? slotParam : null;

  const berlinNow = getBerlinTimeParts();
  const berlinTimeLabel = `${String(berlinNow.hour).padStart(2, "0")}:${String(berlinNow.minute).padStart(2, "0")}`;

  const title = "Anspannung";
  const checkinBody = "Magst du einen kurzen Check-in machen?";
  const habitBody = "Schon Atem-Ritual gemacht?";

  const supabase = createAdminClient();
  const today = getBerlinToday();

  const { data: settingsRows, error } = await supabase
    .from("settings")
    .select("user_id, reminder_times, push_subscription")
    .not("push_subscription", "is", null);

  if (error) {
    return NextResponse.json({ error: "Datenbankfehler" }, { status: 500 });
  }

  let sent = 0;
  let skipped = 0;
  const failures: string[] = [];

  for (const row of settingsRows ?? []) {
    const subscription = parsePushSubscription(row.push_subscription);
    if (!subscription) {
      skipped += 1;
      continue;
    }

    const dueTimes = getDueReminderTimes(row.reminder_times);
    if (dueTimes.length === 0) {
      skipped += 1;
      continue;
    }

    const sendHabit =
      slot === "habit" &&
      (await userHasIncompleteHabits(supabase, row.user_id, today));

    const body = sendHabit ? habitBody : checkinBody;

    try {
      await sendPushNotification(subscription, { title, body });
      sent += 1;
    } catch (err) {
      failures.push(row.user_id);
      console.error("Push fehlgeschlagen:", row.user_id, err);
    }
  }

  return NextResponse.json({
    slot,
    berlinTime: berlinTimeLabel,
    sent,
    skipped,
    failures: failures.length,
  });
}
