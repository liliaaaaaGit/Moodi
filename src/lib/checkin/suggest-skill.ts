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

export async function pickSuggestedSkill(
  supabase: SupabaseClient,
  userId: string,
  level: number
): Promise<SkillRow | null> {
  const { data: skills, error } = await supabase
    .from("skills")
    .select("id, name, kategorie, dauer_minuten, beschreibung, level_min, level_max")
    .eq("user_id", userId)
    .eq("aktiv", true)
    .lte("level_min", level)
    .gte("level_max", level);

  if (error || !skills?.length) {
    return null;
  }

  const { data: lastCheckin } = await supabase
    .from("checkins")
    .select("suggested_skill_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let candidates = skills.filter(
    (skill) => skill.id !== lastCheckin?.suggested_skill_id
  );
  if (!candidates.length) {
    candidates = skills;
  }

  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const { data: recentHelpful } = await supabase
    .from("checkins")
    .select("chosen_skill_id")
    .eq("user_id", userId)
    .in("hilfreich", ["ja", "bisschen"])
    .gte("created_at", fourteenDaysAgo.toISOString())
    .not("chosen_skill_id", "is", null);

  const helpfulIds = new Set(
    (recentHelpful ?? [])
      .map((row) => row.chosen_skill_id)
      .filter((id): id is string => Boolean(id))
  );

  const prioritized = candidates.filter((skill) => helpfulIds.has(skill.id));
  const pool = prioritized.length > 0 ? prioritized : candidates;

  return pool[Math.floor(Math.random() * pool.length)] ?? null;
}
