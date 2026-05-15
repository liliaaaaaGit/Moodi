export type SkillSummary = {
  id: string;
  name: string;
  kategorie: string;
  dauer_minuten: number | null;
  beschreibung: string | null;
};

export type CheckinRecord = {
  id: string;
  level_before: number;
  input_raw: string | null;
  situation: string | null;
  gedanken: string | null;
  koerper: string | null;
  gefuehl: string | null;
  beduerfnis: string | null;
  suggested_skill_id: string | null;
  crisis_flag: boolean;
  suggested_skill: SkillSummary | null;
};

export type EmergencyContact = {
  name: string;
  phone: string;
};
