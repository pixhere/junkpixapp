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

        // Send thank you email
        const { data: op } = await supabase.from("operators").select("email, owner_name, business_name").eq("id", operatorId).single();
        if (op?.email) {
          const { Resend } = await import("resend");
          const resend = new Resend(process.env.RESEND_API_KEY);
          await resend.emails.send({
            from: "JunkPix <noreply@junkpix.com>",
            to: op.email,
            subject: "Welcome to JunkPix Pro 🚛 — You're all set!",
            html: `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:system-ui,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">
    <div style="background:#0F172A;border-radius:12px;padding:28px;margin-bottom:16px;text-align:center;">
      <div style="font-size:1.6rem;font-weight:800;color:#00D4C8;letter-spacing:.1em;font-family:monospace;">JUNKPIX</div>
      <div style="font-size:.82rem;color:rgba(255,255,255,0.6);margin-top:4px;">The Intelligent Junk Removal OS</div>
    </div>
    <div style="background:#fff;border-radius:12px;padding:32px;border:1px solid #e5e5e5;margin-bottom:16px;">
      <div style="font-size:1.8rem;text-align:center;margin-bottom:16px;">🎉</div>
      <h1 style="font-size:1.4rem;font-weight:800;color:#0F172A;margin:0 0 8px;text-align:center;">Welcome to JunkPix Pro, ${op.owner_name || op.business_name}!</h1>
      <p style="font-size:.9rem;color:#555;line-height:1.7;text-align:center;margin:0 0 24px;">Your subscription is active. You now have full access to everything JunkPix has to offer — AI photo quoting, job tracking, social content, analytics, and more.</p>
      <div style="background:#f8f8f8;border-radius:10px;padding:20px;margin-bottom:24px;">
        <div style="font-size:.72rem;font-weight:700;color:#999;letter-spacing:.1em;margin-bottom:12px;">WHAT YOU GET WITH PRO</div>
        <div style="display:flex;flex-direction:column;gap:8px;">
          <div style="font-size:.88rem;color:#333;">🤖 Unlimited AI photo quotes with PixBrain</div>
          <div style="font-size:.88rem;color:#333;">📊 Full analytics and job tracking</div>
          <div style="font-size:.88rem;color:#333;">📱 Automated social media content</div>
          <div style="font-size:.88rem;color:#333;">💰 Job cost tracking and profit margins</div>
          <div style="font-size:.88rem;color:#333;">🌐 Lead Network access</div>
          <div style="font-size:.88rem;color:#333;">🧾 Tax estimator for quarterly planning</div>
        </div>
      </div>
      <div style="text-align:center;">
        <a href="https://www.junkpix.com/dashboard" style="display:inline-block;background:#00D4C8;color:#000;padding:14px 32px;border-radius:8px;font-weight:800;font-size:.95rem;text-decoration:none;">Go to My Dashboard →</a>
      </div>
    </div>
    <div style="background:#0F172A;border-radius:12px;padding:20px;text-align:center;">
      <p style="font-size:.82rem;color:rgba(255,255,255,0.6);margin:0 0 8px;">Questions? We're here for you.</p>
      <a href="mailto:junkpixapp@gmail.com" style="color:#00D4C8;font-size:.84rem;text-decoration:none;">junkpixapp@gmail.com</a>
    </div>
  </div>
</body>
</html>`,
          });
        }
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