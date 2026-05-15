import { NextResponse } from "next/server";
import { getVapidPublicKey } from "@/lib/push/vapid";

export async function GET() {
  const publicKey = getVapidPublicKey();
  if (!publicKey) {
    return NextResponse.json({ error: "VAPID nicht konfiguriert" }, { status: 503 });
  }
  return NextResponse.json({ publicKey });
}
