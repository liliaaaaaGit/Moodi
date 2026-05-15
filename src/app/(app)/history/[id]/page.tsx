import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Card } from "@/components/Card";
import { SectionHeader } from "@/components/SectionHeader";
import { formatBerlinTime, getBerlinToday, isSameBerlinDay } from "@/lib/date/berlin";
import { createClient } from "@/lib/supabase/server";

type HistoryDetailPageProps = {
  params: { id: string };
};

const FIELDS = [
  { key: "situation", label: "Situation" },
  { key: "gedanken", label: "Gedanken" },
  { key: "koerper", label: "Koerper" },
  { key: "gefuehl", label: "Gefuehl" },
  { key: "beduerfnis", label: "Beduerfnis" },
] as const;

export default async function HistoryDetailPage({ params }: HistoryDetailPageProps) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: checkin } = await supabase
    .from("checkins")
    .select(
      "id, created_at, level_before, level_after, input_raw, situation, gedanken, koerper, gefuehl, beduerfnis, crisis_flag, skill_status"
    )
    .eq("id", params.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!checkin) {
    notFound();
  }

  const dateLabel = isSameBerlinDay(checkin.created_at, getBerlinToday())
    ? "Heute"
    : new Date(checkin.created_at).toLocaleDateString("de-DE", {
        timeZone: "Europe/Berlin",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

  return (
    <main className="mx-auto min-h-screen max-w-lg px-6 py-8">
      <Link href="/history" className="text-sm text-primary underline">
        Zurueck zum Verlauf
      </Link>

      <h1 className="mt-4 text-2xl font-semibold text-text-primary">
        Check-in · {dateLabel}
      </h1>
      <p className="mt-1 text-text-secondary">
        {formatBerlinTime(checkin.created_at)} · Level {checkin.level_before}
        {checkin.level_after != null ? ` → ${checkin.level_after}` : ""}
      </p>

      {checkin.crisis_flag ? (
        <Card className="mt-6 border border-warning/30 bg-warning/5">
          <p className="text-sm text-warning">Krisen-Check-in</p>
        </Card>
      ) : null}

      {checkin.input_raw ? (
        <Card className="mt-6">
          <SectionHeader>Original</SectionHeader>
          <p className="mt-2 text-sm text-text-secondary">{checkin.input_raw}</p>
        </Card>
      ) : null}

      <section className="mt-6 space-y-3">
        {FIELDS.map(({ key, label }) => {
          const value = checkin[key];
          if (!value?.trim()) return null;
          return (
            <Card key={key}>
              <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
                {label}
              </p>
              <p className="mt-2 text-text-primary">{value}</p>
            </Card>
          );
        })}
      </section>

      {checkin.skill_status ? (
        <p className="mt-6 text-sm text-text-secondary">
          Skill-Status: {checkin.skill_status}
        </p>
      ) : null}
    </main>
  );
}
