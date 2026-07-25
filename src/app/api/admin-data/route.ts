import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  // Verify admin session cookie
  const adminSession = req.cookies.get("admin_session");
  if (!adminSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [{ data: operators }, { data: quotes }, { data: leads }] = await Promise.all([
    supabase.from("operators").select("*").order("created_at", { ascending: false }),
    supabase.from("quote_requests").select("operator_id, status, created_at, estimated_min, booking_score").order("created_at", { ascending: false }),
    supabase.from("leads").select("*").order("created_at", { ascending: false }),
  ]);

  return NextResponse.json({ operators: operators || [], quotes: quotes || [], leads: leads || [] });
}
