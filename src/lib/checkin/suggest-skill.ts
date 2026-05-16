import type { SupabaseClient } from "@supabase/supabase-js";

export type SkillRow = {
  id: string;
  name: string;
  kategorie: string;
  dauer_minuten: number | null;
  beschreibung: string | null;
  level_min: number;
  level_max: number;
};

const SKILL_SELECT =
  "id, name, kategorie, dauer_minuten, beschreibung, level_min, level_max";

export function skillToPayload(skill: SkillRow | null) {
  if (!skill) return null;
  return {
    id: skill.id,
    name: skill.name,
    kategorie: skill.kategorie,
    dauer_minuten: skill.dauer_minuten,
    beschreibung: skill.beschreibung,
  };
}

function pickRandom<T>(items: T[]): T | null {
  if (!items.length) return null;
  return items[Math.floor(Math.random() * items.length)] ?? null;
}

async function getLastSuggestedIds(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase
    .from("checkins")
    .select("suggested_skill_id, suggested_long_skill_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    shortId: data?.suggested_skill_id ?? null,
    longId: data?.suggested_long_skill_id ?? null,
  };
}

async function getHelpfulSkillIds(supabase: SupabaseClient, userId: string) {
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const { data: recentHelpful } = await supabase
    .from("checkins")
    .select("chosen_skill_id")
    .eq("user_id", userId)
    .in("hilfreich", ["ja", "bisschen"])
    .gte("created_at", fourteenDaysAgo.toISOString())
    .not("chosen_skill_id", "is", null);

  return new Set(
    (recentHelpful ?? [])
      .map((row) => row.chosen_skill_id)
      .filter((id): id is string => Boolean(id))
  );
}

/** Kurzer Cope-Skill (nicht lang, nicht SVV). */
export async function pickSuggestedShortSkill(
  supabase: SupabaseClient,
  userId: string,
  level: number
): Promise<SkillRow | null> {
  const { data: skills, error } = await supabase
    .from("skills")
    .select(SKILL_SELECT)
    .eq("user_id", userId)
    .eq("aktiv", true)
    .eq("ist_lang", false)
    .neq("kategorie", "svv")
    .lte("level_min", level)
    .gte("level_max", level);

  if (error || !skills?.length) {
    return null;
  }

  const { shortId } = await getLastSuggestedIds(supabase, userId);

  let candidates = skills.filter((skill) => skill.id !== shortId);
  if (!candidates.length) {
    candidates = skills;
  }

  const helpfulIds = await getHelpfulSkillIds(supabase, userId);
  const prioritized = candidates.filter((skill) => helpfulIds.has(skill.id));
  const pool = prioritized.length > 0 ? prioritized : candidates;

  return pickRandom(pool);
}

/** Langer Thrive-Skill. */
export async function pickSuggestedLongSkill(
  supabase: SupabaseClient,
  userId: string,
  level: number
): Promise<SkillRow | null> {
  const { data: skills, error } = await supabase
    .from("skills")
    .select(SKILL_SELECT)
    .eq("user_id", userId)
    .eq("aktiv", true)
    .eq("ist_lang", true)
    .lte("level_min", level)
    .gte("level_max", level);

  if (error || !skills?.length) {
    return null;
  }

  const { longId } = await getLastSuggestedIds(supabase, userId);

  let candidates = skills.filter((skill) => skill.id !== longId);
  if (!candidates.length) {
    candidates = skills;
  }

  return pickRandom(candidates);
}

/** SVV-Skill (z. B. „Arm bemalen“) – nur bei svv_flag ausliefern. */
export async function fetchSvvSkill(
  supabase: SupabaseClient,
  userId: string
): Promise<SkillRow | null> {
  const { data, error } = await supabase
    .from("skills")
    .select(SKILL_SELECT)
    .eq("user_id", userId)
    .eq("kategorie", "svv")
    .eq("aktiv", true)
    .order("name")
    .limit(1)
    .maybeSingle();

  if (error) {
    return null;
  }

  return data;
}
