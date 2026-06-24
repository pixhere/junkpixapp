import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { quote, operator } = await req.json();

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: "Missing Resend API key" }, { status: 500 });
    }

    const businessName = operator?.business_name || "our team";
    const ownerName = operator?.owner_name || businessName;
    const reviewLink = operator?.review_link;

    if (!quote.customer_email) {
      return NextResponse.json({ error: "No customer email" }, { status: 400 });
    }

    if (!reviewLink) {
      return NextResponse.json({ error: "No review link set" }, { status: 400 });
    }

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:system-ui,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:20px;">

    <!-- Header -->
    <div style="background:#0A0A0A;border-radius:12px;padding:24px;margin-bottom:16px;text-align:center;">
      <div style="font-size:1.2rem;font-weight:800;color:#D97B4F;letter-spacing:.1em;margin-bottom:8px;">JUNKPIX</div>
<div style="font-size:.88rem;color:rgba(255,255,255,0.5);">Thank you for choosing ${businessName} — ${ownerName}</div>      <div style="font-size:.88rem;color:rgba(255,255,255,0.5);">Thank you for choosing ${businessName}</div>
    </div>

    <!-- Message -->
    <div style="background:#ffffff;border-radius:12px;padding:28px;margin-bottom:16px;border:1px solid #e5e5e5;text-align:center;">
      <div style="font-size:2.5rem;margin-bottom:16px;">⭐</div>
      <div style="font-size:1.1rem;font-weight:700;color:#111;margin-bottom:12px;">
        How did we do, ${quote.customer_name}?
      </div>
      <div style="font-size:.9rem;color:#555;line-height:1.7;margin-bottom:24px;">
We hope your junk removal experience was smooth and hassle-free. If you have a moment, ${ownerName} would love it if you left us a quick review — it means the world to a small local business.      </div>
      <a href="${reviewLink}" style="display:inline-block;background:#D97B4F;color:#ffffff;padding:16px 40px;border-radius:8px;font-weight:800;font-size:1rem;text-decoration:none;letter-spacing:.04em;">
        Leave a Review ⭐
      </a>
      <div style="margin-top:16px;font-size:.78rem;color:#aaa;">Takes less than 60 seconds</div>
    </div>

    <!-- Job summary -->
    <div style="background:#ffffff;border-radius:12px;padding:20px;margin-bottom:16px;border:1px solid #e5e5e5;">
      <div style="font-size:.65rem;font-weight:700;color:#999;letter-spacing:.1em;margin-bottom:12px;font-family:monospace;">YOUR JOB</div>
      <div style="font-size:.84rem;color:#555;line-height:1.5;">${quote.ai_description}</div>
    </div>

    <!-- Footer -->
    <div style="text-align:center;font-size:.75rem;color:#aaa;padding:8px 0;">
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
from: `${ownerName} at ${businessName} <hello@junkpix.com>`,        to: [quote.customer_email],
        subject: `How did we do? ⭐ — ${businessName}`,
        html: emailHtml,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.message || "Email failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("send-review-request error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}