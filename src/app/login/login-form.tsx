"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type FormStatus = "idle" | "sent";

export function LoginForm() {
  const allowedEmail = process.env.NEXT_PUBLIC_ALLOWED_EMAIL?.trim().toLowerCase();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<FormStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Bitte gib deine E-Mail-Adresse ein.");
      return;
    }

    if (allowedEmail && normalizedEmail !== allowedEmail) {
      setError("Diese E-Mail ist nicht freigegeben.");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);

    if (signInError) {
      setError("Der Magic Link konnte nicht gesendet werden. Bitte versuche es erneut.");
      return;
    }

    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <div className="rounded-2xl bg-surface p-8 shadow-soft text-center">
        <p className="text-lg font-medium text-text-primary">Check deine Mailbox.</p>
        <p className="mt-3 text-text-secondary">Der Link ist 1 Stunde gueltig.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-6">
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium text-text-secondary">
          E-Mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="deine@email.de"
          className="min-h-touch w-full rounded-2xl border border-accent/40 bg-surface px-4 text-lg text-text-primary shadow-soft outline-none transition-colors duration-200 ease-gentle focus:border-primary focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {error ? (
        <p className="text-center text-sm text-warning" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="min-h-touch w-full rounded-2xl bg-primary px-6 text-lg font-medium text-white shadow-soft transition-opacity duration-200 ease-gentle hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Wird gesendet…" : "Magic Link senden"}
      </button>
    </form>
  );
}
