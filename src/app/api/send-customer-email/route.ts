import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { quote, operator, message } = await req.json();

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: "Missing Resend API key" }, { status: 500 });
    }

    const businessName = operator?.business_name || "Your Junk Removal Team";

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
    <div style="background:#0A0A0A;border-radius:12px;padding:24px;margin-bottom:16px;">
      <div style="font-size:1.2rem;font-weight:800;color:#D97B4F;letter-spacing:.1em;margin-bottom:4px;">JUNKPIX</div>
      <div style="font-size:1.1rem;font-weight:700;color:#ffffff;">${businessName}</div>
    </div>

    <!-- Message -->
    <div style="background:#ffffff;border-radius:12px;padding:24px;margin-bottom:16px;border:1px solid #e5e5e5;">
      <div style="font-size:.9rem;color:#333;line-height:1.7;white-space:pre-wrap;">${message}</div>
    </div>

    <!-- Quote Info -->
    <div style="background:#ffffff;border-radius:12px;padding:24px;margin-bottom:16px;border:1px solid #e5e5e5;">
      <div style="font-size:.7rem;font-weight:700;color:#999;letter-spacing:.1em;margin-bottom:16px;font-family:monospace;">YOUR QUOTE DETAILS</div>
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#666;font-size:.84rem;width:120px;">Name</td>
          <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#111;font-size:.84rem;font-weight:600;">${quote.customer_name}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#666;font-size:.84rem;">Address</td>
          <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#111;font-size:.84rem;">${quote.customer_address}</td>
        </tr>
        ${quote.estimated_min ? `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#666;font-size:.84rem;">Est. Range</td>
          <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#D97B4F;font-size:.84rem;font-weight:700;">$${quote.estimated_min} – $${quote.estimated_max}</td>
        </tr>` : ""}
        ${quote.final_price ? `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#666;font-size:.84rem;">Your Price</td>
          <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#22c55e;font-size:.84rem;font-weight:700;">$${quote.final_price}</td>
        </tr>` : ""}
        <tr>
          <td style="padding:8px 0;color:#666;font-size:.84rem;">Job</td>
          <td style="padding:8px 0;color:#555;font-size:.84rem;line-height:1.5;">${quote.ai_description}</td>
        </tr>
      </table>
    </div>

    <!-- Footer -->
    <div style="text-align:center;font-size:.75rem;color:#999;padding:8px 0;">
      ${businessName} · Powered by JunkPix
    </div>

  </div>
</body>
</html>`;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `${businessName} <hello@junkpix.com>`,
        to: [quote.customer_email],
        subject: `Your Junk Removal Quote — ${businessName}`,
        html: emailHtml,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.message || "Email failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("send-customer-email error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}