import { Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SkillListItem } from "@/components/SkillListItem";
import { SectionHeader } from "@/components/SectionHeader";
import { formatCategory } from "@/lib/skills/categories";
import { createClient } from "@/lib/supabase/server";

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
    .select("id, name, kategorie, dauer_minuten, level_min, level_max, aktiv")
    .eq("user_id", user.id)
    .order("kategorie")
    .order("name");

  const grouped = (skills ?? []).reduce<
    Record<string, NonNullable<typeof skills>>
  >((acc, skill) => {
    const key = skill.kategorie;
    if (!acc[key]) acc[key] = [];
    acc[key]!.push(skill);
    return acc;
  }, {});

  const categories = Object.keys(grouped).sort();

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

      {categories.length === 0 ? (
        <p className="mt-8 text-text-secondary">Noch keine Skills vorhanden.</p>
      ) : (
        <div className="mt-8 space-y-8">
          {categories.map((category) => (
            <section key={category} className="space-y-3">
              <SectionHeader>{formatCategory(category)}</SectionHeader>
              {grouped[category]!.map((skill) => (
                <SkillListItem key={skill.id} {...skill} />
              ))}
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
