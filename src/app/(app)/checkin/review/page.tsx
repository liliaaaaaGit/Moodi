import { Suspense } from "react";
import { ReviewClient } from "@/app/(app)/checkin/review/review-client";

export default function ReviewPage() {
  return (
    <main className="mx-auto min-h-screen max-w-lg px-6 py-8">
      <Suspense
        fallback={
          <p className="py-12 text-center text-text-secondary">Laedt Auswertung…</p>
        }
      >
        <ReviewClient />
      </Suspense>
    </main>
  );
}
