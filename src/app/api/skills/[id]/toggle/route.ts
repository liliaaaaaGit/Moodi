import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  aktiv: z.boolean(),
});

type RouteContext = { params: { id: string } };

export async function PATCH(request: Request, { params }: RouteContext) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Ungültige Eingabe" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("skills")
    .update({ aktiv: body.aktiv })
    .eq("id", params.id)
    .eq("user_id", user.id)
    .select("id, aktiv")
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: "Skill nicht gefunden" }, { status: 404 });
  }

  return NextResponse.json(data);
}
