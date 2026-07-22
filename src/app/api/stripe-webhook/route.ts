import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
    }

    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-05-27.dahlia",
    });

    const body = await req.text();
    const sig = req.headers.get("stripe-signature")!;

    let event: any;

    try {
      event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err: any) {
      console.error("Webhook error:", err.message);
      return NextResponse.json({ error: err.message }, { status: 400 });
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const operatorId = session.metadata?.operatorId;
      const customerId = session.customer;

      if (session.mode === "setup" && operatorId) {
        // Operator added a payment method for lead billing
        const Stripe = (await import("stripe")).default;
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-05-27.dahlia" as any });
        
        // Get the payment method from the setup intent
        const setupIntent = await stripe.setupIntents.retrieve(session.setup_intent as string);
        const paymentMethodId = setupIntent.payment_method as string;

        // Set as default payment method on customer
        if (paymentMethodId) {
          await stripe.customers.update(customerId as string, {
            invoice_settings: { default_payment_method: paymentMethodId },
          });
          await supabase.from("operators").update({
            lead_payment_method_id: paymentMethodId,
            lead_billing_enabled: true,
          }).eq("id", operatorId);
        }
      } else if (session.mode === "subscription" && operatorId) {
        // Operator subscribed to JunkPix
        const subscriptionId = session.subscription;
        await supabase.from("operators").update({
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          subscription_status: "active",
          trial_ends_at: null,
        }).eq("id", operatorId);
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object;
      await supabase.from("operators").update({
        subscription_status: "cancelled",
      }).eq("stripe_subscription_id", subscription.id);
    }

    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object;
      await supabase.from("operators").update({
        subscription_status: "past_due",
      }).eq("stripe_customer_id", invoice.customer);
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Webhook error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}