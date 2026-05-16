import { z } from "zod";

export const skillFormSchema = z
  .object({
    name: z.string().min(1, "Name ist erforderlich"),
    kategorie: z.string().min(1, "Kategorie ist erforderlich"),
    dauer_minuten: z.coerce.number().int().min(1).max(600).nullable().optional(),
    level_min: z.coerce.number().int().min(0).max(10),
    level_max: z.coerce.number().int().min(0).max(10),
    beschreibung: z.string().max(2000).optional(),
    aktiv: z.boolean().optional(),
    ist_lang: z.boolean().optional(),
  })
  .refine((data) => data.level_min <= data.level_max, {
    message: "Level-Min darf nicht größer als Level-Max sein",
    path: ["level_max"],
  });

export type SkillFormInput = z.infer<typeof skillFormSchema>;
