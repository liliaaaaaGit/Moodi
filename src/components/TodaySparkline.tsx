"use client";

import { useRouter } from "next/navigation";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

type SparkPoint = {
  id: string;
  time: string;
  level: number;
};

type TodaySparklineProps = {
  data: SparkPoint[];
};

function ClickableDot(props: {
  cx?: number;
  cy?: number;
  payload?: SparkPoint;
  onSelect: (point: SparkPoint) => void;
}) {
  const { cx = 0, cy = 0, payload, onSelect } = props;
  if (!payload) return null;

  return (
    <circle
      cx={cx}
      cy={cy}
      r={4}
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

export function TodaySparkline({ data }: TodaySparklineProps) {
  const router = useRouter();

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
            dot={(props) => (
              <ClickableDot
                {...props}
                onSelect={(point) => router.push(`/history/${point.id}`)}
              />
            )}
            activeDot={{ r: 5, cursor: "pointer" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
