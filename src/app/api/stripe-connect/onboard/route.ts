import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    if (!process.env.STRIPE_CONNECT_SECRET_KEY) {
      return NextResponse.json({ error: "Stripe Connect not configured" }, { status: 500 });
    }

    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_CONNECT_SECRET_KEY, {
      apiVersion: "2026-05-27.dahlia",
    });

    const { operatorId, email } = await req.json();

    const { data: op } = await supabase
      .from("operators")
      .select("stripe_connect_id, stripe_connect_status")
      .eq("id", operatorId)
      .single();

    let accountId = op?.stripe_connect_id;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "standard",
        email: email,
      });
      accountId = account.id;

      await supabase.from("operators").update({
        stripe_connect_id: accountId,
        stripe_connect_status: "pending",
      }).eq("id", operatorId);
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?stripe=refresh`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?stripe=success`,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (err: any) {
    console.error("Stripe Connect onboard error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}