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

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

async function getLastSuggestedIds(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase
    .from("checkins")
    .select("suggested_short_skill_ids, suggested_long_skill_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    shortIds: new Set<string>(data?.suggested_short_skill_ids ?? []),
    longId: data?.suggested_long_skill_id ?? null,
  };
}

async function getHelpfulSkillIds(supabase: SupabaseClient, userId: string) {
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const { data: recentHelpful } = await supabase
    .from("checkins")
    .select("chosen_skill_id, chosen_long_skill_id")
    .eq("user_id", userId)
    .in("hilfreich", ["ja", "bisschen"])
    .gte("created_at", fourteenDaysAgo.toISOString());

  const ids = new Set<string>();
  for (const row of recentHelpful ?? []) {
    if (row.chosen_skill_id) ids.add(row.chosen_skill_id);
    if (row.chosen_long_skill_id) ids.add(row.chosen_long_skill_id);
  }
  return ids;
}

/** Bis zu 3 kurze Cope-Skills (nicht lang, nicht SVV). */
export async function pickSuggestedShortSkills(
  supabase: SupabaseClient,
  userId: string,
  level: number,
  count = 3
): Promise<SkillRow[]> {
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
    return [];
  }

  const { shortIds: lastShortIds } = await getLastSuggestedIds(supabase, userId);

  let candidates = skills.filter((skill) => !lastShortIds.has(skill.id));
  if (!candidates.length) {
    candidates = skills;
  }

  const helpfulIds = await getHelpfulSkillIds(supabase, userId);
  const prioritized = candidates.filter((skill) => helpfulIds.has(skill.id));
  const pool = prioritized.length > 0 ? prioritized : candidates;

  return shuffle(pool).slice(0, Math.min(count, pool.length));
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

  const picked = shuffle(candidates)[0];
  return picked ?? null;
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

export async function loadSkillsByIds(
  supabase: SupabaseClient,
  ids: string[]
): Promise<SkillRow[]> {
  if (!ids.length) return [];

  const { data, error } = await supabase
    .from("skills")
    .select(SKILL_SELECT)
    .in("id", ids);

  if (error || !data?.length) return [];

  const byId = new Map(data.map((skill) => [skill.id, skill]));
  return ids
    .map((id) => byId.get(id))
    .filter((skill): skill is SkillRow => Boolean(skill));
}
