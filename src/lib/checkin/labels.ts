export const SKILL_STATUS_LABELS: Record<string, string> = {
  gemacht: "Gemacht",
  nicht_gemacht: "Nicht gemacht",
  anderer: "Anderer Skill",
  uebersprungen: "Übersprungen",
};

export const HILFREICH_LABELS: Record<string, string> = {
  ja: "Ja",
  bisschen: "Bisschen",
  nein: "Nein",
};

export function formatSkillStatus(status: string | null | undefined): string | null {
  if (!status) return null;
  return SKILL_STATUS_LABELS[status] ?? status;
}

export function formatHilfreich(value: string | null | undefined): string | null {
  if (!value) return null;
  return HILFREICH_LABELS[value] ?? value;
}
