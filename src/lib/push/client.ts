const PUSH_ASKED_KEY = "pushOptInAsked";
const PUSH_DISMISSED_KEY = "pushOptInDismissed";

export function isStandalonePwa(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator &&
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
}

export function isIosSafari(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  const isIos = /iPad|iPhone|iPod/.test(ua);
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|Chrome/.test(ua);
  return isIos && isSafari;
}

export function hasPushBeenAsked(): boolean {
  return localStorage.getItem(PUSH_ASKED_KEY) === "1";
}

export function markPushAsked() {
  localStorage.setItem(PUSH_ASKED_KEY, "1");
}

export function markPushDismissed() {
  localStorage.setItem(PUSH_DISMISSED_KEY, "1");
  markPushAsked();
}

export function isIosInstallHintDismissed(): boolean {
  return localStorage.getItem("iosInstallHintDismissed") === "1";
}

export function dismissIosInstallHint() {
  localStorage.setItem("iosInstallHintDismissed", "1");
}

function cleanEnv(value: string | undefined) {
  return value?.trim().replace(/^["']|["']$/g, "");
}

/** Nur im Browser verfügbar — muss NEXT_PUBLIC_ in Vercel heißen. */
export function getClientVapidPublicKey(): string | undefined {
  return cleanEnv(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);
}

export function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

export async function subscribeToPush(vapidPublicKey: string): Promise<PushSubscription | null> {
  if (!vapidPublicKey) {
    console.error("subscribeToPush: VAPID public key fehlt");
    return null;
  }

  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return null;
  }

  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  if (existing) return existing;

  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
  });
}
