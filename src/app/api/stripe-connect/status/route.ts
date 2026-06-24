import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const operatorId = searchParams.get("operatorId");

    if (!operatorId) {
      return NextResponse.json({ error: "Missing operatorId" }, { status: 400 });
    }

    const { data: op } = await supabase
      .from("operators")
      .select("stripe_connect_id, stripe_connect_status")
      .eq("id", operatorId)
      .single();

    if (!op?.stripe_connect_id) {
      return NextResponse.json({ connected: false, status: "not_connected" });
    }

    if (!process.env.STRIPE_CONNECT_SECRET_KEY) {
      return NextResponse.json({ connected: false, status: "not_configured" });
    }

    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_CONNECT_SECRET_KEY, {
      apiVersion: "2026-05-27.dahlia",
    });

    const account = await stripe.accounts.retrieve(op.stripe_connect_id);
    const connected = account.details_submitted && account.charges_enabled;

    // Update status in DB
    await supabase.from("operators").update({
      stripe_connect_status: connected ? "active" : "pending",
    }).eq("id", operatorId);

    return NextResponse.json({
      connected,
      status: connected ? "active" : "pending",
      accountId: op.stripe_connect_id,
    });
  } catch (err: any) {
    console.error("Stripe Connect status error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}