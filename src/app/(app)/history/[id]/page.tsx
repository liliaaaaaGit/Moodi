import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Card } from "@/components/Card";
import { CheckinDetailActions } from "@/components/history/CheckinDetailActions";
import { SectionHeader } from "@/components/SectionHeader";
import { formatHilfreich, formatSkillStatus } from "@/lib/checkin/labels";
import { formatBerlinTime, getBerlinToday, isSameBerlinDay } from "@/lib/date/berlin";
import { createClient } from "@/lib/supabase/server";

type HistoryDetailPageProps = {
  params: { id: string };
};

const FIELDS = [
  { key: "situation", label: "Situation" },
  { key: "gedanken", label: "Gedanken" },
  { key: "koerper", label: "Körper" },
  { key: "gefuehl", label: "Gefühl" },
  { key: "beduerfnis", label: "Bedürfnis" },
] as const;

type SkillRow = {
  id: string;
  name: string;
  kategorie: string;
  dauer_minuten: number | null;
  beschreibung: string | null;
};

async function loadSkill(
  supabase: ReturnType<typeof createClient>,
  skillId: string | null
): Promise<SkillRow | null> {
  if (!skillId) return null;
  const { data } = await supabase
    .from("skills")
    .select("id, name, kategorie, dauer_minuten, beschreibung")
    .eq("id", skillId)
    .maybeSingle();
  return data;
}

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
      "id, created_at, level_before, level_after, input_raw, situation, gedanken, koerper, gefuehl, beduerfnis, crisis_flag, skill_status, suggested_skill_id, chosen_skill_id, chosen_long_skill_id, hilfreich, comment"
    )
    .eq("id", params.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!checkin) {
    notFound();
  }

  const [suggestedSkill, chosenSkill, chosenLongSkill] = await Promise.all([
    loadSkill(supabase, checkin.suggested_skill_id),
    loadSkill(supabase, checkin.chosen_skill_id),
    loadSkill(supabase, checkin.chosen_long_skill_id),
  ]);

  const dateLabel = isSameBerlinDay(checkin.created_at, getBerlinToday())
    ? "Heute"
    : new Date(checkin.created_at).toLocaleDateString("de-DE", {
        timeZone: "Europe/Berlin",
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });

  const timeLabel = formatBerlinTime(checkin.created_at);
  const displaySkill = chosenSkill ?? chosenLongSkill ?? suggestedSkill;
  const skillRole = chosenSkill || chosenLongSkill
    ? "Gewählter Skill"
    : suggestedSkill
      ? "Vorgeschlagener Skill"
      : null;
  const noSkillDone =
    checkin.skill_status === "nicht_gemacht" &&
    !checkin.chosen_skill_id &&
    !checkin.chosen_long_skill_id;
  const hasSkillInfo =
    noSkillDone ||
    displaySkill ||
    checkin.skill_status ||
    checkin.level_after != null ||
    checkin.hilfreich ||
    checkin.comment?.trim();

  const structuredFields = FIELDS.filter(({ key }) => {
    const value = checkin[key];
    return typeof value === "string" && value.trim().length > 0;
  });

  return (
    <main className="mx-auto min-h-screen max-w-lg px-6 py-8">
      <Link href="/history" className="text-sm text-primary underline">
        Zurück zum Verlauf
      </Link>

      {checkin.crisis_flag ? (
        <p className="mt-4 rounded-xl border border-warning/30 bg-warning/10 px-4 py-2 text-center text-sm font-medium text-warning">
          Krisen-Eintrag
        </p>
      ) : null}

      <header className={checkin.crisis_flag ? "mt-4" : "mt-6"}>
        <p className="text-sm text-text-secondary">
          {dateLabel} · {timeLabel}
        </p>
        <p className="mt-2 text-[60px] font-semibold leading-none tabular-nums text-primary">
          {checkin.level_before}
        </p>
      </header>

      {structuredFields.length > 0 ? (
        <section className="mt-8 space-y-3">
          {structuredFields.map(({ key, label }) => (
            <Card key={key}>
              <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
                {label}
              </p>
              <p className="mt-2 text-text-primary">{checkin[key]}</p>
            </Card>
          ))}
        </section>
      ) : null}

      {checkin.input_raw?.trim() ? (
        <Card className="mt-6 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">
            Originaltext
          </p>
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">{checkin.input_raw}</p>
        </Card>
      ) : null}

      {hasSkillInfo ? (
        <Card className="mt-6 space-y-3 p-5">
          <SectionHeader>Skill</SectionHeader>
          {noSkillDone ? (
            <p className="text-sm text-text-secondary">Skill: keiner gemacht</p>
          ) : null}
          {!noSkillDone && displaySkill && skillRole ? (
            <div>
              <p className="text-xs text-text-secondary">{skillRole}</p>
              <p className="mt-1 font-medium text-text-primary">{displaySkill.name}</p>
              <p className="mt-1 text-sm text-text-secondary">
                {displaySkill.kategorie}
                {displaySkill.dauer_minuten ? ` · ${displaySkill.dauer_minuten} Min` : ""}
              </p>
            </div>
          ) : null}
          {!noSkillDone && checkin.skill_status ? (
            <p className="text-sm text-text-secondary">
              Status:{" "}
              <span className="text-text-primary">
                {formatSkillStatus(checkin.skill_status)}
              </span>
            </p>
          ) : null}
          {checkin.level_after != null ? (
            <p className="text-sm text-text-secondary">
              Level danach:{" "}
              <span className="font-medium text-text-primary">{checkin.level_after}</span>
            </p>
          ) : null}
          {checkin.hilfreich ? (
            <p className="text-sm text-text-secondary">
              Hilfreich:{" "}
              <span className="text-text-primary">{formatHilfreich(checkin.hilfreich)}</span>
            </p>
          ) : null}
          {checkin.comment?.trim() ? (
            <p className="text-sm text-text-secondary">
              Kommentar: <span className="text-text-primary">{checkin.comment}</span>
            </p>
          ) : null}
        </Card>
      ) : null}

      <CheckinDetailActions checkinId={checkin.id} />
    </main>
  );
}
