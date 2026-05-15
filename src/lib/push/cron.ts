import type webpush from "web-push";

export type ReminderSlot = "morning" | "noon" | "evening" | "habit";

export const SLOT_REMINDER_TIME: Record<Exclude<ReminderSlot, "habit">, string> = {
  morning: "10:00",
  noon: "15:00",
  evening: "21:00",
};

export function isValidReminderSlot(slot: string | null): slot is ReminderSlot {
  return slot === "morning" || slot === "noon" || slot === "evening" || slot === "habit";
}

export function reminderTimeMatches(
  reminderTimes: string[] | null | undefined,
  targetTime: string
): boolean {
  if (!reminderTimes?.length) {
    return targetTime === "10:00" || targetTime === "15:00" || targetTime === "21:00";
  }
  return reminderTimes.includes(targetTime);
}

export function parsePushSubscription(raw: unknown): webpush.PushSubscription | null {
  if (!raw || typeof raw !== "object") return null;
  const sub = raw as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
  if (!sub.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) return null;
  return {
    endpoint: sub.endpoint,
    keys: {
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
    },
  };
}
