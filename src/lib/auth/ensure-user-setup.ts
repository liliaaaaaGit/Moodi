import type { SupabaseClient, User } from "@supabase/supabase-js";

const DEFAULT_REMINDER_TIMES = ["10:00", "15:00", "21:00"];

export async function ensureUserSetup(
  supabase: SupabaseClient,
  user: User
): Promise<{ ok: true } | { ok: false; reason: "not_allowed" }> {
  const allowedEmail = process.env.NEXT_PUBLIC_ALLOWED_EMAIL?.trim().toLowerCase();
  const userEmail = user.email?.trim().toLowerCase();

  if (allowedEmail && userEmail !== allowedEmail) {
    await supabase.auth.signOut();
    return { ok: false, reason: "not_allowed" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (profile) {
    return { ok: true };
  }

  const { error: profileError } = await supabase.from("profiles").insert({
    id: user.id,
    email: user.email ?? "",
  });

  if (profileError) {
    throw profileError;
  }

  const { error: seedError } = await supabase.rpc("seed_user_defaults", {
    p_user_id: user.id,
  });

  if (seedError) {
    throw seedError;
  }

  const { error: settingsError } = await supabase.from("settings").insert({
    user_id: user.id,
    reminder_times: DEFAULT_REMINDER_TIMES,
  });

  if (settingsError) {
    throw settingsError;
  }

  return { ok: true };
}
