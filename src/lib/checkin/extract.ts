import OpenAI from "openai";
import { z } from "zod";

const SYSTEM_PROMPT = `Du bist ein präziser Assistent, der Selbstbeobachtungs-Texte strukturiert. Extrahiere die folgenden Felder. Antworte als JSON. Wenn ein Feld nicht erwähnt wird: leerer String. Erfinde nichts, paraphrasiere knapp.

Felder:
- situation (string): Was passiert konkret?
- gedanken (string): Welche Gedanken werden geäußert?
- koerper (string): Welche Körperempfindungen?
- gefuehl (string): Welche Emotionen?
- beduerfnis (string): Welches Bedürfnis steckt dahinter? (vorsichtig erschließen)
- svv_intent (boolean): true NUR wenn die Person aktuell den Wunsch oder Drang äußert, sich selbst zu verletzen (z.B. 'ich will mich ritzen', 'ich habe Druck mich zu schneiden', 'ich möchte mir wehtun'). false bei: vergangenen Episoden, generellen Themen, Vergleichen, Berichten über andere, oder wenn nur 'angespannt' / 'wütend' steht. Im Zweifel: false.

Antworte ausschließlich mit gültigem JSON, keine Markdown-Codeblöcke.`;

const extractSchema = z.object({
  situation: z.string(),
  gedanken: z.string(),
  koerper: z.string(),
  gefuehl: z.string(),
  beduerfnis: z.string(),
  svv_intent: z.boolean(),
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
    max_tokens: 250,
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
