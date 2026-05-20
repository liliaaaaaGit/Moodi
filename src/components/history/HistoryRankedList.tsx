import type { RankedInsightItem } from "@/lib/history/analytics";

const shortenLabel = (label: string, maxLength: number = 28): string => {
  if (label.length <= maxLength) return label;
  const trimmed = label.substring(0, maxLength);
  const lastSpace = trimmed.lastIndexOf(" ");
  return lastSpace > 0 ? trimmed.substring(0, lastSpace) : trimmed;
};

type HistoryRankedListProps = {
  items: RankedInsightItem[];
  barColor: string;
};

export function HistoryRankedList({ items, barColor }: HistoryRankedListProps) {
  if (items.length === 0) {
    return <p className="text-sm text-text-secondary">Noch zu wenig Daten.</p>;
  }

  return (
    <ul className="space-y-4">
      {items.map((item) => (
        <li key={item.label.toLowerCase().trim()} className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <span className="min-w-0 flex-1 whitespace-nowrap text-sm font-medium text-text-primary">
              {shortenLabel(item.label)}
            </span>
            <span className="shrink-0 text-xs text-text-secondary">
              Ø {item.avgLevel.toFixed(1)}
            </span>
            <span className="shrink-0 rounded-full bg-bg px-2.5 py-0.5 text-xs font-medium tabular-nums text-text-primary">
              {item.count}
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-bg">
            <div
              className="h-2 rounded-full transition-all duration-200 ease-gentle"
              style={{
                width: `${(item.avgLevel / 10) * 100}%`,
                backgroundColor: barColor,
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
