"use server";

import { redirect } from "next/navigation";
import { ensureUserSetup } from "@/lib/auth/ensure-user-setup";
import { createClient } from "@/lib/supabase/server";

export type LoginState = {
  error?: string;
};

function getAllowedEmail(): string | null {
  const allowed = process.env.NEXT_PUBLIC_ALLOWED_EMAIL?.trim().toLowerCase();
  return allowed || null;
}

export async function loginWithPassword(
  _prev: LoginState | null,
  formData: FormData
): Promise<LoginState> {
  const allowedEmail = getAllowedEmail();
  const emailFromForm = formData.get("email")?.toString().trim().toLowerCase() ?? "";
  const email = allowedEmail ?? emailFromForm;
  const password = formData.get("password")?.toString() ?? "";

  if (!email) {
    return { error: "Bitte gib deine E-Mail-Adresse ein." };
  }

  if (!password) {
    return { error: "Bitte gib dein Passwort ein." };
  }

  if (allowedEmail && email !== allowedEmail) {
    return { error: "Diese E-Mail ist nicht freigegeben." };
  }

  const supabase = createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    return { error: "E-Mail oder Passwort ist falsch." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Anmeldung fehlgeschlagen." };
  }

  try {
    const setup = await ensureUserSetup(supabase, user);
    if (!setup.ok) {
      await supabase.auth.signOut();
      return { error: "Diese E-Mail ist nicht freigegeben." };
    }
  } catch {
    await supabase.auth.signOut();
    return { error: "Dein Konto konnte nicht eingerichtet werden. Bitte versuche es erneut." };
  }

  redirect("/");
}
