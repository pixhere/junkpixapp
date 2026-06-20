import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { operatorId, customer, aiDescription, estimatedMin, estimatedMax } = await req.json();

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: "Missing Resend API key" }, { status: 500 });
    }

    // Get operator email from the request or use default
    const operatorEmail = process.env.OWNER_EMAIL || "hello@junkpix.com";

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:system-ui,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">
    
    <!-- Header -->
    <div style="background:#0A0A0A;borderRadius:12px;padding:24px;margin-bottom:16px;border-radius:12px;">
      <div style="font-size:1.2rem;font-weight:800;color:#D97B4F;letter-spacing:.1em;margin-bottom:4px;">JUNKPIX</div>
      <div style="font-size:1.4rem;font-weight:800;color:#ffffff;margin-bottom:4px;">New Quote Request 🚛</div>
      <div style="font-size:.88rem;color:rgba(255,255,255,0.5);">Someone wants a junk removal quote. Review and respond fast.</div>
    </div>

    <!-- Customer Info -->
    <div style="background:#ffffff;border-radius:12px;padding:24px;margin-bottom:16px;border:1px solid #e5e5e5;">
      <div style="font-size:.7rem;font-weight:700;color:#999;letter-spacing:.1em;margin-bottom:16px;font-family:monospace;">CUSTOMER</div>
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#666;font-size:.84rem;width:100px;">Name</td>
          <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#111;font-size:.84rem;font-weight:600;">${customer.name}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#666;font-size:.84rem;">Phone</td>
          <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:.84rem;"><a href="tel:${customer.phone}" style="color:#D97B4F;font-weight:600;text-decoration:none;">${customer.phone}</a></td>
        </tr>
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#666;font-size:.84rem;">Email</td>
          <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:.84rem;"><a href="mailto:${customer.email}" style="color:#D97B4F;font-weight:600;text-decoration:none;">${customer.email}</a></td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#666;font-size:.84rem;">Address</td>
          <td style="padding:8px 0;color:#111;font-size:.84rem;font-weight:600;">${customer.address}${customer.city ? `, ${customer.city}` : ""}${customer.state ? `, ${customer.state}` : ""}${customer.zip ? ` ${customer.zip}` : ""}</td>
        </tr>
        ${customer.notes ? `
        <tr>
          <td style="padding:8px 0;color:#666;font-size:.84rem;border-top:1px solid #f0f0f0;">Notes</td>
          <td style="padding:8px 0;color:#111;font-size:.84rem;border-top:1px solid #f0f0f0;">${customer.notes}</td>
        </tr>` : ""}
      </table>
    </div>

    <!-- AI Description -->
    <div style="background:#ffffff;border-radius:12px;padding:24px;margin-bottom:16px;border:1px solid #e5e5e5;">
      <div style="font-size:.7rem;font-weight:700;color:#999;letter-spacing:.1em;margin-bottom:12px;font-family:monospace;">WHAT THE AI SAW</div>
      <div style="font-size:.9rem;color:#333;line-height:1.6;">${aiDescription}</div>
      ${estimatedMin ? `
      <div style="margin-top:16px;padding-top:16px;border-top:1px solid #f0f0f0;display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:.82rem;color:#999;">Estimated range</span>
        <span style="font-size:1.1rem;font-weight:800;color:#D97B4F;">$${estimatedMin} – $${estimatedMax}</span>
      </div>` : ""}
    </div>

    <!-- CTA -->
    <div style="text-align:center;padding:8px 0 24px;">
      <a href="http://localhost:3000/dashboard" style="display:inline-block;background:#D97B4F;color:#ffffff;padding:16px 40px;border-radius:8px;font-weight:700;font-size:1rem;text-decoration:none;letter-spacing:.04em;">
        View in Dashboard →
      </a>
    </div>

    <!-- Footer -->
    <div style="text-align:center;font-size:.75rem;color:#999;">
      JunkPix · You received this because a customer submitted a quote request to your page.
    </div>

  </div>
</body>
</html>
    `;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "JunkPix <hello@junkpix.com>",
        to: [operatorEmail],
        subject: `🚛 New Quote Request — ${customer.name} — $${estimatedMin}–$${estimatedMax}`,
        html: emailHtml,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.message || "Email failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Notify error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}