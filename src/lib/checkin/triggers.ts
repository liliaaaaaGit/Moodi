import type { SupabaseClient } from "@supabase/supabase-js";

export type ExistingTrigger = {
  id: string;
  label: string;
  count: number;
  created_at: string;
};

/** Bestehende Trigger des Users, sortiert nach Häufigkeit (Top 30 Labels für KI-Prompt). */
export async function fetchExistingTriggers(
  supabase: SupabaseClient,
  userId: string
): Promise<ExistingTrigger[]> {
  const { data: triggers, error: triggersError } = await supabase
    .from("triggers")
    .select("id, label, created_at")
    .eq("user_id", userId);

  if (triggersError || !triggers?.length) {
    return [];
  }

  const { data: checkinRows } = await supabase
    .from("checkins")
    .select("trigger_id")
    .eq("user_id", userId)
    .not("trigger_id", "is", null);

  const countById = new Map<string, number>();
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

export function topTriggerLabelsForPrompt(
  existing: ExistingTrigger[],
  limit = 30
): string[] {
  return existing.slice(0, limit).map((t) => t.label);
}

/**
 * Ordnet ein KI-Label einem Trigger zu (bestehend oder neu anlegen).
 * Race bei Unique-Index: bei 23505 existierenden Eintrag laden.
 */
export async function resolveTriggerId(
  supabase: SupabaseClient,
  userId: string,
  triggerLabel: string,
  existing: ExistingTrigger[]
): Promise<string | null> {
  const normalizedNew = triggerLabel.trim();
  if (!normalizedNew) return null;

  const existingMatch = existing.find(
    (e) => e.label.trim().toLowerCase() === normalizedNew.toLowerCase()
  );
  if (existingMatch) {
    return existingMatch.id;
  }

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
    return null;
  }

  return inserted?.id ?? null;
}
