export const SKILL_CATEGORIES = [
  "reflexion",
  "ressource",
  "planung",
  "atem",
  "entlastung",
  "aktivierung",
  "kognitiv",
  "sozial",
  "grounding",
  "bewegung",
  "koerper",
  "umgebungswechsel",
  "beruhigung",
  "reizreduktion",
  "krise",
] as const;

export type SkillCategory = (typeof SKILL_CATEGORIES)[number];

export function formatCategory(label: string) {
  return label.charAt(0).toUpperCase() + label.slice(1);
}
