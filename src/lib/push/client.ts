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

export function getNotificationPermissionLabel():
  | "granted"
  | "denied"
  | "default"
  | "nicht unterstützt" {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "nicht unterstützt";
  }
  return Notification.permission;
}

export function getServiceWorkerControllerLabel(): "aktiv" | "nicht registriert" {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return "nicht registriert";
  }
  return navigator.serviceWorker.controller ? "aktiv" : "nicht registriert";
}

export async function getBrowserPushSubscription(): Promise<PushSubscription | null> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return null;
  }
  try {
    const registration = await navigator.serviceWorker.ready;
    return registration.pushManager.getSubscription();
  } catch {
    return null;
  }
}

export async function unsubscribeFromPush(): Promise<{ ok: boolean; error?: string }> {
  if (!("serviceWorker" in navigator)) {
    return { ok: false, error: "Service Worker nicht unterstützt" };
  }
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
    }
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unsubscribe fehlgeschlagen";
    return { ok: false, error: message };
  }
}

export async function savePushSubscriptionToServer(
  subscription: PushSubscription
): Promise<{ ok: boolean; error?: string }> {
  try {
    const response = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription: subscription.toJSON() }),
    });
    const payload = await response.json();
    if (!response.ok) {
      return { ok: false, error: (payload.error as string) ?? "Speichern fehlgeschlagen" };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Netzwerkfehler beim Speichern" };
  }
}

/** Permission anfragen, subscriben und in DB speichern. */
export async function subscribeUserToPush(): Promise<{
  ok: boolean;
  error?: string;
  step?: string;
}> {
  const publicKey = getClientVapidPublicKey();
  console.log("VAPID key length:", publicKey?.length);

  if (!publicKey) {
    return {
      ok: false,
      step: "vapid",
      error: "NEXT_PUBLIC_VAPID_PUBLIC_KEY fehlt (Build/ENV prüfen)",
    };
  }

  if (!("Notification" in window) || !("PushManager" in window)) {
    return { ok: false, step: "api", error: "Push/Notifications nicht unterstützt" };
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return {
      ok: false,
      step: "permission",
      error: `Permission: ${permission} (in iOS-Einstellungen prüfen)`,
    };
  }

  const subscription = await subscribeToPush(publicKey);
  if (!subscription) {
    return {
      ok: false,
      step: "subscribe",
      error: "pushManager.subscribe() fehlgeschlagen (SW aktiv? PWA vom Home-Bildschirm?)",
    };
  }

  const saved = await savePushSubscriptionToServer(subscription);
  if (!saved.ok) {
    return { ok: false, step: "save", error: saved.error ?? "DB-Speichern fehlgeschlagen" };
  }

  return { ok: true };
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
