import type { RankedInsightItem } from "@/lib/history/analytics";

type HistoryRankedListProps = {
  items: RankedInsightItem[];
  barColor: string;
  showAvgLevel?: boolean;
};

export function HistoryRankedList({
  items,
  barColor,
  showAvgLevel = false,
}: HistoryRankedListProps) {
  if (items.length === 0) {
    return <p className="text-sm text-text-secondary">Noch zu wenig Daten.</p>;
  }

  const maxCount = Math.max(...items.map((item) => item.count), 1);

  return (
    <ul className="space-y-4">
      {items.map((item) => (
        <li key={item.label} className="min-w-0">
          <div className="flex items-start justify-between gap-3">
            <p className="min-w-0 flex-1 text-sm font-medium leading-snug text-text-primary">
              {item.label}
            </p>
            <div className="flex shrink-0 items-center gap-2">
              {showAvgLevel && item.avgLevel != null ? (
                <span className="text-xs text-text-secondary">
                  Ø {item.avgLevel.toFixed(1)}
                </span>
              ) : null}
              <span className="rounded-full bg-bg px-2.5 py-0.5 text-xs font-medium tabular-nums text-text-primary">
                {item.count}
              </span>
            </div>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-bg">
            <div
              className="h-2 rounded-full transition-all duration-200 ease-gentle"
              style={{
                width: `${Math.max(8, (item.count / maxCount) * 100)}%`,
                backgroundColor: barColor,
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
