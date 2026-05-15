import { Plus } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/Card";

export function NewCheckinCard() {
  return (
    <Link href="/checkin" className="block">
      <Card className="flex items-center justify-between gap-4 border border-primary/20 bg-primary/5 p-6 transition-opacity hover:opacity-95">
        <div>
          <p className="text-xl font-semibold text-text-primary">Anspannung</p>
          <p className="mt-1 text-sm text-text-secondary">
            Wie ist es gerade?
          </p>
        </div>
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-soft">
          <Plus className="h-7 w-7" strokeWidth={2.25} aria-hidden />
        </span>
      </Card>
    </Link>
  );
}
