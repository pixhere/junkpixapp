"use client";
import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const C = {
  bg: "#0A0A0A", card: "#111111", border: "#222222", text: "#F5F4F0",
  muted: "#666660", accent: "#D97B4F", accentDim: "rgba(217,123,79,0.15)",
  green: "#22c55e", red: "#ef4444", surface: "#1a1a1a",
};

const STATUS_STYLES: Record<string, any> = {
  new:       { label: "New",       color: "#D97B4F", bg: "rgba(217,123,79,0.1)" },
  reviewed:  { label: "Reviewed",  color: "#3b82f6", bg: "rgba(59,130,246,0.1)" },
  quoted:    { label: "Quoted",    color: "#a855f7", bg: "rgba(168,85,247,0.1)" },
  booked:    { label: "Booked",    color: "#22c55e", bg: "rgba(34,197,94,0.1)"  },
  completed: { label: "Completed", color: "#888882", bg: "rgba(136,136,130,0.1)"},
  cancelled: { label: "Cancelled", color: "#ef4444", bg: "rgba(239,68,68,0.1)"  },
};

export default function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const [quote, setQuote] = useState<any>(null);
  const [operator, setOperator] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [price, setPrice] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [emailMsg, setEmailMsg] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [aiReply, setAiReply] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: op } = await supabase.from("operators").select("*").eq("id", user.id).single();
      if (op) setOperator(op);

      const { data: q } = await supabase.from("quote_requests").select("*").eq("id", id).eq("operator_id", user.id).single();
      if (q) {
        setQuote(q);
        setPrice(String(q.final_price || q.estimated_min || ""));
      }
      setLoading(false);
    };
    load();
  }, [id]);

  const updateStatus = async (status: string) => {
    const updates: any = { status };
    if (status === "completed") updates.completed_at = new Date().toISOString();
    await supabase.from("quote_requests").update(updates).eq("id", id);
    setQuote((prev: any) => ({ ...prev, ...updates }));
  };

  const sendQuote = async () => {
    if (!price) return;
    setSending(true);
    await supabase.from("quote_requests").update({ status: "quoted", final_price: parseInt(price) }).eq("id", id);
    setQuote((prev: any) => ({ ...prev, status: "quoted", final_price: parseInt(price) }));
    if (quote?.customer_email) {
      await fetch("/api/send-customer-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quote: { ...quote, final_price: parseInt(price) },
          operator,
          message: `Great news! We've reviewed your photos and your quote is ready.\n\nYour price: $${price}\n\nReply to this email or call us to book your junk removal.`,
        }),
      });
    }
    setSending(false);
    setSent(true);
    setTimeout(() => setSent(false), 3000);
  };

  const generateReply = async (type: string) => {
    setReplyLoading(true);
    setAiReply("");
    try {
      const res = await fetch("/api/suggest-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quote, operator, replyType: type }),
      });
      const data = await res.json();
      setAiReply(data.reply || "Could not generate reply.");
    } catch { setAiReply("Something went wrong."); }
    setReplyLoading(false);
  };

  if (loading) return (
    <div style={{ background:C.bg, minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"system-ui,sans-serif" }}>
      <div style={{ width:36, height:36, border:`2px solid ${C.border}`, borderTopColor:C.accent, borderRadius:"50%", animation:"spin .8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!quote) return (
    <div style={{ background:C.bg, minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", color:C.muted, fontFamily:"system-ui,sans-serif" }}>
      Quote not found. <button onClick={() => router.push("/dashboard")} style={{ marginLeft:12, color:C.accent, background:"none", border:"none", cursor:"pointer" }}>← Back</button>
    </div>
  );

  const s = STATUS_STYLES[quote.status] || STATUS_STYLES.new;

  return (
    <div style={{ background:C.bg, minHeight:"100vh", fontFamily:"system-ui,sans-serif", color:C.text }}>
      {/* Header */}
      <div style={{ borderBottom:`1px solid ${C.border}`, padding:"16px 24px", display:"flex", alignItems:"center", gap:16 }}>
        <button onClick={() => router.push("/dashboard")} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:8, color:C.muted, cursor:"pointer", padding:"8px 14px", fontSize:".84rem" }}>
          ← Dashboard
        </button>
        <div style={{ fontWeight:700, color:C.text }}>{quote.customer_name}</div>
        <span style={{ fontSize:".75rem", fontWeight:700, color:s.color, background:s.bg, padding:"4px 10px", borderRadius:20 }}>{s.label}</span>
      </div>

      <div style={{ maxWidth:720, margin:"0 auto", padding:24, display:"flex", flexDirection:"column" as const, gap:20 }}>

        {/* Customer info */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20 }}>
          <div style={{ fontSize:".65rem", color:C.muted, fontFamily:"monospace", letterSpacing:".1em", marginBottom:12 }}>CUSTOMER</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            {[
              { label:"Name", value:quote.customer_name },
              { label:"Phone", value:quote.customer_phone },
              { label:"Email", value:quote.customer_email },
              { label:"Address", value:quote.customer_address },
            ].map(item => (
              <div key={item.label}>
                <div style={{ fontSize:".7rem", color:C.muted, marginBottom:2 }}>{item.label}</div>
                <div style={{ fontSize:".88rem", color:C.text, fontWeight:600 }}>{item.value}</div>
              </div>
            ))}
          </div>
          {quote.customer_notes && (
            <div style={{ marginTop:12, paddingTop:12, borderTop:`1px solid ${C.border}` }}>
              <div style={{ fontSize:".7rem", color:C.muted, marginBottom:4 }}>NOTES</div>
              <div style={{ fontSize:".84rem", color:C.text }}>{quote.customer_notes}</div>
            </div>
          )}
        </div>

        {/* Photos */}
        {quote.photo_urls?.length > 0 && (
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20 }}>
            <div style={{ fontSize:".65rem", color:C.muted, fontFamily:"monospace", letterSpacing:".1em", marginBottom:12 }}>PHOTOS</div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" as const }}>
              {quote.photo_urls.map((url: string, i: number) => (
                <a key={i} href={url} target="_blank" rel="noreferrer">
                  <img src={url} alt={`Photo ${i+1}`} style={{ width:100, height:100, borderRadius:8, objectFit:"cover" as const, border:`1px solid ${C.border}` }} />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* AI Description */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20 }}>
          <div style={{ fontSize:".65rem", color:C.muted, fontFamily:"monospace", letterSpacing:".1em", marginBottom:8 }}>AI DESCRIPTION</div>
          <div style={{ fontSize:".88rem", color:C.text, lineHeight:1.6 }}>{quote.ai_description}</div>
          <div style={{ marginTop:12, paddingTop:12, borderTop:`1px solid ${C.border}`, display:"flex", justifyContent:"space-between" }}>
            <div style={{ fontSize:".7rem", color:C.muted }}>ESTIMATED RANGE</div>
            <div style={{ fontWeight:800, color:C.accent }}>${quote.estimated_min} – ${quote.estimated_max}</div>
          </div>
        </div>

        {/* Send Quote */}
        {quote.status !== "completed" && quote.status !== "cancelled" && (
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20 }}>
            <div style={{ fontSize:".65rem", color:C.muted, fontFamily:"monospace", letterSpacing:".1em", marginBottom:12 }}>
              {quote.final_price ? "QUOTED PRICE" : "SET YOUR PRICE"}
            </div>
            {quote.final_price ? (
              <div style={{ fontSize:"1.8rem", fontWeight:800, color:C.green }}>${quote.final_price}</div>
            ) : (
              <div style={{ display:"flex", gap:10 }}>
                <input
                  type="number"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  placeholder="Enter price"
                  style={{ flex:1, padding:"12px 14px", borderRadius:8, border:`1px solid ${C.border}`, background:C.surface, color:C.text, fontSize:".9rem", outline:"none" }}
                />
                <button
                  onClick={sendQuote}
                  disabled={!price || sending}
                  style={{ padding:"12px 20px", borderRadius:8, border:"none", background:price ? C.accent : "rgba(217,123,79,0.3)", color:price ? "#000" : "rgba(255,255,255,0.3)", fontWeight:700, cursor:price ? "pointer" : "not-allowed", fontSize:".88rem" }}
                >
                  {sending ? "Sending..." : sent ? "Sent ✓" : "Send Quote"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Status actions */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20 }}>
          <div style={{ fontSize:".65rem", color:C.muted, fontFamily:"monospace", letterSpacing:".1em", marginBottom:12 }}>UPDATE STATUS</div>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" as const }}>
            {quote.status === "new" && (
              <button onClick={() => updateStatus("reviewed")} style={{ padding:"10px 16px", borderRadius:8, border:`1px solid ${C.border}`, background:"transparent", color:C.text, fontWeight:600, cursor:"pointer", fontSize:".84rem" }}>
                Mark Reviewed
              </button>
            )}
            {quote.status === "quoted" && (
              <button onClick={() => updateStatus("booked")} style={{ padding:"10px 16px", borderRadius:8, border:"none", background:C.green, color:"#000", fontWeight:700, cursor:"pointer", fontSize:".84rem" }}>
                Mark Booked ✓
              </button>
            )}
            {quote.status === "booked" && (
              <button onClick={() => updateStatus("completed")} style={{ padding:"10px 16px", borderRadius:8, border:"none", background:C.accent, color:"#000", fontWeight:700, cursor:"pointer", fontSize:".84rem" }}>
                Mark Complete ✓
              </button>
            )}
            <button onClick={() => updateStatus("cancelled")} style={{ padding:"10px 16px", borderRadius:8, border:`1px solid rgba(239,68,68,0.3)`, background:"transparent", color:C.red, fontWeight:600, cursor:"pointer", fontSize:".84rem" }}>
              Cancel
            </button>
          </div>
        </div>

        {/* AI Suggested Replies */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20 }}>
          <div style={{ fontSize:".65rem", color:C.muted, fontFamily:"monospace", letterSpacing:".1em", marginBottom:12 }}>AI SUGGESTED REPLIES</div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" as const, marginBottom:12 }}>
            {[{label:"Follow Up",key:"follow_up"},{label:"Send Quote",key:"quote_ready"},{label:"Need Photos",key:"need_more_info"},{label:"Confirm Booking",key:"booking_confirm"},{label:"Price Pushback",key:"price_negotiation"},{label:"No Response",key:"no_show_follow_up"}].map(type => (
              <button key={type.key} onClick={() => generateReply(type.key)} style={{ padding:"8px 12px", borderRadius:8, border:`1px solid ${C.border}`, background:C.surface, color:C.text, cursor:"pointer", fontSize:".78rem" }}>
                {type.label}
              </button>
            ))}
          </div>
          {replyLoading && <div style={{ color:C.muted, fontSize:".84rem" }}>Generating...</div>}
          {aiReply && (
            <div style={{ background:C.surface, borderRadius:8, padding:14, fontSize:".84rem", color:C.text, lineHeight:1.6 }}>
              {aiReply}
              <button onClick={() => navigator.clipboard.writeText(aiReply)} style={{ marginTop:10, display:"block", background:"none", border:`1px solid ${C.border}`, borderRadius:6, color:C.muted, cursor:"pointer", fontSize:".75rem", padding:"6px 12px" }}>
                📋 Copy
              </button>
            </div>
          )}
        </div>

        {/* Email Customer */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20 }}>
          <div style={{ fontSize:".65rem", color:C.muted, fontFamily:"monospace", letterSpacing:".1em", marginBottom:12 }}>EMAIL CUSTOMER</div>
          <textarea
            value={emailMsg}
            onChange={e => setEmailMsg(e.target.value)}
            placeholder="Type your message..."
            rows={3}
            style={{ width:"100%", padding:"12px", borderRadius:8, border:`1px solid ${C.border}`, background:C.surface, color:C.text, fontSize:".84rem", fontFamily:"inherit", resize:"vertical" as const, boxSizing:"border-box" as const, outline:"none", marginBottom:10 }}
          />
          <button
            onClick={async () => {
              if (!emailMsg.trim() || !quote.customer_email) return;
              await fetch("/api/send-customer-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ quote, operator, message: emailMsg }),
              });
              setEmailSent(true);
              setEmailMsg("");
              setTimeout(() => setEmailSent(false), 3000);
            }}
            style={{ padding:"10px 20px", borderRadius:8, border:"none", background:C.accent, color:"#000", fontWeight:700, cursor:"pointer", fontSize:".84rem" }}
          >
            {emailSent ? "Sent ✓" : "Send Email"}
          </button>
        </div>

      </div>
    </div>
  );
}