"use client";

import { X } from "lucide-react";

export type ChartPointDetail = {
  id: string;
  dateLabel: string;
  level: number;
  situation: string | null;
  skillName: string | null;
};

type HistoryPointSheetProps = {
  point: ChartPointDetail | null;
  onClose: () => void;
};

export function HistoryPointSheet({ point, onClose }: HistoryPointSheetProps) {
  if (!point) return null;

  return (
    <div className="fixed inset-0 z-[80] flex flex-col justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-text-primary/30"
        aria-label="Schliessen"
        onClick={onClose}
      />
      <div
        className="relative rounded-t-3xl bg-white px-6 pb-8 pt-4 shadow-soft-lg"
        style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom))" }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">Check-in</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full text-text-secondary"
            aria-label="Schliessen"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="text-sm text-text-secondary">{point.dateLabel}</p>
        <p className="mt-2 text-4xl font-semibold tabular-nums text-primary">
          {point.level}
        </p>
        {point.situation ? (
          <p className="mt-4 text-text-primary">{point.situation}</p>
        ) : (
          <p className="mt-4 text-sm italic text-text-secondary">Keine Situation notiert</p>
        )}
        {point.skillName ? (
          <p className="mt-3 text-sm text-text-secondary">
            Skill: <span className="font-medium text-text-primary">{point.skillName}</span>
          </p>
        ) : null}
      </div>
    </div>
  );
}
