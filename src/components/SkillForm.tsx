"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PrimaryButton } from "@/components/PrimaryButton";
import { SKILL_CATEGORIES, formatCategory } from "@/lib/skills/categories";

export type SkillFormValues = {
  name: string;
  kategorie: string;
  dauer_minuten: number | null;
  level_min: number;
  level_max: number;
  beschreibung: string;
  aktiv: boolean;
};

type SkillFormProps = {
  initial?: Partial<SkillFormValues>;
  skillId?: string;
};

const defaultValues: SkillFormValues = {
  name: "",
  kategorie: "reflexion",
  dauer_minuten: 5,
  level_min: 0,
  level_max: 5,
  beschreibung: "",
  aktiv: true,
};

export function SkillForm({ initial, skillId }: SkillFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<SkillFormValues>({
    ...defaultValues,
    ...initial,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const url = skillId ? `/api/skills/${skillId}` : "/api/skills";
    const method = skillId ? "PATCH" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          dauer_minuten: values.dauer_minuten || null,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? "Speichern fehlgeschlagen");
        return;
      }

      router.push("/skills");
      router.refresh();
    } catch {
      setError("Netzwerkfehler");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Field label="Name">
        <input
          required
          value={values.name}
          onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
          className={inputClass}
        />
      </Field>

      <Field label="Kategorie">
        <select
          value={values.kategorie}
          onChange={(e) => setValues((v) => ({ ...v, kategorie: e.target.value }))}
          className={inputClass}
        >
          {SKILL_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {formatCategory(cat)}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Dauer (Minuten)">
        <input
          type="number"
          min={1}
          max={600}
          value={values.dauer_minuten ?? ""}
          onChange={(e) =>
            setValues((v) => ({
              ...v,
              dauer_minuten: e.target.value ? Number(e.target.value) : null,
            }))
          }
          className={inputClass}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Level Min">
          <input
            type="number"
            min={0}
            max={10}
            required
            value={values.level_min}
            onChange={(e) =>
              setValues((v) => ({ ...v, level_min: Number(e.target.value) }))
            }
            className={inputClass}
          />
        </Field>
        <Field label="Level Max">
          <input
            type="number"
            min={0}
            max={10}
            required
            value={values.level_max}
            onChange={(e) =>
              setValues((v) => ({ ...v, level_max: Number(e.target.value) }))
            }
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Beschreibung">
        <textarea
          rows={4}
          value={values.beschreibung}
          onChange={(e) =>
            setValues((v) => ({ ...v, beschreibung: e.target.value }))
          }
          className={inputClass}
        />
      </Field>

      <label className="flex items-center gap-3 text-text-primary">
        <input
          type="checkbox"
          checked={values.aktiv}
          onChange={(e) => setValues((v) => ({ ...v, aktiv: e.target.checked }))}
          className="h-5 w-5 rounded border-accent text-primary"
        />
        Aktiv
      </label>

      {error ? <p className="text-sm text-warning">{error}</p> : null}

      <PrimaryButton type="submit" disabled={loading}>
        {loading ? "Speichert…" : "Speichern"}
      </PrimaryButton>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-text-secondary">{label}</label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full rounded-2xl border border-accent/40 bg-white px-4 py-3 text-text-primary shadow-soft outline-none focus:border-primary focus:ring-2 focus:ring-primary/30";
