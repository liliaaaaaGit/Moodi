/**
 * Backfill: trigger_id und not_spiraling_context für bestehende Check-ins.
 *
 * Verarbeitet Check-ins wo trigger_id IS NULL ODER not_spiraling_context IS NULL.
 *
 * Manuell starten (nicht automatisch):
 *   node scripts/backfill-triggers.mjs
 *
 * Benötigt in .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   OPENAI_API_KEY
 */

import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

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

function loadEnvLocal() {
  const path = join(root, ".env.local");
  try {
    const raw = readFileSync(path, "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    console.error("Konnte .env.local nicht lesen:", path);
    process.exit(1);
  }
}

loadEnvLocal();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openaiKey = process.env.OPENAI_API_KEY;

if (!supabaseUrl || !serviceKey || !openaiKey) {
  console.error(
    "Fehlende Umgebungsvariablen: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);
const openai = new OpenAI({ apiKey: openaiKey });

function buildExtractSystemPrompt(existingLabels, levelBefore) {
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
- not_spiraling_context (string): Nur bei level_before ≤ 5: konkrete natürliche Entspannungsquelle aus dem Text (z.B. "Auto fahren", "Vespa fahren", "draußen sein") — NICHT manuell angewendete Skills. NIEMALS Meta-Labels wie "Not Spiraling For Once", "entspannt", "gut". Wenn level_before > 5 oder kein konkreter Entspanner: leerer String.
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

function sanitizeTriggerLabel(label) {
  const trimmed = label.trim();
  if (!trimmed) return "";
  if (GENERIC_TRIGGER_LABELS.has(trimmed.toLowerCase())) return "";
  return trimmed;
}

function sanitizeNotSpiralingContext(levelBefore, value) {
  if (levelBefore > 5) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  const normalized = trimmed.toLowerCase();
  if (INVALID_NOT_SPIRALING_LABELS.has(normalized)) return "";
  if (normalized.includes("not spiraling")) return "";
  return trimmed;
}

async function fetchExistingTriggers(userId) {
  const { data: triggers } = await supabase
    .from("triggers")
    .select("id, label, created_at")
    .eq("user_id", userId);

  if (!triggers?.length) return [];

  const { data: checkinRows } = await supabase
    .from("checkins")
    .select("trigger_id")
    .eq("user_id", userId)
    .not("trigger_id", "is", null);

  const countById = new Map();
  for (const row of checkinRows ?? []) {
    if (!row.trigger_id) continue;
    countById.set(row.trigger_id, (countById.get(row.trigger_id) ?? 0) + 1);
  }

  return triggers
    .map((t) => ({
      id: t.id,
      label: t.label,
      created_at: t.created_at,
      count: countById.get(t.id) ?? 0,
    }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
}

async function resolveTriggerId(userId, triggerLabel, existing) {
  const normalizedNew = triggerLabel.trim();
  if (!normalizedNew) return null;

  const existingMatch = existing.find(
    (e) => e.label.trim().toLowerCase() === normalizedNew.toLowerCase()
  );
  if (existingMatch) return existingMatch.id;

  const { data: inserted, error } = await supabase
    .from("triggers")
    .insert({ user_id: userId, label: normalizedNew })
    .select("id")
    .single();

  if (error?.code === "23505") {
    const { data: found } = await supabase
      .from("triggers")
      .select("id")
      .eq("user_id", userId)
      .ilike("label", normalizedNew)
      .maybeSingle();
    return found?.id ?? null;
  }

  if (error) {
    console.error("  Trigger-Insert fehlgeschlagen:", error.message);
    return null;
  }

  const newEntry = {
    id: inserted.id,
    label: normalizedNew,
    count: 0,
    created_at: new Date().toISOString(),
  };
  existing.push(newEntry);
  return inserted.id;
}

async function extractFields(levelBefore, text, existingLabels) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    max_tokens: 420,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: buildExtractSystemPrompt(existingLabels, levelBefore),
      },
      {
        role: "user",
        content: `Das Anspannungslevel bei diesem Eintrag war: ${levelBefore} (Grundlevel der Person ist ~5)\n\nText:\n${text}`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("Keine KI-Antwort");

  const parsed = JSON.parse(raw);
  return {
    trigger: sanitizeTriggerLabel(
      typeof parsed.trigger === "string" ? parsed.trigger : ""
    ),
    not_spiraling_context: sanitizeNotSpiralingContext(
      levelBefore,
      typeof parsed.not_spiraling_context === "string"
        ? parsed.not_spiraling_context
        : ""
    ),
    svv_intent: Boolean(parsed.svv_intent),
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const { data: checkins, error } = await supabase
    .from("checkins")
    .select(
      "id, user_id, level_before, input_raw, situation, crisis_flag, trigger_id, not_spiraling_context"
    )
    .eq("crisis_flag", false)
    .or("trigger_id.is.null,not_spiraling_context.is.null")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Check-ins laden fehlgeschlagen:", error.message);
    process.exit(1);
  }

  const rows = (checkins ?? []).filter((c) => {
    const text = (c.input_raw ?? c.situation ?? "").trim();
    return text.length > 0;
  });

  console.log(
    `${rows.length} Check-in(s) mit fehlendem trigger_id und/oder not_spiraling_context (mit Text).\n`
  );

  const triggersByUser = new Map();

  for (const checkin of rows) {
    if (!triggersByUser.has(checkin.user_id)) {
      triggersByUser.set(checkin.user_id, await fetchExistingTriggers(checkin.user_id));
    }
    const existing = triggersByUser.get(checkin.user_id);
    const existingLabels = existing.slice(0, 30).map((t) => t.label);

    const text = (checkin.input_raw ?? checkin.situation ?? "").trim();
    const needsTrigger = checkin.trigger_id == null;
    const needsNotSpiraling = checkin.not_spiraling_context == null;

    try {
      const { trigger, not_spiraling_context } = await extractFields(
        checkin.level_before,
        text,
        existingLabels
      );

      const updates = {};

      if (needsTrigger && checkin.level_before >= 6 && trigger) {
        const triggerId = await resolveTriggerId(checkin.user_id, trigger, existing);
        if (triggerId) {
          updates.trigger_id = triggerId;
        }
      }

      if (needsNotSpiraling && not_spiraling_context) {
        updates.not_spiraling_context = not_spiraling_context;
      }

      if (Object.keys(updates).length === 0) {
        const triggerLog = needsTrigger ? `"${trigger || ""}"` : "(bereits gesetzt)";
        const notSpiralingLog = needsNotSpiraling
          ? `"${not_spiraling_context || ""}"`
          : "(bereits gesetzt)";
        console.log(
          `– ${checkin.id}: trigger: ${triggerLog} | not_spiraling: ${notSpiralingLog}`
        );
      } else {
        const { error: updateError } = await supabase
          .from("checkins")
          .update(updates)
          .eq("id", checkin.id);

        if (updateError) {
          console.error(`✗ ${checkin.id}: Update fehlgeschlagen —`, updateError.message);
        } else {
          const triggerLabel =
            updates.trigger_id != null
              ? `"${trigger}"`
              : checkin.trigger_id
                ? "(unverändert)"
                : "—";
          const notSpiralingLabel =
            updates.not_spiraling_context != null
              ? `"${updates.not_spiraling_context}"`
              : checkin.not_spiraling_context
                ? "(unverändert)"
                : "—";
          console.log(
            `✓ ${checkin.id}: trigger: ${triggerLabel} | not_spiraling: ${notSpiralingLabel}`
          );
        }
      }
    } catch (err) {
      console.error(`✗ ${checkin.id}:`, err.message);
    }

    await sleep(200);
  }

  console.log("\nBackfill beendet.");
}

main();
