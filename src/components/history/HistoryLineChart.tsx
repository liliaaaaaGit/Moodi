"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartPointDetail } from "@/components/history/HistoryPointSheet";

export type ChartPoint = ChartPointDetail & {
  label: string;
  created_at: string;
};

type HistoryLineChartProps = {
  data: ChartPoint[];
  onPointSelect: (point: ChartPoint) => void;
};

const BERLIN_TZ = "Europe/Berlin";

function berlinDayKey(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: BERLIN_TZ });
}

/** Erster Datenpunkt pro Kalendertag (Berlin) — ein Tick pro Tag. */
function buildDayTicks(points: ChartPoint[]): string[] {
  const seen = new Set<string>();
  const ticks: string[] = [];
  for (const point of points) {
    const day = berlinDayKey(point.created_at);
    if (!seen.has(day)) {
      seen.add(day);
      ticks.push(point.created_at);
    }
  }
  return ticks;
}

function formatWeekdayTick(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return format(date, "EEE", { locale: de }).replace(/\.$/, "");
}

function ClickableDot(props: {
  cx?: number;
  cy?: number;
  payload?: ChartPoint;
  onSelect: (point: ChartPoint) => void;
}) {
  const { cx = 0, cy = 0, payload, onSelect } = props;
  if (!payload) return null;

  return (
    <circle
      cx={cx}
      cy={cy}
      r={5}
      fill="#7BA7C9"
      stroke="#fff"
      strokeWidth={2}
      style={{ cursor: "pointer" }}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(payload);
      }}
    />
  );
}

export function HistoryLineChart({ data, onPointSelect }: HistoryLineChartProps) {
  const dayTicks = useMemo(() => buildDayTicks(data), [data]);

  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-text-secondary">
        Keine Daten für diesen Zeitraum.
      </p>
    );
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 10, right: 16, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e8eef4" vertical={false} />
          <XAxis
            dataKey="created_at"
            ticks={dayTicks}
            tick={{ fontSize: 10, fill: "#6B7A8C" }}
            tickFormatter={formatWeekdayTick}
            interval={0}
          />
          <YAxis
            domain={[0, 10]}
            ticks={[0, 2, 4, 6, 8, 10]}
            width={28}
            tick={{ fontSize: 11, fill: "#6B7A8C" }}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: "none",
              boxShadow: "0 4px 24px rgba(30,42,56,0.12)",
            }}
            labelFormatter={(value) => formatWeekdayTick(String(value))}
            formatter={(value) => [`Level ${value}`, "Anspannung"]}
          />
          <Line
            type="monotone"
            dataKey="level"
            stroke="#7BA7C9"
            strokeWidth={2.5}
            dot={(props) => <ClickableDot {...props} onSelect={onPointSelect} />}
            activeDot={{ r: 7, fill: "#7BA7C9", cursor: "pointer" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
