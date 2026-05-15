import OpenAI from "openai";
import { z } from "zod";

const SYSTEM_PROMPT = `Du bist ein praeziser Assistent, der Selbstbeobachtungs-Texte strukturiert. Extrahiere die folgenden Felder. Antworte als JSON. Wenn ein Feld nicht erwaehnt wird: leerer String. Erfinde nichts, paraphrasiere knapp.
Felder: situation, gedanken, koerper, gefuehl, beduerfnis.
Antworte ausschliesslich mit gueltigem JSON.`;

const extractSchema = z.object({
  situation: z.string(),
  gedanken: z.string(),
  koerper: z.string(),
  gefuehl: z.string(),
  beduerfnis: z.string(),
});

export type ExtractedCheckin = z.infer<typeof extractSchema>;

export async function extractCheckinText(
  level: number,
  text: string
): Promise<ExtractedCheckin> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY fehlt");
  }

  const openai = new OpenAI({ apiKey });

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    max_tokens: 200,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Anspannungslevel: ${level}/10\n\nText:\n${text}`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    throw new Error("Keine Antwort von OpenAI");
  }

  return extractSchema.parse(JSON.parse(raw));
}
