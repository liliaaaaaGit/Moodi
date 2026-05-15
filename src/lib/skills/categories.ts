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

const CATEGORY_LABELS: Record<string, string> = {
  koerper: "Körper",
};

export function formatCategory(label: string) {
  if (CATEGORY_LABELS[label]) return CATEGORY_LABELS[label];
  return label.charAt(0).toUpperCase() + label.slice(1);
}
