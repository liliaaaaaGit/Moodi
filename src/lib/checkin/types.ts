export type SkillSummary = {
  id: string;
  name: string;
  kategorie: string;
  dauer_minuten: number | null;
  beschreibung: string | null;
};

export type SkillStatus =
  | "gemacht"
  | "nicht_gemacht"
  | "anderer"
  | "uebersprungen"
  | null;

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
  suggested_long_skill_id: string | null;
  chosen_skill_id: string | null;
  chosen_long_skill_id: string | null;
  chosen_svv_skill_id: string | null;
  skill_status: SkillStatus;
  long_skill_status: SkillStatus;
  svv_skill_status: SkillStatus;
  svv_flag: boolean;
  crisis_flag: boolean;
  suggested_skill: SkillSummary | null;
  suggested_long_skill: SkillSummary | null;
  svv_skill: SkillSummary | null;
};

export type EmergencyContact = {
  name: string;
  phone: string;
};
