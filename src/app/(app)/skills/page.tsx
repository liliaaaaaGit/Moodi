import { Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SkillListItem } from "@/components/SkillListItem";
import {
  groupCopeSkills,
  partitionSkills,
  type SkillListRow,
} from "@/lib/skills/grouping";
import { createClient } from "@/lib/supabase/server";

function CategoryGroupLabel({ children }: { children: string }) {
  return (
    <h4 className="text-xs font-medium uppercase tracking-wider text-text-secondary">
      {children}
    </h4>
  );
}

export default async function SkillsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: skills } = await supabase
    .from("skills")
    .select(
      "id, name, kategorie, dauer_minuten, level_min, level_max, ist_lang"
    )
    .eq("user_id", user.id)
    .order("name");

  const rows = (skills ?? []) as SkillListRow[];
  const { cope, thrive, special } = partitionSkills(rows);
  const copeGroups = groupCopeSkills(cope);
  const thriveSorted = [...thrive].sort((a, b) =>
    a.name.localeCompare(b.name, "de")
  );
  const specialSorted = [...special].sort((a, b) =>
    a.name.localeCompare(b.name, "de")
  );

  const isEmpty = rows.length === 0;

  return (
    <main className="mx-auto min-h-screen max-w-lg px-6 py-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-text-primary">Skills</h1>
        <Link
          href="/skills/new"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-soft"
          aria-label="Neuer Skill"
        >
          <Plus className="h-6 w-6" aria-hidden />
        </Link>
      </div>

      {isEmpty ? (
        <p className="mt-8 text-text-secondary">Noch keine Skills vorhanden.</p>
      ) : (
        <div className="mt-8 space-y-10">
          {cope.length > 0 ? (
            <section className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-text-primary">
                  Cope (1–10 Min)
                </h2>
                <p className="mt-0.5 text-sm text-text-secondary">
                  Schnelle Skills
                </p>
              </div>

              <div className="space-y-6">
                {copeGroups.map((group) => (
                  <div key={group.title} className="space-y-2">
                    <CategoryGroupLabel>{group.title}</CategoryGroupLabel>
                    <div className="space-y-2">
                      {group.skills.map((skill) => (
                        <SkillListItem
                          key={skill.id}
                          {...skill}
                          showLevel
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {thriveSorted.length > 0 ? (
            <section className="space-y-3">
              <div>
                <h2 className="text-lg font-semibold text-text-primary">
                  Thrive
                </h2>
                <p className="mt-0.5 text-sm text-text-secondary">
                  Längere Skills
                </p>
              </div>
              <div className="space-y-2">
                {thriveSorted.map((skill) => (
                  <SkillListItem
                    key={skill.id}
                    {...skill}
                    showLevel={false}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {specialSorted.length > 0 ? (
            <section className="space-y-3 border-t border-accent/25 pt-8">
              <div>
                <h3 className="text-sm font-medium text-text-secondary">
                  Spezielle Skills
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-text-secondary/90">
                  Werden nur bei spezifischen Triggern automatisch vorgeschlagen
                </p>
              </div>
              <div className="space-y-2">
                {specialSorted.map((skill) => (
                  <SkillListItem
                    key={skill.id}
                    {...skill}
                    showLevel={false}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </main>
  );
}
