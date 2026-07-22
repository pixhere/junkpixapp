import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    // Verify secret key so only you can trigger this
    const { secret } = await req.json();
    if (secret !== process.env.BILLING_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-05-27.dahlia" as any });

    // Get all unbilled won/lost leads
    const { data: leads } = await supabase
      .from("leads")
      .select("*, operators:assigned_operator_id(id, business_name, email, lead_stripe_customer_id, lead_payment_method_id)")
      .in("status", ["won", "lost"])
      .is("billed_at", null)
      .not("assigned_operator_id", "is", null);

    if (!leads || leads.length === 0) {
      return NextResponse.json({ message: "No unbilled leads", billed: 0 });
    }

    // Group leads by operator
    const byOperator: Record<string, any[]> = {};
    for (const lead of leads) {
      const opId = lead.assigned_operator_id;
      if (!byOperator[opId]) byOperator[opId] = [];
      byOperator[opId].push(lead);
    }

    const results = [];

    for (const [operatorId, opLeads] of Object.entries(byOperator)) {
      const op = opLeads[0].operators;
      if (!op?.lead_stripe_customer_id || !op?.lead_payment_method_id) {
        results.push({ operatorId, status: "skipped - no payment method" });
        continue;
      }

      const won  = opLeads.filter(l => l.status === "won").length;
      const lost = opLeads.filter(l => l.status === "lost").length;
      const total = (won * 25) + (lost * 5);

      if (total === 0) continue;

      try {
        // Create and pay invoice
        const invoice = await stripe.invoices.create({
          customer: op.lead_stripe_customer_id,
          default_payment_method: op.lead_payment_method_id,
          description: `JunkPix Lead Network — ${won} won ($${won * 25}) + ${lost} not booked ($${lost * 5})`,
          auto_advance: true,
          collection_method: "charge_automatically",
        });

        // Add line items
        if (won > 0) {
          await stripe.invoiceItems.create({
            customer: op.lead_stripe_customer_id,
            invoice: invoice.id,
            amount: won * 2500, // in cents
            currency: "usd",
            description: `${won} completed job${won > 1 ? "s" : ""} × $25`,
          });
        }

        if (lost > 0) {
          await stripe.invoiceItems.create({
            customer: op.lead_stripe_customer_id,
            invoice: invoice.id,
            amount: lost * 500, // in cents
            currency: "usd",
            description: `${lost} unbooked lead${lost > 1 ? "s" : ""} × $5`,
          });
        }

        // Finalize and pay
        await stripe.invoices.finalizeInvoice(invoice.id);
        await stripe.invoices.pay(invoice.id);

        // Mark leads as billed
        const leadIds = opLeads.map(l => l.id);
        await supabase.from("leads")
          .update({ billed_at: new Date().toISOString(), invoice_amount: total })
          .in("id", leadIds);

        results.push({ operator: op.business_name, won, lost, total: `$${total}`, status: "billed" });
      } catch (err: any) {
        results.push({ operator: op.business_name, status: "failed", error: err.message });
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
