const STORAGE_KEY = "pinUnlockedUntil";
const UNLOCK_DURATION_MS = 24 * 60 * 60 * 1000;

export function setPinUnlocked() {
  if (typeof window === "undefined") return;
  const until = Date.now() + UNLOCK_DURATION_MS;
  localStorage.setItem(STORAGE_KEY, String(until));
}

export function clearPinUnlocked() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export function isPinUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return false;
  const until = Number(raw);
  if (!Number.isFinite(until) || until < Date.now()) {
    localStorage.removeItem(STORAGE_KEY);
    return false;
  }
  return true;
}
