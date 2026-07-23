"use client";
import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const C = {
  bg: "#0F172A", card: "#0F172A", border: "#2D3748", text: "#F5F4F0",
  muted: "#666660", accent: "#00D4C8", accentDim: "rgba(0,212,200,0.15)",
  green: "#22c55e", red: "#ef4444", surface: "#1a1a1a",
};

const STATUS_STYLES: Record<string, any> = {
  new:       { label: "New",       color: "#00D4C8", bg: "rgba(0,212,200,0.1)" },
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
  const [extraItems, setExtraItems] = useState<{name:string,fee:number}[]>([]);
  const [newExtraName, setNewExtraName] = useState("");
  const [newExtraFee, setNewExtraFee] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [emailMsg, setEmailMsg] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [schedDate, setSchedDate] = useState("");
  const [schedTime, setSchedTime] = useState("");
  const [schedNotes, setSchedNotes] = useState("");
  const [schedSaved, setSchedSaved] = useState(false);
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
        setExtraItems(q.extra_items || (q.special_items || []));
      }
      setLoading(false);
    };
    load();
  }, [id]);

  const updateStatus = async (status: string) => {
    if (status === "completed" && (!quote?.after_photo_urls || quote.after_photo_urls.length === 0)) {
      alert("📸 After photos required before marking as completed.\nGo to Before & After to upload them.");
      return;
    }
    const updates: any = { status };
    if (status === "completed") updates.completed_at = new Date().toISOString();
    await supabase.from("quote_requests").update(updates).eq("id", id);
    setQuote((prev: any) => ({ ...prev, ...updates }));

    // Fire webhook
    if (operator?.id) {
      fetch("/api/webhook/fire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operatorId: operator.id,
          event: `quote.${status}`,
          data: {
            quote_id: id,
            status,
            customer_name: quote?.customer_name,
            customer_phone: quote?.customer_phone,
            customer_email: quote?.customer_email,
            customer_address: quote?.customer_address,
            final_price: quote?.final_price,
            updated_at: new Date().toISOString(),
          }
        }),
      }).catch(() => {});
    }
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

  const [customerMessage, setCustomerMessage] = useState("");

  const generateReply = async (type: string) => {
    setReplyLoading(true);
    setAiReply("");
    try {
      const res = await fetch("/api/suggest-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quote, operator, replyType: type, seed: Date.now(), customerMessage }),
      });

      if (!res.ok) { setAiReply("Something went wrong."); return; }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let full = "";
      setReplyLoading(false);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value);
        setAiReply(full);
      }
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

        {/* Before & After + Costs buttons */}
        <div style={{ display:"flex", gap:12 }}>
          <button onClick={() => router.push(`/dashboard/quote/${quote.id}/photos`)} style={{ flex:1, padding:"13px", borderRadius:8, border:`1px solid ${C.border}`, background:C.card, color:C.text, fontWeight:600, cursor:"pointer", fontSize:".88rem" }}>
            📸 Before & After Photos
          </button>
          <button onClick={() => router.push(`/dashboard/quote/${quote.id}/costs`)} style={{ flex:1, padding:"13px", borderRadius:8, border:`1px solid ${C.border}`, background:C.card, color:C.text, fontWeight:600, cursor:"pointer", fontSize:".88rem" }}>
            💰 Job Cost Tracking
          </button>
        </div>

        {/* PixBrain v2 Analysis */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <div style={{ fontSize:".65rem", color:C.accent, fontFamily:"monospace", letterSpacing:".1em", fontWeight:700 }}>🧠 PIXBRAIN ANALYSIS</div>
            {quote.booking_score && (
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <div style={{ fontSize:".65rem", color:C.muted }}>BOOKING SCORE</div>
                <div style={{ fontWeight:800, fontSize:"1.1rem", color: quote.booking_score >= 70 ? "#22c55e" : quote.booking_score >= 40 ? "#F59E0B" : "#ef4444" }}>{quote.booking_score}/100</div>
              </div>
            )}
          </div>

          {/* Risk Flag */}
          {quote.risk_flag && (
            <div style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:8, padding:"10px 14px", marginBottom:12 }}>
              <div style={{ fontWeight:700, color:"#ef4444", fontSize:".84rem" }}>⚠️ RISK FLAG</div>
              <div style={{ fontSize:".78rem", color:C.muted, marginTop:4 }}>{quote.risk_reason}</div>
            </div>
          )}

          {/* Job Type + Volume */}
          {(quote.job_type || quote.volume_cubic_yards) && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:12 }}>
              {quote.job_type && <div style={{ background:C.surface, borderRadius:8, padding:"10px 12px" }}>
                <div style={{ fontSize:".6rem", color:C.muted, marginBottom:2 }}>JOB TYPE</div>
                <div style={{ fontSize:".82rem", fontWeight:600, color:C.text }}>{quote.job_type}</div>
              </div>}
              {quote.volume_cubic_yards && <div style={{ background:C.surface, borderRadius:8, padding:"10px 12px" }}>
                <div style={{ fontSize:".6rem", color:C.muted, marginBottom:2 }}>VOLUME</div>
                <div style={{ fontSize:".82rem", fontWeight:600, color:C.text }}>{quote.volume_cubic_yards} cu yd</div>
              </div>}
              {quote.recommended_crew && <div style={{ background:C.surface, borderRadius:8, padding:"10px 12px" }}>
                <div style={{ fontSize:".6rem", color:C.muted, marginBottom:2 }}>CREW / TIME</div>
                <div style={{ fontSize:".82rem", fontWeight:600, color:C.text }}>{quote.recommended_crew} people · {quote.estimated_hours}hrs</div>
              </div>}
            </div>
          )}

          {/* Plain Description */}
          <div style={{ fontSize:".88rem", color:C.text, lineHeight:1.6, marginBottom:12 }}>{quote.ai_description}</div>

          {/* Item List */}
          {quote.item_list && quote.item_list.length > 0 && (
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:".65rem", color:C.muted, fontFamily:"monospace", marginBottom:8 }}>DETECTED ITEMS</div>
              <div style={{ display:"flex", flexDirection:"column" as const, gap:4 }}>
                {quote.item_list.map((item: any, i: number) => (
                  <div key={i} style={{ display:"flex", justifyContent:"space-between", fontSize:".82rem", padding:"4px 0", borderBottom:`1px solid ${C.border}` }}>
                    <span style={{ color:C.text }}>{item.quantity}× {item.name}</span>
                    <span style={{ color:C.muted }}>{item.estimatedWeightLbs ? `~${item.estimatedWeightLbs} lbs` : ""}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Difficulty Factors */}
          {quote.difficulty_factors && Object.values(quote.difficulty_factors).some(Boolean) && (
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:".65rem", color:C.muted, fontFamily:"monospace", marginBottom:8 }}>DIFFICULTY FLAGS</div>
              <div style={{ display:"flex", flexWrap:"wrap" as const, gap:6 }}>
                {Object.entries(quote.difficulty_factors).filter(([,v]) => v).map(([k]) => (
                  <span key={k} style={{ background:"rgba(245,158,11,0.1)", border:"1px solid rgba(245,158,11,0.3)", color:"#F59E0B", fontSize:".72rem", fontWeight:600, padding:"3px 8px", borderRadius:20 }}>
                    {k.replace(/([A-Z])/g, " $1").trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Upsell Suggestions */}
          {quote.upsell_suggestions && quote.upsell_suggestions.length > 0 && (
            <div style={{ marginBottom:12, background:"rgba(0,212,200,0.05)", border:`1px solid ${C.accent}`, borderRadius:8, padding:12 }}>
              <div style={{ fontSize:".65rem", color:C.accent, fontFamily:"monospace", marginBottom:8 }}>💡 UPSELL OPPORTUNITIES</div>
              {quote.upsell_suggestions.map((s: any, i: number) => (
                <div key={i} style={{ fontSize:".82rem", color:C.text, marginBottom:4 }}>
                  <span style={{ color:C.accent, fontWeight:700 }}>+${s.addOnPrice}</span> {s.item} — <span style={{ color:C.muted }}>{s.reason}</span>
                </div>
              ))}
            </div>
          )}

          {/* Suggested Customer Message */}
          {quote.suggested_customer_message && (
            <div style={{ marginBottom:12, background:C.surface, borderRadius:8, padding:12 }}>
              <div style={{ fontSize:".65rem", color:C.muted, fontFamily:"monospace", marginBottom:6 }}>💬 SUGGESTED MESSAGE</div>
              <div style={{ fontSize:".82rem", color:C.text, lineHeight:1.6, fontStyle:"italic" }}>{quote.suggested_customer_message}</div>
            </div>
          )}
          {quote.yard_waste_flag && (
            <div style={{ marginTop:12, padding:"12px 14px", background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.3)", borderRadius:8 }}>
              <div style={{ fontWeight:700, color:"#16a34a", fontSize:".84rem", marginBottom:4 }}>🌿 YARD WASTE DETECTED</div>
              <div style={{ fontSize:".78rem", color:C.muted }}>Requires separate disposal trip to Zeager Bros. Add $75-100 minimum.</div>
            </div>
          )}
          {quote.tire_flag && (
            <div style={{ marginTop:12, padding:"12px 14px", background:"rgba(59,130,246,0.08)", border:"1px solid rgba(59,130,246,0.3)", borderRadius:8 }}>
              <div style={{ fontWeight:700, color:"#2563eb", fontSize:".84rem", marginBottom:4 }}>🔄 TIRES DETECTED</div>
              <div style={{ fontSize:".78rem", color:C.muted }}>Car/SUV: $25/tire · Truck: $35/tire · Count: {quote.tire_count || "unknown"}</div>
            </div>
          )}
          {quote.heavy_material_flag && (
            <div style={{ marginTop:12, padding:"12px 14px", background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:8 }}>
              <div style={{ fontWeight:700, color:"#ef4444", fontSize:".84rem", marginBottom:4 }}>⚠️ HEAVY MATERIALS DETECTED</div>
              <div style={{ fontSize:".78rem", color:C.muted, lineHeight:1.5 }}>
                {quote.heavy_materials?.join(", ")} — Standard load pricing may not apply. Price accordingly.
              </div>
            </div>
          )}
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
          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:".72rem", color:C.muted, marginBottom:6 }}>Customer said (optional):</div>
            <input
              type="text"
              value={customerMessage}
              onChange={e => setCustomerMessage(e.target.value)}
              placeholder="e.g. that's too expensive, can you do $150?"
              style={{ width:"100%", padding:"10px 12px", borderRadius:8, border:`1px solid ${C.border}`, background:C.surface, color:C.text, fontSize:".84rem", outline:"none", boxSizing:"border-box" as const }}
            />
          </div>
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
              <div style={{ display:"flex", gap:8, marginTop:10, flexWrap:"wrap" as const }}>
                <button onClick={() => navigator.clipboard.writeText(aiReply)} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:6, color:C.muted, cursor:"pointer", fontSize:".75rem", padding:"6px 12px" }}>
                  📋 Copy
                </button>
                <button onClick={() => setEmailMsg(aiReply)} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:6, color:C.accent, cursor:"pointer", fontSize:".75rem", padding:"6px 12px" }}>
                  ✉️ Use in Email
                </button>
                <a href={`sms:${quote.customer_phone}&body=${encodeURIComponent(aiReply)}`} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:6, color:C.green, cursor:"pointer", fontSize:".75rem", padding:"6px 12px", textDecoration:"none" }}>
                  💬 Send as SMS
                </a>
              </div>
            </div>
          )}
          <div style={{ marginTop:12, paddingTop:12, borderTop:`1px solid ${C.border}`, display:"flex", gap:16 }}>
            <div>
              <div style={{ fontSize:".65rem", color:C.muted, marginBottom:2 }}>CUSTOMER EMAIL</div>
              <a href={`mailto:${quote.customer_email}`} style={{ fontSize:".84rem", color:C.accent, textDecoration:"none", fontWeight:600 }}>{quote.customer_email}</a>
            </div>
            <div>
              <div style={{ fontSize:".65rem", color:C.muted, marginBottom:2 }}>PHONE</div>
              <a href={`tel:${quote.customer_phone}`} style={{ fontSize:".84rem", color:C.accent, textDecoration:"none", fontWeight:600 }}>{quote.customer_phone}</a>
            </div>
          </div>
        </div>
        {/* Schedule Job */}
        {(quote.status === "booked" || quote.status === "quoted") && (
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20 }}>
            <div style={{ fontSize:".65rem", color:C.muted, fontFamily:"monospace", letterSpacing:".1em", marginBottom:12 }}>📅 SCHEDULE JOB</div>
            
            {quote.scheduled_date ? (
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:"1rem", fontWeight:700, color:C.accent, marginBottom:4 }}>
                  📅 {new Date(quote.scheduled_date + 'T12:00:00').toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric" })}
                  {quote.scheduled_time && ` at ${quote.scheduled_time}`}
                </div>
                {quote.schedule_notes && <div style={{ fontSize:".84rem", color:C.muted }}>{quote.schedule_notes}</div>}
              </div>
            ) : null}

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
              <div>
                <div style={{ fontSize:".7rem", color:C.muted, marginBottom:4 }}>DATE</div>
                <input
                  type="date"
                  value={schedDate || quote.scheduled_date || ""}
                  onChange={e => setSchedDate(e.target.value)}
                  style={{ width:"100%", padding:"10px 12px", borderRadius:8, border:`1px solid ${C.border}`, background:C.surface, color:C.text, fontSize:".84rem", outline:"none", boxSizing:"border-box" as const }}
                />
              </div>
              <div>
                <div style={{ fontSize:".7rem", color:C.muted, marginBottom:4 }}>TIME</div>
                <select
                  value={schedTime || quote.scheduled_time || ""}
                  onChange={e => setSchedTime(e.target.value)}
                  style={{ width:"100%", padding:"10px 12px", borderRadius:8, border:`1px solid ${C.border}`, background:C.surface, color:C.text, fontSize:".84rem", outline:"none", boxSizing:"border-box" as const }}
                >
                  <option value="">Select time</option>
                  {["7:00 AM","8:00 AM","9:00 AM","10:00 AM","11:00 AM","12:00 PM","1:00 PM","2:00 PM","3:00 PM","4:00 PM","5:00 PM"].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
            <input
              type="text"
              value={schedNotes}
              onChange={e => setSchedNotes(e.target.value)}
              placeholder="Notes (e.g. bring extra crew, heavy items)"
              style={{ width:"100%", padding:"10px 12px", borderRadius:8, border:`1px solid ${C.border}`, background:C.surface, color:C.text, fontSize:".84rem", outline:"none", boxSizing:"border-box" as const, marginBottom:10 }}
            />
            <button
              onClick={async () => {
                if (!schedDate) return;
                await supabase.from("quote_requests").update({
                  scheduled_date: schedDate,
                  scheduled_time: schedTime,
                  schedule_notes: schedNotes,
                }).eq("id", id);
                setQuote((prev: any) => ({ ...prev, scheduled_date: schedDate, scheduled_time: schedTime, schedule_notes: schedNotes }));
                
                // Email customer
                if (quote?.customer_email) {
                  await fetch("/api/send-customer-email", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      quote,
                      operator,
                      message: `Great news! Your junk removal job has been scheduled.\n\nDate: ${new Date(schedDate + 'T12:00:00').toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric" })}\nTime: ${schedTime || "TBD"}\n\n${schedNotes ? `Notes: ${schedNotes}\n\n` : ""}We'll see you then! Reply to this email if you need to make any changes.`,
                    }),
                  });
                }
                
                setSchedSaved(true);
                setTimeout(() => setSchedSaved(false), 3000);
              }}
              disabled={!schedDate}
              style={{ width:"100%", padding:"11px 0", borderRadius:8, border:"none", background: schedDate ? C.accent : "rgba(217,123,79,0.3)", color: schedDate ? "#000" : "rgba(255,255,255,0.3)", fontWeight:700, cursor: schedDate ? "pointer" : "not-allowed", fontSize:".88rem" }}
            >
              {schedSaved ? "Scheduled ✓" : "Save Schedule & Notify Customer"}

            </button>
          </div>
        )}
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
