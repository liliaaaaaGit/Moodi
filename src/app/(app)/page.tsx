import { CheckinListItem } from "@/components/CheckinListItem";
import { HabitCard } from "@/components/HabitCard";
import { NewCheckinCard } from "@/components/NewCheckinCard";
import { SectionHeader } from "@/components/SectionHeader";
import { TodaySparkline } from "@/components/TodaySparkline";
import { Card } from "@/components/Card";
import { HeutePwaExtras } from "@/components/HeutePwaExtras";
import { SettingsLink } from "@/components/SettingsLink";
import { loadHeuteData } from "@/lib/data/heute";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function HeutePage() {
  const data = await loadHeuteData();

  if (!data) {
    redirect("/login");
  }

  const { habits, sparkline, listItems } = data;

  return (
    <main className="mx-auto min-h-screen max-w-lg px-6 py-8">
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold text-text-primary">Huhuuu!</h1>
        <SettingsLink />
      </div>

      <HeutePwaExtras />

      <div className="mt-4 space-y-8">
        <NewCheckinCard />

        {habits.length > 0 ? (
          <section className="space-y-3">
            <SectionHeader>Habits</SectionHeader>
            {habits.map((habit) => (
              <HabitCard
                key={habit.id}
                id={habit.id}
                name={habit.name}
                beschreibung={habit.beschreibung}
                target_minutes={habit.target_minutes}
                completed={habit.completed}
              />
            ))}
          </section>
        ) : null}

        <section className="space-y-3">
          <SectionHeader>Heute</SectionHeader>

          {listItems.length > 0 ? (
            <>
              <Card className="p-4">
                <TodaySparkline data={sparkline} />
              </Card>
              <div className="space-y-2">
                {listItems.map((checkin) => (
                  <CheckinListItem
                    key={checkin.id}
                    id={checkin.id}
                    created_at={checkin.created_at}
                    level_before={checkin.level_before}
                    excerpt={checkin.excerpt}
                  />
                ))}
              </div>
            </>
          ) : (
            <p className="text-center text-sm text-text-secondary">
              Heute noch kein Eintrag.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
