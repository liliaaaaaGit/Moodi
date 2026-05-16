export const SKILL_CATEGORIES = [
  "körper",
  "atem",
  "grounding",
  "bewegung",
  "aktivierung",
  "kognitiv",
  "beruhigung",
  "umgebungswechsel",
  "svv",
  "lang",
] as const;

export type SkillCategory = (typeof SKILL_CATEGORIES)[number];

const CATEGORY_LABELS: Record<string, string> = {
  körper: "Körper",
  koerper: "Körper",
  atem: "Atem",
  grounding: "Grounding",
  bewegung: "Bewegung",
  aktivierung: "Aktivierung",
  kognitiv: "Kognitive Entlastung",
  beruhigung: "Selbstberuhigung",
  umgebungswechsel: "Umgebungswechsel",
  svv: "SVV",
  lang: "Lang",
};

export function formatCategory(label: string) {
  if (CATEGORY_LABELS[label]) return CATEGORY_LABELS[label];
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Reihenfolge der Untergruppen in „Cope (1–10 Min)“. */
export const COPE_CATEGORY_GROUPS = [
  { title: "Körper", categories: ["körper", "koerper"] },
  { title: "Atem & Grounding", categories: ["atem", "grounding"] },
  { title: "Bewegung & Aktivierung", categories: ["bewegung", "aktivierung"] },
  { title: "Kognitive Entlastung", categories: ["kognitiv"] },
  { title: "Selbstberuhigung", categories: ["beruhigung"] },
  { title: "Umgebungswechsel", categories: ["umgebungswechsel"] },
] as const;
