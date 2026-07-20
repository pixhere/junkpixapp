import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name, phone, email, address, city, state, zip,
      leadSource, photos, description,
      estimatedMin, estimatedMax, aiDescription,
    } = body;

    // Save lead to Supabase
    const { data: lead, error } = await supabase
      .from("leads")
      .insert({
        name, phone, email,
        address: `${address}, ${city}, ${state} ${zip}`,
        city, state, zip,
        lead_source: leadSource,
        photo_urls: photos || [],
        description,
        estimated_min: estimatedMin,
        estimated_max: estimatedMax,
        ai_description: aiDescription,
        status: "new",
        assigned_operator_id: null,
      })
      .select()
      .single();

    if (error) throw error;

    // Notify George
    await resend.emails.send({
      from: "JunkPix <noreply@junkpix.com>",
      to: "junkpixapp@gmail.com",
      subject: `🚛 New Lead — ${name} — ${city}, ${state}`,
      html: `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:system-ui,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">
    <div style="background:#0A0A0A;border-radius:12px;padding:24px;margin-bottom:16px;text-align:center;">
      <div style="font-size:1.4rem;font-weight:800;color:#D97B4F;letter-spacing:.15em;font-family:monospace;">JUNKPIX</div>
      <div style="font-size:.78rem;color:rgba(255,255,255,0.75);margin-top:4px;">NEW LEAD NETWORK REQUEST</div>
    </div>
    <div style="background:#fff;border-radius:12px;padding:24px;margin-bottom:16px;border:1px solid #e5e5e5;">
      <div style="font-size:.7rem;font-weight:700;color:#999;letter-spacing:.1em;margin-bottom:16px;font-family:monospace;">🚛 NEW LEAD — ASSIGN TO OPERATOR</div>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#666;font-size:.84rem;width:100px;">Name</td><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#111;font-size:.84rem;font-weight:600;">${name}</td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#666;font-size:.84rem;">Phone</td><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:.84rem;"><a href="tel:${phone}" style="color:#D97B4F;font-weight:600;text-decoration:none;">${phone}</a></td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#666;font-size:.84rem;">Email</td><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:.84rem;"><a href="mailto:${email}" style="color:#D97B4F;font-weight:600;text-decoration:none;">${email}</a></td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#666;font-size:.84rem;">Address</td><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#111;font-size:.84rem;font-weight:600;">${address}, ${city}, ${state} ${zip}</td></tr>
        ${estimatedMin ? `<tr><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#666;font-size:.84rem;">AI Estimate</td><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:.84rem;font-weight:700;color:#D97B4F;">$${estimatedMin} – $${estimatedMax}</td></tr>` : ""}
        ${leadSource ? `<tr><td style="padding:8px 0;color:#666;font-size:.84rem;">Lead Source</td><td style="padding:8px 0;color:#111;font-size:.84rem;">${leadSource}</td></tr>` : ""}
      </table>
      ${aiDescription ? `<div style="margin-top:16px;padding:12px;background:#f8f8f8;border-radius:8px;font-size:.84rem;color:#444;line-height:1.6;">${aiDescription}</div>` : ""}
      ${photos && photos.length > 0 ? `<div style="margin-top:16px;"><div style="font-size:.7rem;color:#999;font-family:monospace;margin-bottom:8px;">${photos.length} PHOTO(S) SUBMITTED</div><p style="font-size:.82rem;color:#666;">Photos are stored in the leads table in Supabase.</p></div>` : ""}
    </div>
    <div style="background:#0A0A0A;border-radius:12px;padding:16px;text-align:center;">
      <div style="font-size:.75rem;color:rgba(255,255,255,0.75);margin-bottom:8px;">ACTION REQUIRED — ASSIGN THIS LEAD</div>
      <a href="https://www.junkpix.com/dashboard" style="display:inline-block;background:#D97B4F;color:#000;padding:12px 28px;border-radius:8px;font-weight:700;font-size:.88rem;text-decoration:none;">Open Dashboard →</a>
    </div>
  </div>
</body>
</html>`,
    });

    // Send confirmation to customer
    if (email) {
      await resend.emails.send({
        from: "JunkPix <noreply@junkpix.com>",
        to: email,
        subject: "We got your junk removal request! 🚛",
        html: `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:system-ui,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:20px;">
    <div style="background:#0A0A0A;border-radius:12px;padding:24px;margin-bottom:16px;text-align:center;">
      <div style="font-size:1.4rem;font-weight:800;color:#D97B4F;letter-spacing:.15em;font-family:monospace;">JUNKPIX</div>
      <div style="font-size:.78rem;color:rgba(255,255,255,0.75);margin-top:4px;">JUNK REMOVAL MADE SIMPLE</div>
    </div>
    <div style="background:#fff;border-radius:12px;padding:28px;margin-bottom:16px;border:1px solid #e5e5e5;">
      <p style="color:#111;font-size:1rem;font-weight:700;margin:0 0 12px;">Hi ${name.split(" ")[0]} 👋</p>
      <p style="color:#444;line-height:1.7;font-size:.92rem;margin:0 0 12px;">We received your junk removal request and a local professional in your area is reviewing it now.</p>
      ${estimatedMin ? `<div style="background:#f8f8f8;border-radius:8px;padding:16px;margin:16px 0;text-align:center;"><div style="font-size:.7rem;color:#999;font-family:monospace;margin-bottom:4px;">AI ESTIMATED RANGE</div><div style="font-size:1.4rem;font-weight:800;color:#D97B4F;">$${estimatedMin} – $${estimatedMax}</div><div style="font-size:.75rem;color:#999;margin-top:4px;">Final price confirmed before any payment</div></div>` : ""}
      <p style="color:#444;line-height:1.7;font-size:.92rem;margin:0;">Expect a call or text within 1 hour. No payment is required until you confirm the job.</p>
    </div>
    <div style="background:#0A0A0A;border-radius:12px;padding:20px;text-align:center;">
      <div style="font-size:.65rem;color:rgba(255,255,255,0.75);letter-spacing:.1em;font-family:monospace;margin-bottom:10px;">QUESTIONS? REACH US ANYTIME</div>
      <div style="font-size:.95rem;font-weight:800;color:#D97B4F;">JunkPix</div>
      <div style="font-size:.84rem;margin-top:4px;"><a href="https://www.junkpix.com" style="color:#D97B4F;text-decoration:none;">www.junkpix.com</a></div>
    </div>
  </div>
</body>
</html>`,
      });
    }

    return NextResponse.json({ success: true, leadId: lead?.id });
  } catch (err: any) {
    console.error("Submit lead error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
