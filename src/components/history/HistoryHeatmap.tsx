"use client";

import { Fragment } from "react";
import { heatmapColor, type TimeBucket } from "@/lib/history/analytics";

type HeatmapCell = {
  weekday: number;
  weekdayLabel: string;
  bucket: TimeBucket;
  bucketLabel: string;
  avgLevel: number | null;
  count: number;
};

type HistoryHeatmapProps = {
  cells: HeatmapCell[];
  weekdayLabels: string[];
};

const BUCKET_ORDER: TimeBucket[] = ["morning", "midday", "evening", "night"];

const ROW_LABELS: Record<TimeBucket, string> = {
  morning: "Morgen",
  midday: "Mittag",
  evening: "Abend",
  night: "Nacht",
};

/** 44px Label + 7×32px Zellen + 7×4px Gaps = 296px — passt in 375px Viewport. */
const GRID_STYLE = {
  gridTemplateColumns: "44px repeat(7, 32px)",
  gap: "4px",
} as const;

export function HistoryHeatmap({ cells, weekdayLabels }: HistoryHeatmapProps) {
  const getCell = (weekday: number, bucket: TimeBucket) =>
    cells.find((c) => c.weekday === weekday && c.bucket === bucket);

  return (
    <div className="flex justify-center overflow-hidden">
      <div
        className="grid"
        style={GRID_STYLE}
        role="grid"
        aria-label="Anspannung nach Wochentag und Tageszeit"
      >
        <div role="presentation" />

        {weekdayLabels.map((label) => (
          <p
            key={label}
            className="flex h-8 items-center justify-center text-[11px] font-medium text-text-secondary"
          >
            {label}
          </p>
        ))}

        {BUCKET_ORDER.map((bucket) => (
          <Fragment key={bucket}>
            <p className="flex h-8 items-center justify-end pr-0.5 text-[11px] leading-tight text-text-secondary">
              {ROW_LABELS[bucket]}
            </p>
            {weekdayLabels.map((_, weekday) => {
              const cell = getCell(weekday, bucket);
              const avg = cell?.avgLevel ?? null;
              return (
                <div
                  key={`${bucket}-${weekday}`}
                  role="gridcell"
                  title={
                    avg != null
                      ? `Ø ${avg.toFixed(1)} (${cell?.count ?? 0} Check-ins)`
                      : "Keine Daten"
                  }
                  className="h-8 w-8 shrink-0 rounded-md"
                  style={{ backgroundColor: heatmapColor(avg) }}
                />
              );
            })}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
