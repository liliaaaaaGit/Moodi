"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { useRouter } from "next/navigation";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
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
};

type ActivePoint = {
  checkinId: string;
  level: number;
  x: number;
  y: number;
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

function ChartDot({
  cx,
  cy,
  payload,
  onActivate,
}: {
  cx?: number;
  cy?: number;
  payload?: ChartPoint;
  onActivate: (point: ActivePoint) => void;
}) {
  if (cx == null || cy == null || !payload) return null;

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
        onActivate({
          checkinId: payload.id,
          level: payload.level,
          x: cx,
          y: cy,
        });
      }}
    />
  );
}

export function HistoryLineChart({ data }: HistoryLineChartProps) {
  const router = useRouter();
  const [activePoint, setActivePoint] = useState<ActivePoint | null>(null);
  const dayTicks = useMemo(() => buildDayTicks(data), [data]);

  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-text-secondary">
        Keine Daten für diesen Zeitraum.
      </p>
    );
  }

  return (
    <div className="relative w-full" onClick={() => setActivePoint(null)}>
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
          <Line
            type="monotone"
            dataKey="level"
            stroke="#7BA7C9"
            strokeWidth={2.5}
            dot={(props) => (
              <ChartDot {...props} onActivate={setActivePoint} />
            )}
            activeDot={(props) => (
              <ChartDot {...props} onActivate={setActivePoint} />
            )}
          />
        </LineChart>
      </ResponsiveContainer>

      {activePoint ? (
        <div
          className="absolute z-10 flex cursor-pointer items-center gap-3 rounded-2xl border border-accent bg-white px-4 py-3 shadow-soft-lg"
          style={{
            top: activePoint.y - 70,
            left: Math.max(8, activePoint.x - 60),
          }}
          onClick={(event) => {
            event.stopPropagation();
            router.push(`/history/${activePoint.checkinId}`);
          }}
        >
          <span className="text-3xl font-bold text-primary">{activePoint.level}</span>
          <span className="text-sm text-text-secondary">Eintrag ansehen →</span>
        </div>
      ) : null}
    </div>
  );
}
