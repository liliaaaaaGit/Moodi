import { NextResponse } from "next/server";
import { getBerlinToday } from "@/lib/date/berlin";
import {
  isValidReminderSlot,
  parsePushSubscription,
  reminderTimeMatches,
  SLOT_REMINDER_TIME,
  type ReminderSlot,
} from "@/lib/push/cron";
import { sendPushNotification } from "@/lib/push/vapid";
import { createAdminClient } from "@/lib/supabase/admin";

function verifyCronSecret(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV !== "production";

  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
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
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const slotParam = searchParams.get("slot");

  if (!isValidReminderSlot(slotParam)) {
    return NextResponse.json({ error: "Ungültiger slot" }, { status: 400 });
  }

  const slot = slotParam as ReminderSlot;

  const title = "Anspannung";
  let body = "";

  if (slot === "habit") {
    body = "Schon Atem-Ritual gemacht?";
  } else {
    body = "Magst du einen kurzen Check-in machen?";
  }

  const targetTime =
    slot === "habit" ? SLOT_REMINDER_TIME.evening : SLOT_REMINDER_TIME[slot];

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

    if (slot !== "habit" && !reminderTimeMatches(row.reminder_times, targetTime)) {
      skipped += 1;
      continue;
    }

    if (slot === "habit") {
      if (!reminderTimeMatches(row.reminder_times, targetTime)) {
        skipped += 1;
        continue;
      }
      const incomplete = await userHasIncompleteHabits(supabase, row.user_id, today);
      if (!incomplete) {
        skipped += 1;
        continue;
      }
    }

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
    targetTime,
    sent,
    skipped,
    failures: failures.length,
  });
}
