import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { operatorId, email } = await req.json();
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-05-27.dahlia" as any });

    const { data: op } = await supabase
      .from("operators")
      .select("lead_stripe_customer_id")
      .eq("id", operatorId)
      .single();

    let customerId = op?.lead_stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        metadata: { operatorId },
      });
      customerId = customer.id;
      await supabase.from("operators").update({ lead_stripe_customer_id: customerId }).eq("id", operatorId);
    }

    const session = await stripe.checkout.sessions.create({
      mode: "setup",
      customer: customerId,
      payment_method_types: ["card"],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?tab=payments&setup=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?tab=payments`,
      metadata: { operatorId },
    });

    return NextResponse.json({ url: session.url, customerId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
