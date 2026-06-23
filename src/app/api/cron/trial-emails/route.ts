import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();

    const { data: operators, error } = await supabase
      .from("operators")
      .select("*")
      .eq("subscription_status", "trial")
      .not("email", "is", null);

    if (error) throw error;
    if (!operators || operators.length === 0) {
      return NextResponse.json({ sent: 0, message: "No trial operators" });
    }

    let sent = 0;

    for (const operator of operators) {
      const signupDate = new Date(operator.signup_date || operator.created_at);
      const daysSinceSignup = Math.floor((now.getTime() - signupDate.getTime()) / (1000 * 60 * 60 * 24));

      const emailsToSend: number[] = [];
      if (daysSinceSignup >= 3  && !operator.trial_email_3_sent)  emailsToSend.push(3);
      if (daysSinceSignup >= 7  && !operator.trial_email_7_sent)  emailsToSend.push(7);
      if (daysSinceSignup >= 14 && !operator.trial_email_14_sent) emailsToSend.push(14);
      if (daysSinceSignup >= 25 && !operator.trial_email_25_sent) emailsToSend.push(25);
      if (daysSinceSignup >= 30 && !operator.trial_email_30_sent) emailsToSend.push(30);

      for (const day of emailsToSend) {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/send-trial-email`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ operator, day }),
          });

          if (res.ok) {
            await supabase.from("operators").update({
              [`trial_email_${day}_sent`]: true,
            }).eq("id", operator.id);
            sent++;
          }
        } catch {
          // continue to next
        }
      }
    }

    return NextResponse.json({ sent });
  } catch (err: any) {
    console.error("trial-emails cron error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}