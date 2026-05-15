import Link from "next/link";
import { SettingsClient } from "@/app/(app)/settings/settings-client";

export default function SettingsPage() {
  return (
    <main className="mx-auto min-h-screen max-w-lg px-6 py-8">
      <Link href="/" className="text-sm text-primary underline">
        Zurück
      </Link>
      <h1 className="mt-4 text-2xl font-semibold text-text-primary">Einstellungen</h1>
      <div className="mt-8">
        <SettingsClient />
      </div>
    </main>
  );
}
