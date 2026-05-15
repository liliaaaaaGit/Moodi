import { Suspense } from "react";
import { CrisisClient } from "@/app/(app)/checkin/crisis/crisis-client";

export default function CrisisPage() {
  return (
    <main className="mx-auto min-h-screen max-w-lg px-6 py-8">
      <Suspense
        fallback={
          <p className="py-12 text-center text-text-secondary">Einen Moment…</p>
        }
      >
        <CrisisClient />
      </Suspense>
    </main>
  );
}
