"use client";

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
};

type HistoryLineChartProps = {
  data: ChartPoint[];
  onPointSelect: (point: ChartPoint) => void;
};

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
  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-text-secondary">
        Keine Daten für diesen Zeitraum.
      </p>
    );
  }

  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e8eef4" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: "#6B7A8C" }}
            interval="preserveStartEnd"
            minTickGap={24}
          />
          <YAxis
            domain={[0, 10]}
            ticks={[0, 2, 4, 6, 8, 10]}
            tick={{ fontSize: 11, fill: "#6B7A8C" }}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: "none",
              boxShadow: "0 4px 24px rgba(30,42,56,0.12)",
            }}
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
