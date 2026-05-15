function cleanEnv(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return value.trim().replace(/^["']|["']$/g, "");
}

export function getSupabaseUrl(): string {
  const url = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
  if (!url?.startsWith("http")) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL fehlt oder ist ungueltig. Pruefe .env.local im Projekt-Root und starte npm run dev neu."
    );
  }
  return url;
}

export function getSupabaseAnonKey(): string {
  const key = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  if (!key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY fehlt. Pruefe .env.local und starte npm run dev neu."
    );
  }
  return key;
}
