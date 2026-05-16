import { COPE_CATEGORY_GROUPS } from "@/lib/skills/categories";

export type SkillListRow = {
  id: string;
  name: string;
  kategorie: string;
  dauer_minuten: number | null;
  level_min: number;
  level_max: number;
  aktiv: boolean;
  ist_lang: boolean;
};

function sortByName(a: SkillListRow, b: SkillListRow) {
  return a.name.localeCompare(b.name, "de");
}

export function partitionSkills(skills: SkillListRow[]) {
  const cope = skills.filter((s) => !s.ist_lang && s.kategorie !== "svv");
  const thrive = skills.filter((s) => s.ist_lang);
  const special = skills.filter((s) => s.kategorie === "svv");
  return { cope, thrive, special };
}

export function groupCopeSkills(cope: SkillListRow[]) {
  return COPE_CATEGORY_GROUPS.map((group) => ({
    title: group.title,
    skills: cope
      .filter((s) =>
        (group.categories as readonly string[]).includes(s.kategorie)
      )
      .sort(sortByName),
  })).filter((group) => group.skills.length > 0);
}
