import { LoginForm } from "@/app/login/login-form";

const ERROR_MESSAGES: Record<string, string> = {
  auth: "Anmeldung fehlgeschlagen. Bitte fordere einen neuen Magic Link an.",
  not_allowed: "Diese E-Mail ist nicht freigegeben.",
  setup: "Dein Konto konnte nicht eingerichtet werden. Bitte versuche es erneut.",
};

type LoginPageProps = {
  searchParams?: { error?: string };
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  const errorKey = searchParams?.error;
  const callbackError = errorKey ? ERROR_MESSAGES[errorKey] : null;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm space-y-8">
        <header className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-text-primary">
            Anspannung-Tracker
          </h1>
          <p className="text-text-secondary">
            Melde dich mit deinem Magic Link an.
          </p>
        </header>

        {callbackError ? (
          <p className="text-center text-sm text-warning" role="alert">
            {callbackError}
          </p>
        ) : null}

        <LoginForm />
      </div>
    </main>
  );
}
