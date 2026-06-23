import { NextRequest, NextResponse } from "next/server";

const emails: Record<number, { subject: string; html: (name: string, businessName: string, dashboardUrl: string) => string }> = {
  3: {
    subject: "Quick tip to get your first quote request 🚛",
    html: (name, businessName, dashboardUrl) => `
<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f5f5f5;font-family:system-ui,sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:20px;">
  <div style="background:#0A0A0A;border-radius:12px;padding:24px;margin-bottom:16px;">
    <div style="font-size:1rem;font-weight:800;color:#D97B4F;margin-bottom:4px;">JUNKPIX</div>
    <div style="font-size:1.2rem;font-weight:800;color:#fff;">Hey ${name}, quick tip 👋</div>
  </div>
  <div style="background:#fff;border-radius:12px;padding:24px;margin-bottom:16px;border:1px solid #e5e5e5;">
    <p style="color:#333;line-height:1.7;font-size:.92rem;">You've had JunkPix for 3 days — here's the #1 thing that gets operators their first quote request fast:</p>
    <div style="background:#f8f8f8;border-left:4px solid #D97B4F;padding:16px;border-radius:4px;margin:16px 0;">
      <strong>Share your quote link everywhere.</strong><br/>
      <span style="color:#555;font-size:.88rem;">Put it in your Instagram bio, Facebook page, Google Business profile, and text it to your last 10 customers.</span>
    </div>
    <p style="color:#333;line-height:1.7;font-size:.92rem;">Your quote link:<br/>
    <a href="${dashboardUrl}" style="color:#D97B4F;font-weight:700;">Check your dashboard for your link →</a></p>
  </div>
  <div style="text-align:center;font-size:.75rem;color:#aaa;">JunkPix · George, Co-Founder · <a href="mailto:hello@junkpix.com" style="color:#aaa;">hello@junkpix.com</a></div>
</div></body></html>`
  },
  7: {
    subject: "How are your first quotes going? 📋",
    html: (name, businessName, dashboardUrl) => `
<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f5f5f5;font-family:system-ui,sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:20px;">
  <div style="background:#0A0A0A;border-radius:12px;padding:24px;margin-bottom:16px;">
    <div style="font-size:1rem;font-weight:800;color:#D97B4F;margin-bottom:4px;">JUNKPIX</div>
    <div style="font-size:1.2rem;font-weight:800;color:#fff;">Week 1 check-in, ${name}</div>
  </div>
  <div style="background:#fff;border-radius:12px;padding:24px;margin-bottom:16px;border:1px solid #e5e5e5;">
    <p style="color:#333;line-height:1.7;font-size:.92rem;">You've been on JunkPix for a week. Here's what operators who book more jobs do differently:</p>
    <ul style="color:#555;line-height:1.9;font-size:.88rem;padding-left:20px;">
      <li>They respond to quote requests within 30 minutes</li>
      <li>They use the AI suggested replies to follow up same day</li>
      <li>They share their quote link on Facebook Marketplace and Nextdoor</li>
    </ul>
    <p style="color:#333;line-height:1.7;font-size:.92rem;">Fast response = more bookings. That's it.</p>
    <a href="${dashboardUrl}" style="display:inline-block;background:#D97B4F;color:#fff;padding:14px 32px;border-radius:8px;font-weight:700;font-size:.95rem;text-decoration:none;margin-top:8px;">Open Your Dashboard →</a>
  </div>
  <div style="text-align:center;font-size:.75rem;color:#aaa;">JunkPix · George, Co-Founder · <a href="mailto:hello@junkpix.com" style="color:#aaa;">hello@junkpix.com</a></div>
</div></body></html>`
  },
  14: {
    subject: "Halfway through your trial — here's everything you have 💪",
    html: (name, businessName, dashboardUrl) => `
<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f5f5f5;font-family:system-ui,sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:20px;">
  <div style="background:#0A0A0A;border-radius:12px;padding:24px;margin-bottom:16px;">
    <div style="font-size:1rem;font-weight:800;color:#D97B4F;margin-bottom:4px;">JUNKPIX</div>
    <div style="font-size:1.2rem;font-weight:800;color:#fff;">Day 14 — halfway there, ${name}</div>
  </div>
  <div style="background:#fff;border-radius:12px;padding:24px;margin-bottom:16px;border:1px solid #e5e5e5;">
    <p style="color:#333;line-height:1.7;font-size:.92rem;">You're 2 weeks in. Here's a reminder of everything your JunkPix account includes:</p>
    <ul style="color:#555;line-height:1.9;font-size:.88rem;padding-left:20px;">
      <li>✅ Your own branded quote page</li>
      <li>✅ AI photo analysis — estimates every job instantly</li>
      <li>✅ AI suggested replies — 6 types, generates in seconds</li>
      <li>✅ Email customer directly from the dashboard</li>
      <li>✅ Lead scoring — know which jobs to call first</li>
      <li>✅ Social media posts generated from completed jobs</li>
      <li>✅ Auto review request emails after every job</li>
      <li>✅ Analytics dashboard</li>
    </ul>
    <p style="color:#333;line-height:1.7;font-size:.92rem;">16 days left on your free trial. No credit card needed yet.</p>
    <a href="${dashboardUrl}" style="display:inline-block;background:#D97B4F;color:#fff;padding:14px 32px;border-radius:8px;font-weight:700;font-size:.95rem;text-decoration:none;margin-top:8px;">Open Your Dashboard →</a>
  </div>
  <div style="text-align:center;font-size:.75rem;color:#aaa;">JunkPix · George, Co-Founder · <a href="mailto:hello@junkpix.com" style="color:#aaa;">hello@junkpix.com</a></div>
</div></body></html>`
  },
  25: {
    subject: "5 days left — lock in $49/month before it's gone 🔥",
    html: (name, businessName, dashboardUrl) => `
<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f5f5f5;font-family:system-ui,sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:20px;">
  <div style="background:#0A0A0A;border-radius:12px;padding:24px;margin-bottom:16px;">
    <div style="font-size:1rem;font-weight:800;color:#D97B4F;margin-bottom:4px;">JUNKPIX</div>
    <div style="font-size:1.2rem;font-weight:800;color:#fff;">5 days left on your trial, ${name}</div>
  </div>
  <div style="background:#fff;border-radius:12px;padding:24px;margin-bottom:16px;border:1px solid #e5e5e5;">
    <p style="color:#333;line-height:1.7;font-size:.92rem;">Your free trial ends in 5 days.</p>
    <div style="background:#FFF8F5;border:2px solid #D97B4F;border-radius:8px;padding:20px;margin:16px 0;text-align:center;">
      <div style="font-size:.75rem;color:#D97B4F;font-weight:700;letter-spacing:.1em;margin-bottom:8px;">FOUNDING OPERATOR PRICE</div>
      <div style="font-size:2.5rem;font-weight:900;color:#111;">$49<span style="font-size:1rem;font-weight:400;color:#999;">/month</span></div>
      <div style="font-size:.82rem;color:#D97B4F;font-weight:700;margin-top:4px;">Locked forever — only a few spots left</div>
    </div>
    <p style="color:#333;line-height:1.7;font-size:.92rem;">After the founding spots fill, the price goes to $99/month. Lock in $49 now and it never goes up.</p>
    <a href="${dashboardUrl}/dashboard" style="display:inline-block;background:#D97B4F;color:#fff;padding:14px 32px;border-radius:8px;font-weight:700;font-size:.95rem;text-decoration:none;margin-top:8px;">Lock In $49/Month →</a>
  </div>
  <div style="text-align:center;font-size:.75rem;color:#aaa;">JunkPix · George, Co-Founder · <a href="mailto:hello@junkpix.com" style="color:#aaa;">hello@junkpix.com</a></div>
</div></body></html>`
  },
  30: {
    subject: "Your free trial ends today ⏰",
    html: (name, businessName, dashboardUrl) => `
<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f5f5f5;font-family:system-ui,sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:20px;">
  <div style="background:#0A0A0A;border-radius:12px;padding:24px;margin-bottom:16px;">
    <div style="font-size:1rem;font-weight:800;color:#D97B4F;margin-bottom:4px;">JUNKPIX</div>
    <div style="font-size:1.2rem;font-weight:800;color:#fff;">Trial ending today, ${name}</div>
  </div>
  <div style="background:#fff;border-radius:12px;padding:24px;margin-bottom:16px;border:1px solid #e5e5e5;">
    <p style="color:#333;line-height:1.7;font-size:.92rem;">Your 30-day free trial ends today. To keep access to your dashboard and quote page, choose a plan.</p>
    <div style="display:flex;gap:12px;margin:20px 0;flex-wrap:wrap;">
      <div style="flex:1;min-width:140px;border:2px solid #D97B4F;border-radius:8px;padding:16px;text-align:center;">
        <div style="font-size:.65rem;color:#D97B4F;font-weight:700;margin-bottom:8px;">FOUNDING</div>
        <div style="font-size:1.8rem;font-weight:900;color:#111;">$49<span style="font-size:.8rem;font-weight:400;color:#999;">/mo</span></div>
        <div style="font-size:.72rem;color:#D97B4F;margin-top:4px;">Forever locked</div>
      </div>
      <div style="flex:1;min-width:140px;border:1px solid #e5e5e5;border-radius:8px;padding:16px;text-align:center;">
        <div style="font-size:.65rem;color:#999;font-weight:700;margin-bottom:8px;">STANDARD</div>
        <div style="font-size:1.8rem;font-weight:900;color:#111;">$99<span style="font-size:.8rem;font-weight:400;color:#999;">/mo</span></div>
      </div>
    </div>
    <a href="${dashboardUrl}/dashboard" style="display:block;background:#D97B4F;color:#fff;padding:14px 32px;border-radius:8px;font-weight:700;font-size:.95rem;text-decoration:none;text-align:center;">Choose Your Plan →</a>
    <p style="color:#aaa;font-size:.78rem;text-align:center;margin-top:16px;">Questions? Reply to this email — I read every one. — George</p>
  </div>
  <div style="text-align:center;font-size:.75rem;color:#aaa;">JunkPix · George, Co-Founder · <a href="mailto:hello@junkpix.com" style="color:#aaa;">hello@junkpix.com</a></div>
</div></body></html>`
  }
};

export async function POST(req: NextRequest) {
  try {
    const { operator, day } = await req.json();

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: "Missing Resend API key" }, { status: 500 });
    }

    const emailTemplate = emails[day];
    if (!emailTemplate) {
      return NextResponse.json({ error: "Invalid day" }, { status: 400 });
    }

    const name = operator.owner_name?.split(" ")[0] || "there";
    const businessName = operator.business_name || "your business";
    const dashboardUrl = process.env.NEXT_PUBLIC_APP_URL || "https://junkpix.com";

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "George at JunkPix <hello@junkpix.com>",
        to: [operator.email],
        subject: emailTemplate.subject,
        html: emailTemplate.html(name, businessName, dashboardUrl),
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ error: data.message || "Email failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("send-trial-email error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}