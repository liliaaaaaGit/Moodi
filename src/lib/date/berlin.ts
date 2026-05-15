const BERLIN_TZ = "Europe/Berlin";

export function getBerlinToday(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: BERLIN_TZ });
}

export function getBerlinHour(date = new Date()): number {
  return Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: BERLIN_TZ,
      hour: "numeric",
      hour12: false,
    }).format(date)
  );
}

export function getBerlinTimeParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: BERLIN_TZ,
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(date);

  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return { hour, minute, totalMinutes: hour * 60 + minute };
}

export function isSameBerlinDay(isoDate: string, day = getBerlinToday()): boolean {
  return (
    new Date(isoDate).toLocaleDateString("en-CA", { timeZone: BERLIN_TZ }) === day
  );
}

export function formatBerlinTime(isoDate: string): string {
  return new Intl.DateTimeFormat("de-DE", {
    timeZone: BERLIN_TZ,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(isoDate));
}

export function getGreeting(): string {
  const hour = getBerlinHour();
  if (hour < 12) return "Guten Morgen";
  if (hour < 18) return "Schoenen Mittag";
  return "Schoenen Abend";
}

export function shouldShowCatchUpReminder(
  checkinsToday: { created_at: string }[]
): boolean {
  const { totalMinutes } = getBerlinTimeParts();
  if (totalMinutes <= 11 * 60) return false;

  const hasMorningEntry = checkinsToday.some((checkin) => {
    const { totalMinutes: checkinMinutes } = getBerlinTimeParts(
      new Date(checkin.created_at)
    );
    return checkinMinutes < 11 * 60;
  });

  return !hasMorningEntry;
}
