import type { SkillSummary } from "@/lib/checkin/types";

/** Bevorzugte kurze Skills auf dem Krisen-Screen (3 zufällig davon). */
export const CRISIS_PREFERRED_SKILL_NAMES = [
  "Klavier spielen",
  "Luft 3min anhalten",
  "Schwere Decke & Dunkelheit",
  "Muskeln anspannen / entspannen",
] as const;

/** Umgebungswechsel-Skills in fester Reihenfolge. */
export const UMGEBUNGSWECHSEL_SKILL_NAMES = [
  "Raus, frische Luft, Umgebungswechsel",
  "Auto fahren",
  "Dachau Schloss",
] as const;

export const BAYERN_CRISIS_PHONE_DISPLAY = "0800 655 3000";
export const BAYERN_CRISIS_PHONE_TEL = "08006553000";

type SkillRow = SkillSummary & {
  aktiv: boolean;
  ist_lang: boolean;
  level_max: number;
};

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function toSummary(skill: SkillRow): SkillSummary {
  return {
    id: skill.id,
    name: skill.name,
    kategorie: skill.kategorie,
    dauer_minuten: skill.dauer_minuten,
    beschreibung: skill.beschreibung,
  };
}

/** Wählt 3 kurze Krisen-Skills aus dem bevorzugten Pool, ggf. mit Fallback. */
export function pickCrisisShortSkills(allActiveSkills: SkillRow[]): SkillSummary[] {
  const byName = new Map(allActiveSkills.map((skill) => [skill.name, skill]));

  const preferredAvailable = CRISIS_PREFERRED_SKILL_NAMES.map((name) => byName.get(name)).filter(
    (skill): skill is SkillRow => Boolean(skill)
  );

  let selected: SkillRow[] = shuffle(preferredAvailable).slice(0, 3);

  if (selected.length < 3) {
    const preferredNames = new Set<string>(CRISIS_PREFERRED_SKILL_NAMES);
    const selectedIds = new Set(selected.map((skill) => skill.id));

    const extended = allActiveSkills.filter(
      (skill) =>
        !skill.ist_lang &&
        skill.kategorie !== "svv" &&
        skill.kategorie !== "umgebungswechsel" &&
        skill.level_max >= 9 &&
        !preferredNames.has(skill.name) &&
        !selectedIds.has(skill.id)
    );

    const needed = 3 - selected.length;
    selected = [...selected, ...shuffle(extended).slice(0, needed)];
  }

  return selected.map(toSummary);
}

/** Alle aktiven Umgebungswechsel-Skills in der vorgegebenen Reihenfolge. */
export function pickUmgebungswechselSkills(allSkills: SkillRow[]): SkillSummary[] {
  const byName = new Map(allSkills.map((skill) => [skill.name, skill]));

  return UMGEBUNGSWECHSEL_SKILL_NAMES.flatMap((name) => {
    const skill = byName.get(name);
    return skill?.aktiv ? [toSummary(skill)] : [];
  });
}
