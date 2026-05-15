"use client";

import { Check } from "lucide-react";
import { useTransition } from "react";
import { toggleHabitCompletion } from "@/app/actions/toggle-habit";
import { Card } from "@/components/Card";

type HabitCardProps = {
  id: string;
  name: string;
  beschreibung: string | null;
  target_minutes: number | null;
  completed: boolean;
};

export function HabitCard({
  id,
  name,
  beschreibung,
  target_minutes,
  completed,
}: HabitCardProps) {
  const [pending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      await toggleHabitCompletion(id);
    });
  }

  return (
    <Card className="flex items-center gap-4 p-4">
      <div className="min-w-0 flex-1">
        <p className="text-lg font-semibold text-text-primary">{name}</p>
        {beschreibung ? (
          <p className="mt-1 text-sm text-text-secondary line-clamp-2">
            {beschreibung}
          </p>
        ) : null}
        {target_minutes ? (
          <p className="mt-1 text-xs text-text-secondary">
            ca. {target_minutes} Min
          </p>
        ) : null}
      </div>

      <button
        type="button"
        onClick={handleToggle}
        disabled={pending}
        aria-label={completed ? "Als nicht erledigt markieren" : "Als erledigt markieren"}
        aria-pressed={completed}
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-primary/40 bg-white transition-colors duration-200 ease-gentle disabled:opacity-60"
      >
        {completed ? (
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white">
            <Check className="h-6 w-6" strokeWidth={2.5} aria-hidden />
          </span>
        ) : (
          <span className="h-11 w-11 rounded-full" />
        )}
      </button>
    </Card>
  );
}
