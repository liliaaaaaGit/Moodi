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

export function HistoryHeatmap({ cells, weekdayLabels }: HistoryHeatmapProps) {
  const getCell = (weekday: number, bucket: TimeBucket) =>
    cells.find((c) => c.weekday === weekday && c.bucket === bucket);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[320px]">
        <div className="grid grid-cols-8 gap-1">
          <div />
          {weekdayLabels.map((label) => (
            <p key={label} className="text-center text-xs font-medium text-text-secondary">
              {label}
            </p>
          ))}
          {BUCKET_ORDER.map((bucket) => {
            const bucketLabel = cells.find((c) => c.bucket === bucket)?.bucketLabel ?? bucket;
            return (
              <Fragment key={bucket}>
                <p className="flex items-center text-xs text-text-secondary">{bucketLabel}</p>
                {weekdayLabels.map((_, weekday) => {
                  const cell = getCell(weekday, bucket);
                  return (
                    <div
                      key={`${bucket}-${weekday}`}
                      title={
                        cell?.avgLevel != null
                          ? `Ø ${cell.avgLevel.toFixed(1)} (${cell.count})`
                          : "Keine Daten"
                      }
                      className="aspect-square min-h-8 rounded-lg border border-white/60"
                      style={{
                        backgroundColor: heatmapColor(cell?.avgLevel ?? null),
                      }}
                    />
                  );
                })}
              </Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
