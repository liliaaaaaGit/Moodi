import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const MAX_FILE_BYTES = 25 * 1024 * 1024;

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY fehlt" }, { status: 500 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Ungueltige Anfrage" }, { status: 400 });
  }

  const audio = formData.get("audio");
  if (!(audio instanceof File) || audio.size === 0) {
    return NextResponse.json({ error: "Keine Audiodatei erhalten" }, { status: 400 });
  }

  if (audio.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: "Aufnahme ist zu lang" }, { status: 400 });
  }

  const openai = new OpenAI({ apiKey });
  const buffer = Buffer.from(await audio.arrayBuffer());
  const extension = audio.type.includes("mp4") || audio.type.includes("aac") ? "m4a" : "webm";

  try {
    const transcription = await openai.audio.transcriptions.create({
      file: new File([buffer], `recording.${extension}`, { type: audio.type || "audio/webm" }),
      model: "whisper-1",
      language: "de",
    });

    return NextResponse.json({ text: transcription.text.trim() });
  } catch {
    return NextResponse.json(
      { error: "Transkription fehlgeschlagen. Bitte versuche es erneut." },
      { status: 502 }
    );
  }
}
