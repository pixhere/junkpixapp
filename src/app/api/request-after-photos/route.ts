import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const { quoteId } = await req.json();

  const { data: quote } = await supabase
    .from("quote_requests")
    .select("*")
    .eq("id", quoteId)
    .single();

  if (!quote) return NextResponse.json({ error: "Quote not found" }, { status: 404 });

  const { data: operator } = await supabase
    .from("operators")
    .select("*")
    .eq("id", quote.operator_id)
    .single();

  const businessName = operator?.business_name || "Your junk removal company";

  await resend.emails.send({
    from: "JunkPix <noreply@junkpix.com>",
    to: quote.customer_email,
    subject: "Following up on your recent junk removal job",
    html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
      <h2>Hi ${quote.customer_name?.split(" ")[0] || "there"}! 👋</h2>
      <p style="color:#444;line-height:1.6;">We're following up on your recent junk removal service to make sure everything went smoothly and met your expectations.</p>
      <p style="color:#444;line-height:1.6;">As part of our quality control process, could you reply to this email with a quick photo of the cleared space? It helps us confirm the job was completed to your satisfaction.</p>
      <p style="color:#444;line-height:1.6;">Only takes 30 seconds — we really appreciate it. 🙌</p>
      <p style="color:#888;font-size:13px;">— JunkPix Quality Team</p>
    </div>`,
  });

  return NextResponse.json({ success: true });
}
