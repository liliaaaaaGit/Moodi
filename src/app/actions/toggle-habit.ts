"use server";

import { revalidatePath } from "next/cache";
import { getBerlinToday } from "@/lib/date/berlin";
import { createClient } from "@/lib/supabase/server";

export async function toggleHabitCompletion(habitId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Nicht angemeldet");
  }

  const today = getBerlinToday();

  const { data: existing } = await supabase
    .from("habit_completions")
    .select("id")
    .eq("habit_id", habitId)
    .eq("user_id", user.id)
    .eq("completed_date", today)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("habit_completions")
      .delete()
      .eq("id", existing.id);

    if (error) throw error;
  } else {
    const { error } = await supabase.from("habit_completions").insert({
      habit_id: habitId,
      user_id: user.id,
    });

    if (error) throw error;
  }

  revalidatePath("/");
}
