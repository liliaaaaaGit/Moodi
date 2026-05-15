import Link from "next/link";
import { CheckinEditForm } from "@/app/(app)/history/[id]/edit/checkin-edit-form";

type EditCheckinPageProps = {
  params: { id: string };
};

export default function EditCheckinPage({ params }: EditCheckinPageProps) {
  return (
    <main className="mx-auto min-h-screen max-w-lg px-6 py-8">
      <Link href={`/history/${params.id}`} className="text-sm text-primary underline">
        Abbrechen
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-text-primary">Check-in bearbeiten</h1>
      <div className="mt-8">
        <CheckinEditForm checkinId={params.id} />
      </div>
    </main>
  );
}
