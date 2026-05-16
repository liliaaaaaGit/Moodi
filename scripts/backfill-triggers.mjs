/**
 * Backfill: semantische Trigger für bestehende Check-ins ohne trigger_id.
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

function buildExtractSystemPrompt(existingLabels) {
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

  const newEntry = { id: inserted.id, label: normalizedNew, count: 0, created_at: new Date().toISOString() };
  existing.push(newEntry);
  return inserted.id;
}

async function extractTrigger(level, text, existingLabels) {
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
  if (!raw) throw new Error("Keine KI-Antwort");

  const parsed = JSON.parse(raw);
  return {
    trigger: typeof parsed.trigger === "string" ? parsed.trigger : "",
    svv_intent: Boolean(parsed.svv_intent),
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const { data: checkins, error } = await supabase
    .from("checkins")
    .select("id, user_id, level_before, input_raw, situation, crisis_flag, trigger_id")
    .is("trigger_id", null)
    .eq("crisis_flag", false)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Check-ins laden fehlgeschlagen:", error.message);
    process.exit(1);
  }

  const rows = (checkins ?? []).filter((c) => {
    const text = (c.input_raw ?? c.situation ?? "").trim();
    return text.length > 0;
  });

  console.log(`${rows.length} Check-in(s) ohne trigger_id (mit Text).\n`);

  const triggersByUser = new Map();

  for (const checkin of rows) {
    if (!triggersByUser.has(checkin.user_id)) {
      triggersByUser.set(checkin.user_id, await fetchExistingTriggers(checkin.user_id));
    }
    const existing = triggersByUser.get(checkin.user_id);
    const existingLabels = existing.slice(0, 30).map((t) => t.label);

    const text = (checkin.input_raw ?? checkin.situation ?? "").trim();

    try {
      const { trigger } = await extractTrigger(
        checkin.level_before,
        text,
        existingLabels
      );

      let triggerId = null;
      if (trigger.trim()) {
        triggerId = await resolveTriggerId(checkin.user_id, trigger, existing);
      }

      if (triggerId) {
        const { error: updateError } = await supabase
          .from("checkins")
          .update({ trigger_id: triggerId })
          .eq("id", checkin.id);

        if (updateError) {
          console.error(`✗ ${checkin.id}: Update fehlgeschlagen —`, updateError.message);
        } else {
          console.log(`✓ ${checkin.id}: „${trigger.trim()}“ → trigger_id ${triggerId}`);
        }
      } else {
        console.log(`– ${checkin.id}: kein Trigger erkannt („${trigger || ""}“)`);
      }
    } catch (err) {
      console.error(`✗ ${checkin.id}:`, err.message);
    }

    await sleep(200);
  }

  console.log("\nBackfill beendet.");
}

main();
