"use client";

import { Suspense } from "react";
import { HistoryClient } from "@/app/(app)/history/history-client";

export default function HistoryPage() {
  return (
    <main className="mx-auto min-h-screen max-w-lg px-6 py-8">
      <Suspense fallback={<p className="text-text-secondary">Laedt…</p>}>
        <HistoryClient />
      </Suspense>
    </main>
  );
}
