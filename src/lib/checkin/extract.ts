import OpenAI from "openai";
import { z } from "zod";

export function buildExtractSystemPrompt(
  existingLabels: string[],
  levelBefore: number
): string {
  const labelBlock =
    existingLabels.length > 0
      ? existingLabels.map((l) => `   - ${l}`).join("\n")
      : "   (noch keine)";

  return `Du bist ein präziser Assistent, der Selbstbeobachtungs-Texte strukturiert. Extrahiere die folgenden Felder. Antworte als JSON. Wenn ein Feld nicht erwähnt wird: leerer String. Erfinde nichts, paraphrasiere knapp.

Kontext Anspannung:
Das aktuelle Anspannungslevel der Person ist ${levelBefore} (Skala 0–10, Grundlevel ~5). Nutze dieses Level als zusätzliches Signal zur Interpretation der Situation — auch wenn die Person nicht explizit sagt dass etwas stressig ist.
- Level 0–5 = entspannt / unter Grundlevel
- Level 6–7 = mittel erhöht
- Level 8–10 = hoch angespannt (Stressor-Territorium)

Felder:
- situation (string)
- gedanken (string)
- koerper (string)
- gefuehl (string)
- beduerfnis (string)
- svv_intent (boolean): nur true bei explizitem Wunsch sich zu verletzen
- not_spiraling_context (string): Konkrete Entspannungsquelle aus dem Text (z.B. "Auto fahren", "draußen sein", "Musik hören"). Nur bei Level ≤ 5. NIEMALS App-Kategorien oder Meta-Labels wie "Not Spiraling For Once", "entspannt", "gut geht's" — nur echte Aktivitäten/Situationen. Sonst leerer String.
- trigger (string): konkreter Auslöser der Anspannung (Stressor). Sei spezifisch, nicht generisch.

Trigger-Regeln (Feld trigger):
GUTE Beispiele: "Deadline Projektabgabe", "Streit mit Mama", "Prüfungsangst Mathe", "Warten auf Arzttermin"
SCHLECHTE Beispiele (zu generisch, NICHT verwenden): "Stress", "Angst", "Druck", "Probleme", "Arbeit"

Nutze das Anspannungslevel als Signal: wenn Level ≥ 6 und eine Situation beschrieben wird, ist das sehr wahrscheinlich ein Stressor — auch wenn die Person das nicht explizit sagt.
Fülle trigger nur wenn Level ≥ 6, außer der Text nennt trotzdem klar einen konkreten Stressor.

Bestehende Labels:
${labelBlock}

Wenn der erkannte Stressor semantisch zu einem bestehenden Label passt: nutze EXAKT dieses Label, Wort für Wort.
Wenn kein bestehendes Label passt: neues Label (2–5 Wörter, Deutsch, spezifisch).
Wenn wirklich nicht erkennbar: leerer String "".

Antworte ausschließlich mit gültigem JSON, keine Markdown-Codeblöcke.`;
}

const extractSchema = z.object({
  situation: z.string(),
  gedanken: z.string(),
  koerper: z.string(),
  gefuehl: z.string(),
  beduerfnis: z.string(),
  svv_intent: z.boolean(),
  not_spiraling_context: z.string(),
  trigger: z.string(),
});

export type ExtractedCheckin = z.infer<typeof extractSchema>;

export class ExtractParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExtractParseError";
  }
}

const GENERIC_TRIGGER_LABELS = new Set(
  ["stress", "angst", "druck", "probleme", "arbeit", "müdigkeit", "überforderung"].map(
    (s) => s.toLowerCase()
  )
);

const INVALID_NOT_SPIRALING_LABELS = new Set(
  [
    "not spiraling for once",
    "not spiraling",
    "entspannt",
    "gut",
    "gut geht's",
    "mir gehts gut",
  ].map((s) => s.toLowerCase())
);

/** Serverseitig zu generische Trigger-Labels verwerfen. */
export function sanitizeTriggerLabel(label: string): string {
  const trimmed = label.trim();
  if (!trimmed) return "";
  const normalized = trimmed.toLowerCase();
  if (GENERIC_TRIGGER_LABELS.has(normalized)) return "";
  return trimmed;
}

export function sanitizeNotSpiralingContext(
  levelBefore: number,
  value: string
): string {
  if (levelBefore > 5) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  const normalized = trimmed.toLowerCase();
  if (INVALID_NOT_SPIRALING_LABELS.has(normalized)) return "";
  if (normalized.includes("not spiraling")) return "";
  return trimmed;
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
    max_tokens: 420,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: buildExtractSystemPrompt(existingLabels, level),
      },
      {
        role: "user",
        content: `Anspannungslevel (level_before): ${level}/10\n\nText:\n${text}`,
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

  return {
    ...parsed.data,
    trigger: sanitizeTriggerLabel(parsed.data.trigger),
    not_spiraling_context: sanitizeNotSpiralingContext(
      level,
      parsed.data.not_spiraling_context
    ),
  };
}
