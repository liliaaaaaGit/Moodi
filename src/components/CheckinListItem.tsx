import Link from "next/link";
import { Card } from "@/components/Card";
import { formatBerlinTime } from "@/lib/date/berlin";

type CheckinListItemProps = {
  id: string;
  created_at: string;
  level_before: number;
  excerpt: string | null;
};

export function CheckinListItem({
  id,
  created_at,
  level_before,
  excerpt,
}: CheckinListItemProps) {
  return (
    <Link href={`/history/${id}`} className="block">
      <Card className="flex items-center gap-4 p-4 transition-opacity hover:opacity-95">
        <div className="min-w-0 flex-1">
          <p className="text-sm text-text-secondary">{formatBerlinTime(created_at)}</p>
          {excerpt ? (
            <p className="mt-1 truncate text-sm text-text-primary">{excerpt}</p>
          ) : (
            <p className="mt-1 text-sm text-text-secondary italic">Kein Auszug</p>
          )}
        </div>
        <p className="text-3xl font-semibold tabular-nums text-primary">
          {level_before}
        </p>
      </Card>
    </Link>
  );
}
