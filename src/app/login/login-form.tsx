"use client";

import { useFormState, useFormStatus } from "react-dom";
import { loginWithPassword, type LoginState } from "@/app/actions/login";

const allowedEmail = process.env.NEXT_PUBLIC_ALLOWED_EMAIL?.trim().toLowerCase();

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-touch w-full rounded-2xl bg-primary px-6 text-lg font-medium text-white shadow-soft transition-opacity duration-200 ease-gentle hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Wird angemeldet…" : "Anmelden"}
    </button>
  );
}

export function LoginForm() {
  const [state, formAction] = useFormState<LoginState | null, FormData>(
    loginWithPassword,
    null
  );

  return (
    <form action={formAction} className="w-full max-w-sm space-y-6">
      {allowedEmail ? (
        <div className="space-y-2">
          <span className="block text-sm font-medium text-text-secondary">E-Mail</span>
          <p className="min-h-touch rounded-2xl border border-accent/20 bg-bg px-4 py-3 text-lg text-text-primary">
            {allowedEmail}
          </p>
          <input type="hidden" name="email" value={allowedEmail} />
        </div>
      ) : (
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
            placeholder="deine@email.de"
            className="min-h-touch w-full rounded-2xl border border-accent/40 bg-surface px-4 text-lg text-text-primary shadow-soft outline-none transition-colors duration-200 ease-gentle focus:border-primary focus:ring-2 focus:ring-primary/30"
          />
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-medium text-text-secondary">
          Passwort
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="min-h-touch w-full rounded-2xl border border-accent/40 bg-surface px-4 text-lg text-text-primary shadow-soft outline-none transition-colors duration-200 ease-gentle focus:border-primary focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {state?.error ? (
        <p className="text-center text-sm text-warning" role="alert">
          {state.error}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}
