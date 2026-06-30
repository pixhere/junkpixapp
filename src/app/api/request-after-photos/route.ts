import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const { quoteId } = await req.json();

  const { data: quote } = await supabase
    .from("quote_requests")
    .select("*")
    .eq("id", quoteId)
    .single();

  if (!quote) return NextResponse.json({ error: "Quote not found" }, { status: 404 });

  const beforePhotos = (quote.photo_urls || []).slice(0, 3);
  const afterPhotos = (quote.after_photo_urls || []).slice(0, 3);
  const hasPhotos = beforePhotos.length > 0 || afterPhotos.length > 0;

  const photoGrid = (urls: string[], label: string) => urls.length === 0 ? "" : `
    <div style="margin-bottom:8px;">
      <div style="font-size:.65rem;font-weight:700;color:#999;letter-spacing:.1em;font-family:monospace;margin-bottom:8px;">${label}</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        ${urls.map(url => `<img src="${url}" style="width:160px;height:120px;object-fit:cover;border-radius:8px;border:1px solid #e5e5e5;" />`).join("")}
      </div>
    </div>
  `;

  await resend.emails.send({
    from: "JunkPix <noreply@junkpix.com>",
    to: quote.customer_email,
    subject: "Following up on your recent junk removal job",
    html: `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:system-ui,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:20px;">

    <!-- Header -->
    <div style="background:#0A0A0A;border-radius:12px;padding:24px;margin-bottom:16px;text-align:center;">
      <div style="font-size:1.4rem;font-weight:800;color:#D97B4F;letter-spacing:.15em;font-family:monospace;">JUNKPIX</div>
      <div style="font-size:.78rem;color:rgba(255,255,255,0.4);margin-top:4px;letter-spacing:.05em;">JUNK REMOVAL MADE SIMPLE</div>
    </div>

    <!-- Body -->
    <div style="background:#fff;border-radius:12px;padding:28px;margin-bottom:16px;border:1px solid #e5e5e5;">
      <p style="color:#111;font-size:1rem;font-weight:700;margin:0 0 12px;">Hi ${quote.customer_name?.split(" ")[0] || "there"} 👋</p>
      <p style="color:#444;line-height:1.7;font-size:.92rem;margin:0 0 12px;">We are following up on your recent junk removal service to make sure everything went smoothly and met your expectations.</p>
      <p style="color:#444;line-height:1.7;font-size:.92rem;margin:0 0 20px;">As part of our quality control process, could you <strong>reply to this email with a quick photo</strong> of the cleared space? It helps us confirm the job was completed to your satisfaction.</p>

      ${hasPhotos ? `
      <!-- Photos -->
      <div style="background:#f8f8f8;border-radius:8px;padding:16px;margin-bottom:16px;">
        ${photoGrid(beforePhotos, "📷 BEFORE")}
        ${afterPhotos.length > 0 ? photoGrid(afterPhotos, "✅ AFTER") : ""}
      </div>` : ""}

      <p style="color:#444;line-height:1.7;font-size:.92rem;margin:0;">Only takes 30 seconds — we really appreciate it. 🙌</p>
    </div>

    <!-- Footer contact -->
    <div style="background:#0A0A0A;border-radius:12px;padding:20px;border:1px solid #222;text-align:center;margin-bottom:16px;">
      <div style="font-size:.65rem;color:rgba(255,255,255,0.3);letter-spacing:.1em;font-family:monospace;margin-bottom:10px;">QUESTIONS? REACH US ANYTIME</div>
      <div style="font-size:.95rem;font-weight:800;color:#D97B4F;">JunkPix Quality Team</div>
      <div style="font-size:.84rem;color:rgba(255,255,255,0.6);margin-top:6px;">(717) 416-3617</div>
      <div style="font-size:.84rem;margin-top:4px;"><a href="https://www.junkpix.com" style="color:#D97B4F;text-decoration:none;">www.junkpix.com</a></div>
    </div>

    <div style="text-align:center;font-size:.72rem;color:#bbb;">© JunkPix · Harrisburg, PA · <a href="https://www.junkpix.com" style="color:#bbb;">junkpix.com</a></div>
  </div>
</body>
</html>`,
  });

  return NextResponse.json({ success: true });
}
