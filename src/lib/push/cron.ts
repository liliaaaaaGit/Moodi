import type webpush from "web-push";
import { getBerlinTimeParts } from "@/lib/date/berlin";

export type ReminderSlot = "morning" | "noon" | "evening" | "habit";

export const DEFAULT_REMINDER_TIMES = ["10:00", "15:00", "21:00"] as const;

export const SLOT_REMINDER_TIME: Record<Exclude<ReminderSlot, "habit">, string> = {
  morning: "10:00",
  noon: "15:00",
  evening: "21:00",
};

/** Hobby-Cron kann bis ~59 Min innerhalb der Stunde auslösen — großzügiges Fenster. */
export const REMINDER_WINDOW_MINUTES = 55;

export function isValidReminderSlot(slot: string | null): slot is ReminderSlot {
  return slot === "morning" || slot === "noon" || slot === "evening" || slot === "habit";
}

export function normalizeReminderTime(time: string): string {
  const match = time.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return time.trim();
  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

export function getEffectiveReminderTimes(
  reminderTimes: string[] | null | undefined
): string[] {
  const source =
    reminderTimes?.length && reminderTimes.length > 0
      ? reminderTimes
      : [...DEFAULT_REMINDER_TIMES];
  return source.map(normalizeReminderTime);
}

/** Prüft anhand der Berliner Uhrzeit, ob jetzt eine Erinnerung fällig ist. */
export function isReminderDueNow(
  reminderTimes: string[] | null | undefined,
  windowMinutes = REMINDER_WINDOW_MINUTES,
  now = new Date()
): boolean {
  const times = getEffectiveReminderTimes(reminderTimes);
  const { hour, minute } = getBerlinTimeParts(now);
  const nowMinutes = hour * 60 + minute;

  return times.some((time) => {
    const [h, m] = time.split(":").map(Number);
    const targetMinutes = h * 60 + m;
    const diff = Math.abs(nowMinutes - targetMinutes);
    const wrapped = Math.min(diff, 24 * 60 - diff);
    return wrapped <= windowMinutes;
  });
}

/** Welche Erinnerungszeiten gerade fällig sind (für Logs). */
export function getDueReminderTimes(
  reminderTimes: string[] | null | undefined,
  windowMinutes = REMINDER_WINDOW_MINUTES,
  now = new Date()
): string[] {
  const times = getEffectiveReminderTimes(reminderTimes);
  const { hour, minute } = getBerlinTimeParts(now);
  const nowMinutes = hour * 60 + minute;

  return times.filter((time) => {
    const [h, m] = time.split(":").map(Number);
    const targetMinutes = h * 60 + m;
    const diff = Math.abs(nowMinutes - targetMinutes);
    const wrapped = Math.min(diff, 24 * 60 - diff);
    return wrapped <= windowMinutes;
  });
}

export function reminderTimeMatches(
  reminderTimes: string[] | null | undefined,
  targetTime: string
): boolean {
  const normalizedTarget = normalizeReminderTime(targetTime);
  return getEffectiveReminderTimes(reminderTimes).includes(normalizedTarget);
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
