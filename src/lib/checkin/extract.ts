import OpenAI from "openai";
import { z } from "zod";

export function buildExtractSystemPrompt(existingLabels: string[]): string {
  const labelBlock =
    existingLabels.length > 0
      ? existingLabels.map((l) => `   - ${l}`).join("\n")
      : "   (noch keine)";

  return `Du bist ein präziser Assistent, der Selbstbeobachtungs-Texte strukturiert. Extrahiere die folgenden Felder. Antworte als JSON. Wenn ein Feld nicht erwähnt wird: leerer String. Erfinde nichts, paraphrasiere knapp.

Felder:
- situation (string)
- gedanken (string)
- koerper (string)
- gefuehl (string)
- beduerfnis (string)
- svv_intent (boolean): nur true bei explizitem Wunsch sich zu verletzen
- trigger (string): Identifiziere den konkreten ZUGRUNDELIEGENDEN Auslöser der Anspannung — das, was sie tatsächlich verursacht.

Trigger-Regeln:
1. Bestehende Trigger-Labels dieses Users:
${labelBlock}

2. Wenn der erkannte Trigger semantisch zu einem bestehenden Label passt: nutze EXAKT dieses Label, Wort für Wort.

3. Wenn kein bestehendes Label passt: formuliere ein neues, kurzes Label (2–5 Wörter, Deutsch). Spezifisch, nicht generisch:
   - NICHT: 'Stress', 'Angst', 'Müdigkeit', 'Druck', 'Überforderung' allein
   - JA: 'Deadline-Druck Arbeit', 'Streit mit Partner', 'Schlafmangel', 'Reizüberflutung Büro', 'Soziale Erwartungen', 'Gedankenkarussell nachts'

4. Wenn der Trigger aus dem Text wirklich nicht erkennbar ist (z.B. nur 'mir gehts schlecht'): leerer String ''.

Antworte ausschließlich mit gültigem JSON, keine Markdown-Codeblöcke.`;
}

const extractSchema = z.object({
  situation: z.string(),
  gedanken: z.string(),
  koerper: z.string(),
  gefuehl: z.string(),
  beduerfnis: z.string(),
  svv_intent: z.boolean(),
  trigger: z.string(),
});

export type ExtractedCheckin = z.infer<typeof extractSchema>;

export class ExtractParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExtractParseError";
  }
}

export async function extractCheckinText(
  level: number,
  text: string,
  existingLabels: string[] = []
): Promise<ExtractedCheckin> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY fehlt");
  }

  const openai = new OpenAI({ apiKey });

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    max_tokens: 350,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: buildExtractSystemPrompt(existingLabels) },
      {
        role: "user",
        content: `Anspannungslevel: ${level}/10\n\nText:\n${text}`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    throw new ExtractParseError("Keine Antwort von der KI");
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new ExtractParseError("KI-Antwort ist kein gültiges JSON");
  }

  const parsed = extractSchema.safeParse(json);
  if (!parsed.success) {
    throw new ExtractParseError("KI-Antwort hat ein ungültiges Format");
  }

  return parsed.data;
}
