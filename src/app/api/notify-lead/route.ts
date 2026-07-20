import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { lead, operator } = await req.json();

    await resend.emails.send({
      from: "JunkPix <noreply@junkpix.com>",
      to: operator.email,
      subject: `🚛 New Lead Assigned — ${lead.name} — ${lead.city}, ${lead.state}`,
      html: `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:system-ui,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">
    <div style="background:#0A0A0A;border-radius:12px;padding:24px;margin-bottom:16px;text-align:center;">
      <div style="font-size:1.4rem;font-weight:800;color:#D97B4F;letter-spacing:.15em;font-family:monospace;">JUNKPIX</div>
      <div style="font-size:.78rem;color:rgba(255,255,255,0.75);margin-top:4px;">NEW LEAD FOR YOU</div>
    </div>
    <div style="background:#fff;border-radius:12px;padding:24px;margin-bottom:16px;border:1px solid #e5e5e5;">
      <div style="font-size:.7rem;font-weight:700;color:#999;letter-spacing:.1em;margin-bottom:16px;font-family:monospace;">🚛 YOU HAVE A NEW LEAD — CONTACT THEM ASAP</div>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#666;font-size:.84rem;width:100px;">Name</td><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#111;font-size:.84rem;font-weight:600;">${lead.name}</td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#666;font-size:.84rem;">Phone</td><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:.84rem;"><a href="tel:${lead.phone}" style="color:#D97B4F;font-weight:600;text-decoration:none;">${lead.phone}</a></td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#666;font-size:.84rem;">Email</td><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:.84rem;"><a href="mailto:${lead.email}" style="color:#D97B4F;font-weight:600;text-decoration:none;">${lead.email}</a></td></tr>
        <tr><td style="padding:8px 0;color:#666;font-size:.84rem;">Address</td><td style="padding:8px 0;color:#111;font-size:.84rem;font-weight:600;">${lead.address}</td></tr>
        ${lead.estimated_min ? `<tr><td style="padding:8px 0;border-top:1px solid #f0f0f0;color:#666;font-size:.84rem;">AI Estimate</td><td style="padding:8px 0;border-top:1px solid #f0f0f0;font-size:.84rem;font-weight:700;color:#D97B4F;">$${lead.estimated_min} – $${lead.estimated_max}</td></tr>` : ""}
      </table>
      ${lead.description ? `<div style="margin-top:16px;padding:12px;background:#f8f8f8;border-radius:8px;font-size:.84rem;color:#444;line-height:1.6;"><strong>Customer notes:</strong> ${lead.description}</div>` : ""}
    </div>
    <div style="background:#fff;border-radius:12px;padding:20px;border:1px solid #e5e5e5;margin-bottom:16px;">
      <div style="font-size:.7rem;color:#999;font-family:monospace;margin-bottom:12px;">HOW THIS WORKS</div>
      <div style="font-size:.84rem;color:#444;line-height:1.8;">
        ✅ This lead is <strong>free</strong> — no charge to receive it<br/>
        📞 Contact the customer as soon as possible<br/>
        💰 If you complete the job → JunkPix bills you <strong>$25</strong><br/>
        ❌ If you don't get the job → JunkPix bills you <strong>$5</strong><br/>
        📅 Billing runs every 2 weeks automatically
      </div>
    </div>
    <div style="background:#0A0A0A;border-radius:12px;padding:16px;text-align:center;">
      <div style="font-size:.75rem;color:rgba(255,255,255,0.75);margin-bottom:8px;">LOG THE OUTCOME IN YOUR DASHBOARD</div>
      <a href="https://www.junkpix.com/dashboard/leads" style="display:inline-block;background:#D97B4F;color:#000;padding:12px 28px;border-radius:8px;font-weight:700;font-size:.88rem;text-decoration:none;">Open Dashboard →</a>
    </div>
  </div>
</body>
</html>`,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
