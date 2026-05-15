"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Card } from "@/components/Card";
import { formatCategory } from "@/lib/skills/categories";

type SkillListItemProps = {
  id: string;
  name: string;
  kategorie: string;
  dauer_minuten: number | null;
  level_min: number;
  level_max: number;
  aktiv: boolean;
};

export function SkillListItem({
  id,
  name,
  kategorie,
  dauer_minuten,
  level_min,
  level_max,
  aktiv,
}: SkillListItemProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function toggleAktiv() {
    startTransition(async () => {
      await fetch(`/api/skills/${id}/toggle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aktiv: !aktiv }),
      });
      router.refresh();
    });
  }

  return (
    <Card className={`p-4 ${!aktiv ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-text-primary">{name}</p>
          <p className="mt-1 text-xs text-text-secondary">
            {formatCategory(kategorie)}
            {dauer_minuten ? ` · ${dauer_minuten} Min` : ""} · Level {level_min}–
            {level_max}
          </p>
          <Link
            href={`/skills/${id}/edit`}
            className="mt-2 inline-block text-sm font-medium text-primary underline"
          >
            Bearbeiten
          </Link>
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={toggleAktiv}
          className="shrink-0 rounded-full border border-primary/40 px-3 py-1 text-xs font-medium text-primary"
        >
          {aktiv ? "Aktiv" : "Inaktiv"}
        </button>
      </div>
    </Card>
  );
}
