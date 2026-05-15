import { NextResponse } from "next/server";
import { ensureUserSetup } from "@/lib/auth/ensure-user-setup";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  const supabase = createClient();
  const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

  if (sessionError) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  try {
    const setup = await ensureUserSetup(supabase, user);

    if (!setup.ok) {
      return NextResponse.redirect(`${origin}/login?error=not_allowed`);
    }
  } catch {
    return NextResponse.redirect(`${origin}/login?error=setup`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
