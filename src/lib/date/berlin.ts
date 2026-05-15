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

