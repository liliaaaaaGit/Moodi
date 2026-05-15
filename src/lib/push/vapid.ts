import webpush from "web-push";

function clean(value: string | undefined) {
  return value?.trim().replace(/^["']|["']$/g, "");
}

export function getVapidPublicKey(): string | undefined {
  return clean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) ?? clean(process.env.VAPID_PUBLIC_KEY);
}

export function getVapidPrivateKey(): string | undefined {
  return clean(process.env.VAPID_PRIVATE_KEY);
}

export function getVapidSubject(): string {
  return clean(process.env.VAPID_SUBJECT) ?? "mailto:support@anspannung.app";
}

export function configureWebPush() {
  const publicKey = getVapidPublicKey();
  const privateKey = getVapidPrivateKey();
  const subject = getVapidSubject();

  if (!publicKey || !privateKey) {
    throw new Error("VAPID-Schluessel fehlen");
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
}

export async function sendPushNotification(
  subscription: webpush.PushSubscription,
  payload: { title: string; body: string }
) {
  configureWebPush();
  await webpush.sendNotification(
    subscription,
    JSON.stringify({ title: payload.title, body: payload.body })
  );
}
