import { SkillForm } from "@/components/SkillForm";

export default function NewSkillPage() {
  return (
    <main className="mx-auto min-h-screen max-w-lg px-6 py-8">
      <h1 className="text-2xl font-semibold text-text-primary">Neuer Skill</h1>
      <div className="mt-8">
        <SkillForm />
      </div>
    </main>
  );
}
