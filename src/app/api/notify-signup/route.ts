import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { email, businessName, ownerName, phone, city, state } = await req.json();

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: "Missing Resend API key" }, { status: 500 });
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "JunkPix <hello@junkpix.com>",
        to: [process.env.OWNER_EMAIL || "hello@junkpix.com"],
        subject: `🚛 New Operator Signed Up — ${businessName}`,
        html: `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:system-ui,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:20px;">
    <div style="background:#0A0A0A;border-radius:12px;padding:24px;margin-bottom:16px;">
      <div style="font-size:1rem;font-weight:800;color:#D97B4F;margin-bottom:8px;">JUNKPIX</div>
      <div style="font-size:1.3rem;font-weight:800;color:#fff;">New Operator Signed Up! 🎉</div>
    </div>
    <div style="background:#fff;border-radius:12px;padding:24px;border:1px solid #e5e5e5;">
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#666;font-size:.84rem;width:120px;">Business</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#111;font-size:.84rem;font-weight:700;">${businessName}</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#666;font-size:.84rem;">Owner</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#111;font-size:.84rem;">${ownerName}</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#666;font-size:.84rem;">Email</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:.84rem;"><a href="mailto:${email}" style="color:#D97B4F;text-decoration:none;">${email}</a></td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#666;font-size:.84rem;">Phone</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:.84rem;"><a href="tel:${phone}" style="color:#D97B4F;text-decoration:none;">${phone}</a></td></tr>
        <tr><td style="padding:10px 0;color:#666;font-size:.84rem;">Location</td><td style="padding:10px 0;color:#111;font-size:.84rem;">${city}, ${state}</td></tr>
      </table>
      <div style="margin-top:20px;text-align:center;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display:inline-block;background:#D97B4F;color:#fff;padding:14px 32px;border-radius:8px;font-weight:700;font-size:.95rem;text-decoration:none;">View Dashboard →</a>
      </div>
    </div>
  </div>
</body>
</html>`,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ error: data.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("notify-signup error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}