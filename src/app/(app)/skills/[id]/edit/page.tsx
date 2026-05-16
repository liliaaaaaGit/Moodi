import { notFound, redirect } from "next/navigation";
import { SkillForm } from "@/components/SkillForm";
import { createClient } from "@/lib/supabase/server";

type EditSkillPageProps = {
  params: { id: string };
};

export default async function EditSkillPage({ params }: EditSkillPageProps) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: skill } = await supabase
    .from("skills")
    .select(
      "id, name, kategorie, dauer_minuten, level_min, level_max, beschreibung, ist_lang"
    )
    .eq("id", params.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!skill) {
    notFound();
  }

  return (
    <main className="mx-auto min-h-screen max-w-lg px-6 py-8">
      <h1 className="text-2xl font-semibold text-text-primary">Skill bearbeiten</h1>
      <div className="mt-8">
        <SkillForm
          skillId={skill.id}
          initial={{
            name: skill.name,
            kategorie: skill.kategorie,
            dauer_minuten: skill.dauer_minuten,
            level_min: skill.level_min,
            level_max: skill.level_max,
            beschreibung: skill.beschreibung ?? "",
            ist_lang: skill.ist_lang ?? false,
          }}
        />
      </div>
    </main>
  );
}
