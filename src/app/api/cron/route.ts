import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const in30 = new Date(now.getTime() + 30 * 60 * 1000);
  const in35 = new Date(now.getTime() + 35 * 60 * 1000);

  // Find jobs scheduled in the next 30-35 min window, reminder not yet sent
  const { data: jobs } = await supabase
    .from("quote_requests")
    .select("*, operators(*)")
    .eq("reminder_sent", false)
    .eq("status", "scheduled")
    .gte("scheduled_date", now.toISOString().split("T")[0])
    .lte("scheduled_date", in35.toISOString().split("T")[0]);

  if (!jobs || jobs.length === 0) return NextResponse.json({ sent: 0 });

  let sent = 0;

  for (const job of jobs) {
    if (!job.scheduled_date || !job.scheduled_time) continue;

    const jobDateTime = new Date(`${job.scheduled_date}T${job.scheduled_time}`);
    if (jobDateTime < in30 || jobDateTime > in35) continue;

    const op = job.operators;
    if (!op?.email) continue;

    await resend.emails.send({
      from: "JunkPix <noreply@junkpix.com>",
      to: op.email,
      subject: `⏰ Job in 30 min — ${job.customer_name}`,
      html: `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:system-ui,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:20px;">
    <div style="background:#0A0A0A;border-radius:12px;padding:24px;margin-bottom:16px;text-align:center;">
      <div style="font-size:1.1rem;font-weight:800;color:#D97B4F;letter-spacing:.1em;">JUNKPIX</div>
      <div style="font-size:.8rem;color:rgba(255,255,255,0.4);margin-top:4px;">Junk Removal Made Simple</div>
    </div>
    <div style="background:#fff;border-radius:12px;padding:28px;margin-bottom:16px;border:1px solid #e5e5e5;">
      <div style="font-size:1.2rem;font-weight:800;color:#111;margin-bottom:16px;">⏰ Job starting in 30 minutes</div>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#666;font-size:.84rem;width:80px;">Customer</td><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#111;font-size:.84rem;font-weight:600;">\${job.customer_name}</td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#666;font-size:.84rem;">Address</td><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#111;font-size:.84rem;font-weight:600;">\${job.customer_address}</td></tr>
        <tr><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#666;font-size:.84rem;">Time</td><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;color:#111;font-size:.84rem;font-weight:600;">\${job.scheduled_time}</td></tr>
        <tr><td style="padding:8px 0;color:#666;font-size:.84rem;">Phone</td><td style="padding:8px 0;color:#D97B4F;font-size:.84rem;font-weight:600;">\${job.customer_phone || "N/A"}</td></tr>
      </table>
      <div style="background:#fff8f5;border:1px solid #D97B4F;border-radius:8px;padding:14px;margin-top:16px;font-size:.84rem;color:#444;">
        📸 <strong>Don't forget after photos</strong> — required to mark the job as completed.
      </div>
      <div style="text-align:center;margin-top:20px;">
        <a href="https://junkpix.com/dashboard/quote/\${job.id}/photos" style="display:inline-block;background:#D97B4F;color:#000;padding:14px 32px;border-radius:8px;font-weight:700;font-size:.9rem;text-decoration:none;">Open Job →</a>
      </div>
    </div>
    <div style="background:#fff;border-radius:12px;padding:20px;border:1px solid #e5e5e5;text-align:center;">
      <div style="font-size:.9rem;font-weight:700;color:#111;">JunkPix</div>
      <div style="font-size:.84rem;color:#D97B4F;margin-top:4px;">(717) 416-3617</div>
      <div style="font-size:.84rem;margin-top:4px;"><a href="https://www.junkpix.com" style="color:#D97B4F;text-decoration:none;">www.junkpix.com</a></div>
    </div>
    <div style="text-align:center;font-size:.72rem;color:#bbb;margin-top:16px;">© JunkPix · Harrisburg, PA · <a href="https://www.junkpix.com" style="color:#bbb;">junkpix.com</a></div>
  </div>
</body>
</html>`,
    });

    await supabase
      .from("quote_requests")
      .update({ reminder_sent: true })
      .eq("id", job.id);

    sent++;
  }

  return NextResponse.json({ sent });
}
