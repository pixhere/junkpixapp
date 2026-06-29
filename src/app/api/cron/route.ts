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
      html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
        <h2 style="margin:0 0 16px;">⏰ Job starting in 30 minutes</h2>
        <p style="color:#444;line-height:1.6;"><strong>Customer:</strong> ${job.customer_name}</p>
        <p style="color:#444;line-height:1.6;"><strong>Address:</strong> ${job.customer_address}</p>
        <p style="color:#444;line-height:1.6;"><strong>Time:</strong> ${job.scheduled_time}</p>
        <p style="color:#444;line-height:1.6;"><strong>Phone:</strong> ${job.customer_phone || "N/A"}</p>
        <hr style="border:none;border-top:1px solid #eee;margin:20px 0;" />
        <p style="color:#888;font-size:13px;">📸 Don't forget to take <strong>after photos</strong> when the job is done — required to mark as completed.</p>
        <a href="https://junkpix.com/dashboard/quote/${job.id}/photos" style="display:inline-block;margin-top:12px;padding:10px 20px;background:#D97B4F;color:#000;font-weight:700;border-radius:8px;text-decoration:none;">Open Job →</a>
      </div>`,
    });

    await supabase
      .from("quote_requests")
      .update({ reminder_sent: true })
      .eq("id", job.id);

    sent++;
  }

  return NextResponse.json({ sent });
}
