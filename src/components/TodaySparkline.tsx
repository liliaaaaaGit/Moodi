"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

type SparkPoint = {
  time: string;
  level: number;
};

type TodaySparklineProps = {
  data: SparkPoint[];
};

export function TodaySparkline({ data }: TodaySparklineProps) {
  if (data.length === 0) return null;

  return (
    <div className="h-24 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <XAxis dataKey="time" hide />
          <YAxis domain={[0, 10]} hide />
          <Line
            type="monotone"
            dataKey="level"
            stroke="#7BA7C9"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "#7BA7C9" }}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
