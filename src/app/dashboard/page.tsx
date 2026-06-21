"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const C = {
  bg: "#0A0A0A",
  surface: "#111111",
  card: "#161616",
  border: "#222222",
  accent: "#D97B4F",
  accentDim: "rgba(217,123,79,0.1)",
  text: "#F0F0F0",
  muted: "#666666",
  green: "#22c55e",
  red: "#ef4444",
  blue: "#3b82f6",
};

const STATUS_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  new:       { label: "New",        color: C.blue,   bg: "rgba(59,130,246,0.1)" },
  reviewed:  { label: "Reviewed",   color: C.accent, bg: C.accentDim },
  quoted:    { label: "Quoted",     color: "#a855f7", bg: "rgba(168,85,247,0.1)" },
  booked:    { label: "Booked",     color: C.green,  bg: "rgba(34,197,94,0.1)" },
  completed: { label: "Completed",  color: C.muted,  bg: "rgba(102,102,102,0.1)" },
  cancelled: { label: "Cancelled",  color: C.red,    bg: "rgba(239,68,68,0.1)" },
};

const NAV = [
  { id: "overview",   label: "Overview",   icon: "▦" },
  { id: "quotes",     label: "Quotes",     icon: "📋" },
  { id: "analytics",  label: "Analytics",  icon: "📊" },
  { id: "settings",   label: "Settings",   icon: "⚙️" },
];

// ── MOCK DATA (replace with real Supabase data later) ─────────────────────────
const MOCK_QUOTES = [
  { id: "1", created_at: "2025-06-19T09:00:00Z", customer_name: "Marcus T.", customer_phone: "717-555-0101", customer_email: "marcus@email.com", customer_address: "412 Pine St, Harrisburg PA", customer_notes: "Side gate is locked, call first", ai_description: "Large pile of mixed furniture — sofa, dresser, two mattresses, approximately half truck load. Standard access, ground floor.", status: "new", estimated_min: 350, estimated_max: 525 },
  { id: "2", created_at: "2025-06-18T14:30:00Z", customer_name: "Sandra L.", customer_phone: "717-555-0102", customer_email: "sandra@email.com", customer_address: "88 Elm Ave, Camp Hill PA", customer_notes: "", ai_description: "Washer and dryer, side by side, in laundry room on first floor. No stairs. Easy access.", status: "quoted", estimated_min: 190, estimated_max: 210, final_price: 200 },
  { id: "3", created_at: "2025-06-18T10:00:00Z", customer_name: "Derek W.", customer_phone: "717-555-0103", customer_email: "derek@email.com", customer_address: "291 Oak Blvd, Mechanicsburg PA", customer_notes: "Basement stuff too", ai_description: "Mixed construction debris — drywall scraps, lumber, tiles. Approximately quarter truck load. Basement access, one flight of stairs.", status: "booked", estimated_min: 375, estimated_max: 425, final_price: 400 },
  { id: "4", created_at: "2025-06-17T16:00:00Z", customer_name: "Priya N.", customer_phone: "717-555-0104", customer_email: "priya@email.com", customer_address: "55 Walnut Ln, York PA", customer_notes: "", ai_description: "Console piano in living room, ground floor. Approximately 400 lbs. Standard doorway, no stairs.", status: "new", estimated_min: 350, estimated_max: 370 },
];

export default function Dashboard() {
  const [active, setActive]       = useState("overview");
  const [quotes, setQuotes] = useState<any[]>([]);
  const [selected, setSelected]   = useState<any>(null);
  const [operator, setOperator]   = useState<any>(null);
  const [filter, setFilter]       = useState("all");
  const [finalPrice, setFinalPrice] = useState("");
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);

  useEffect(() => {
  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Load operator info
      const { data: op } = await supabase
        .from("operators")
        .select("*")
        .eq("id", user.id)
        .single();
      if (op) setOperator(op);

      // Load real quote requests
      const { data: qs } = await supabase
        .from("quote_requests")
        .select("*")
        .eq("operator_id", user.id)
        .order("created_at", { ascending: false });
      if (qs) setQuotes(qs);
    }
  };
  load();
}, []);

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const newCount       = quotes.filter(q => q.status === "new").length;
  const bookedCount    = quotes.filter(q => q.status === "booked").length;
  const completedCount = quotes.filter(q => q.status === "completed").length;
  const weekRevenue    = quotes.filter(q => q.final_price).reduce((s: number, q: any) => s + (q.final_price || 0), 0);

  const filteredQuotes = filter === "all" ? quotes : quotes.filter(q => q.status === filter);

  const updateStatus = (id: string, status: string) => {
    setQuotes(prev => prev.map(q => q.id === id ? { ...q, status } : q));
    if (selected?.id === id) setSelected((prev: any) => ({ ...prev, status }));
  };

  const sendQuote = (id: string, price: number) => {
    setQuotes(prev => prev.map(q => q.id === id ? { ...q, status: "quoted", final_price: price } : q));
    if (selected?.id === id) setSelected((prev: any) => ({ ...prev, status: "quoted", final_price: price }));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const inp = {
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    padding: "11px 14px",
    color: C.text,
    fontSize: ".9rem",
    fontFamily: "inherit",
    outline: "none",
    width: "100%",
    boxSizing: "border-box" as const,
  };

  // ── QUOTE DETAIL MODAL ──────────────────────────────────────────────────────
  // ── QUOTE DETAIL MODAL ──────────────────────────────────────────────────────
  const QuoteModal = ({ quote, onClose }: any) => {
    const s = STATUS_STYLES[quote.status] || STATUS_STYLES.new;
    const [price, setPrice] = useState(String(quote.final_price || quote.estimated_min || ""));

    // AI Replies state
    const [aiReply, setAiReply]           = useState("");
    const [loadingReply, setLoadingReply] = useState(false);
    const [copiedReply, setCopiedReply]   = useState(false);
    const [activeType, setActiveType]     = useState("");

    const REPLY_TYPES = [
      { id: "follow_up",          label: "Follow Up",       icon: "💬" },
      { id: "quote_ready",        label: "Send Quote",      icon: "💰" },
      { id: "need_more_info",     label: "Need Photos",     icon: "📸" },
      { id: "booking_confirm",    label: "Confirm Booking", icon: "✅" },
      { id: "price_negotiation",  label: "Price Pushback",  icon: "🤝" },
      { id: "no_show_follow_up",  label: "No Response",     icon: "👋" },
    ];

    const generateReply = async (replyType: string) => {
      setAiReply("");
      setCopiedReply(false);
      setLoadingReply(true);
      setActiveType(replyType);
      try {
        const res = await fetch("/api/suggest-reply", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quote, operator, replyType, seed: Date.now() }),
        });
        const data = await res.json();
        setAiReply(data.reply || "Could not generate reply.");
      } catch {
        setAiReply("Something went wrong. Try again.");
      } finally {
        setLoadingReply(false);
      }
    };

    const copyReply = () => {
      navigator.clipboard.writeText(aiReply);
      setCopiedReply(true);
      setTimeout(() => setCopiedReply(false), 2000);
    };

    return (
      <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
        <div onClick={e => e.stopPropagation()} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:32, width:"100%", maxWidth:560, maxHeight:"92vh", overflowY:"auto" }}>
          
          {/* Header */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24 }}>
            <div>
              <div style={{ fontSize:".7rem", color:C.muted, letterSpacing:".1em", fontFamily:"monospace", marginBottom:4 }}>QUOTE REQUEST</div>
              <div style={{ fontSize:"1.4rem", fontWeight:800, color:C.text }}>{quote.customer_name}</div>
              <div style={{ fontSize:".84rem", color:C.muted, marginTop:2 }}>{quote.customer_address}</div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <span style={{ fontSize:".72rem", fontWeight:700, color:s.color, background:s.bg, padding:"5px 12px", borderRadius:20 }}>{s.label}</span>
              <button onClick={onClose} style={{ background:"none", border:"none", color:C.muted, fontSize:"1.2rem", cursor:"pointer" }}>✕</button>
            </div>
          </div>

          {/* Customer contact */}
          <div style={{ background:C.surface, borderRadius:10, padding:16, marginBottom:16 }}>
            <div style={{ fontSize:".7rem", color:C.muted, letterSpacing:".1em", fontFamily:"monospace", marginBottom:12 }}>CUSTOMER</div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {[
                ["📞", quote.customer_phone, `tel:${quote.customer_phone}`],
                ["📧", quote.customer_email, `mailto:${quote.customer_email}`],
              ].map(([icon, val, href]) => (
                <a key={String(href)} href={String(href)} style={{ display:"flex", alignItems:"center", gap:10, color:C.accent, textDecoration:"none", fontSize:".88rem" }}>
                  <span>{icon}</span>{val}
                </a>
              ))}
              {quote.customer_notes && (
                <div style={{ display:"flex", gap:10, alignItems:"flex-start", marginTop:4 }}>
                  <span>📝</span>
                  <span style={{ fontSize:".84rem", color:C.muted, lineHeight:1.45 }}>{quote.customer_notes}</span>
                </div>
              )}
            </div>
          </div>

          {/* AI Description */}
          <div style={{ background:C.surface, borderRadius:10, padding:16, marginBottom:16 }}>
            <div style={{ fontSize:".7rem", color:C.muted, letterSpacing:".1em", fontFamily:"monospace", marginBottom:10 }}>AI DESCRIPTION</div>
            <div style={{ fontSize:".88rem", color:C.text, lineHeight:1.6 }}>{quote.ai_description}</div>
            {quote.estimated_min && (
              <div style={{ marginTop:12, paddingTop:12, borderTop:`1px solid ${C.border}`, display:"flex", justifyContent:"space-between" }}>
                <span style={{ fontSize:".78rem", color:C.muted }}>Estimated range</span>
                <span style={{ fontSize:".88rem", fontWeight:700, color:C.accent }}>${quote.estimated_min} – ${quote.estimated_max}</span>
              </div>
            )}
          </div>
         {/* Photos */}
          {(() => {
            const urls = Array.isArray(quote.photo_urls) 
              ? quote.photo_urls 
              : typeof quote.photo_urls === 'string' 
                ? JSON.parse(quote.photo_urls) 
                : [];
            return urls.length > 0 ? (
              <div style={{ background:C.surface, borderRadius:10, padding:16, marginBottom:16 }}>
                <div style={{ fontSize:".7rem", color:C.muted, letterSpacing:".1em", fontFamily:"monospace", marginBottom:12 }}>CUSTOMER PHOTOS</div>
                <div style={{ display:"flex", gap:10, flexWrap:"wrap" as const }}>
                  {urls.map((url: string, i: number) => (
                    <a key={i} href={url} target="_blank" rel="noreferrer">
                      <img src={url} alt={"Photo " + (i+1)} style={{ width:140, height:105, objectFit:"cover" as const, borderRadius:8, border:`1px solid ${C.border}`, cursor:"pointer" }} />
                    </a>
                  ))}
                </div>
              </div>
            ) : null;
          })()}

          {/* AI SUGGESTED REPLIES */}
          <div style={{ background:C.surface, borderRadius:10, padding:16, marginBottom:16, border:`1px solid rgba(217,123,79,0.15)` }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:"1rem" }}>✨</span>
                <div style={{ fontSize:".7rem", color:C.accent, letterSpacing:".1em", fontFamily:"monospace", fontWeight:700 }}>AI SUGGESTED REPLIES</div>
              </div>
              <div style={{ fontSize:".7rem", color:C.muted }}>Click to generate · Copy to text</div>
            </div>

            <div style={{ display:"flex", flexWrap:"wrap" as const, gap:8, marginBottom:14 }}>
              {REPLY_TYPES.map(t => (
                <button
                  key={t.id}
                  onClick={() => generateReply(t.id)}
                  disabled={loadingReply}
                  style={{
                    padding:"7px 13px",
                    borderRadius:20,
                    border:`1px solid ${activeType === t.id ? C.accent : C.border}`,
                    background: activeType === t.id ? C.accentDim : "transparent",
                    color: activeType === t.id ? C.accent : C.muted,
                    fontSize:".75rem",
                    fontWeight:600,
                    cursor: loadingReply ? "not-allowed" : "pointer",
                    display:"flex",
                    alignItems:"center",
                    gap:5,
                    transition:"all .15s",
                    opacity: loadingReply && activeType !== t.id ? 0.5 : 1,
                  }}
                >
                  <span>{t.icon}</span> {t.label}
                </button>
              ))}
            </div>

            {(loadingReply || aiReply) && (
              <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:14 }}>
                {loadingReply ? (
                  <div style={{ display:"flex", alignItems:"center", gap:10, color:C.muted, fontSize:".84rem", padding:"8px 0" }}>
                    <span style={{ animation:"spin 1s linear infinite", display:"inline-block" }}>⟳</span>
                    Drafting reply…
                    <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize:".84rem", color:C.text, lineHeight:1.65, padding:"10px 14px", background:C.card, borderRadius:8, border:`1px solid ${C.border}`, marginBottom:10, whiteSpace:"pre-wrap" as const }}>
                      {aiReply}
                    </div>
                    <div style={{ display:"flex", gap:8 }}>
                      <button
                        onClick={copyReply}
                        style={{ flex:1, padding:"9px 0", borderRadius:8, border:"none", background: copiedReply ? "rgba(34,197,94,0.15)" : C.accentDim, color: copiedReply ? C.green : C.accent, fontWeight:700, cursor:"pointer", fontSize:".82rem", transition:"all .2s" }}
                      >
                        {copiedReply ? "Copied ✓" : "📋 Copy Message"}
                      </button>
                      
                        <button
                        onClick={() => { window.open("sms:" + quote.customer_phone + "?body=" + encodeURIComponent(aiReply)); }}
                        style={{ padding:"9px 16px", borderRadius:8, border:"1px solid " + C.border, background:"transparent", color:C.text, fontWeight:600, cursor:"pointer", fontSize:".82rem" }}
                      >
                        💬 Open in SMS
                      </button>
                      <button
                        onClick={() => generateReply(activeType)}
                        style={{ padding:"9px 14px", borderRadius:8, border:`1px solid ${C.border}`, background:"transparent", color:C.muted, fontWeight:600, cursor:"pointer", fontSize:".82rem" }}
                        title="Regenerate"
                      >
                        ↺
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {!loadingReply && !aiReply && (
              <div style={{ fontSize:".78rem", color:C.muted, textAlign:"center" as const, padding:"6px 0" }}>
                Pick a reply type above — AI will draft a text message you can copy or send
              </div>
            )}
          </div>

          {/* Send quote */}
          {quote.status === "new" || quote.status === "reviewed" ? (
            <div style={{ background:C.accentDim, border:`1px solid rgba(217,123,79,0.2)`, borderRadius:10, padding:16, marginBottom:16 }}>
              <div style={{ fontSize:".7rem", color:C.accent, letterSpacing:".1em", fontFamily:"monospace", marginBottom:12 }}>SET YOUR PRICE</div>
              <div style={{ display:"flex", gap:10 }}>
                <input
                  type="number"
                  placeholder="Enter your price..."
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  style={{ ...inp, flex:1 }}
                />
                <button
                  onClick={() => price && sendQuote(quote.id, parseInt(price))}
                  disabled={!price}
                  style={{ padding:"11px 20px", borderRadius:8, border:"none", background:price ? C.accent : "rgba(217,123,79,0.3)", color:price ? "#000" : "rgba(255,255,255,0.3)", fontWeight:700, cursor:price ? "pointer" : "not-allowed", fontSize:".88rem", whiteSpace:"nowrap" as const }}
                >
                  {saved ? "Sent ✓" : "Send Quote"}
                </button>
              </div>
            </div>
          ) : quote.final_price ? (
            <div style={{ background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.2)", borderRadius:10, padding:16, marginBottom:16, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontSize:".84rem", color:C.muted }}>Quote sent to customer</span>
              <span style={{ fontSize:"1.4rem", fontWeight:800, color:C.green }}>${quote.final_price}</span>
            </div>
          ) : null}

          {/* Action buttons */}
          <div style={{ display:"flex", gap:10 }}>
            {quote.status === "new" && (
              <button onClick={() => updateStatus(quote.id, "reviewed")} style={{ flex:1, padding:"12px 0", borderRadius:8, border:`1px solid ${C.border}`, background:"transparent", color:C.text, fontWeight:600, cursor:"pointer", fontSize:".88rem" }}>
                Mark Reviewed
              </button>
            )}
            {quote.status === "quoted" && (
              <button onClick={() => updateStatus(quote.id, "booked")} style={{ flex:1, padding:"12px 0", borderRadius:8, border:"none", background:C.green, color:"#000", fontWeight:700, cursor:"pointer", fontSize:".88rem" }}>
                Mark Booked ✓
              </button>
            )}
            {quote.status === "booked" && (
              <button onClick={() => updateStatus(quote.id, "completed")} style={{ flex:1, padding:"12px 0", borderRadius:8, border:"none", background:C.accent, color:"#000", fontWeight:700, cursor:"pointer", fontSize:".88rem" }}>
                Mark Complete ✓
              </button>
            )}
            <button onClick={() => updateStatus(quote.id, "cancelled")} style={{ padding:"12px 20px", borderRadius:8, border:`1px solid rgba(239,68,68,0.3)`, background:"transparent", color:C.red, fontWeight:600, cursor:"pointer", fontSize:".88rem" }}>
              Cancel
            </button>
          </div>

        </div>
      </div>
    );
  };

  // ── OVERVIEW ────────────────────────────────────────────────────────────────
  const Overview = () => (
    <div style={{ display:"flex", flexDirection:"column", gap:28 }}>
      <div>
        <div style={{ fontSize:"1.5rem", fontWeight:800, color:C.text }}>
          Good morning{operator?.owner_name ? `, ${operator.owner_name.split(" ")[0]}` : ""} 👋
        </div>
        <div style={{ fontSize:".88rem", color:C.muted, marginTop:4 }}>Here's what needs your attention today.</div>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16 }}>
        {[
          { label:"New Requests",  value:newCount,       color:C.blue,   sub:"Need your review" },
          { label:"Booked Jobs",   value:bookedCount,    color:C.green,  sub:"Confirmed this week" },
          { label:"Completed",     value:completedCount, color:C.muted,  sub:"This week" },
          { label:"Week Revenue",  value:`$${weekRevenue}`, color:C.accent, sub:"From quoted jobs" },
        ].map((stat, i) => (
          <div key={i} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"20px 18px" }}>
            <div style={{ fontSize:".68rem", color:C.muted, letterSpacing:".1em", fontFamily:"monospace", marginBottom:8 }}>{stat.label.toUpperCase()}</div>
            <div style={{ fontSize:"2rem", fontWeight:800, color:stat.color, lineHeight:1 }}>{stat.value}</div>
            <div style={{ fontSize:".75rem", color:C.muted, marginTop:6 }}>{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* New requests */}
      {quotes.filter(q => q.status === "new").length > 0 && (
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, overflow:"hidden" }}>
          <div style={{ padding:"16px 20px", borderBottom:`1px solid ${C.border}`, display:"flex", justifyContent:"space-between" }}>
            <span style={{ fontWeight:700, color:C.text }}>New Quote Requests</span>
            <span style={{ fontSize:".78rem", color:C.accent, fontWeight:600 }}>{newCount} new</span>
          </div>
          {quotes.filter(q => q.status === "new").map(q => (
            <div key={q.id} onClick={() => setSelected(q)} style={{ padding:"16px 20px", borderBottom:`1px solid ${C.border}`, cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#1a1a1a")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <div>
                <div style={{ fontWeight:600, color:C.text, marginBottom:4 }}>{q.customer_name}</div>
                <div style={{ fontSize:".78rem", color:C.muted }}>{q.customer_address}</div>
                <div style={{ fontSize:".78rem", color:C.muted, marginTop:4, lineHeight:1.4 }}>{q.ai_description?.slice(0, 80)}...</div>
              </div>
              <div style={{ textAlign:"right", flexShrink:0, marginLeft:16 }}>
                <div style={{ color:C.accent, fontWeight:700, fontSize:"1.1rem" }}>${q.estimated_min}–${q.estimated_max}</div>
                <div style={{ fontSize:".72rem", color:C.muted, marginTop:4 }}>estimated range</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* All recent */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, overflow:"hidden" }}>
        <div style={{ padding:"16px 20px", borderBottom:`1px solid ${C.border}` }}>
          <span style={{ fontWeight:700, color:C.text }}>Recent Activity</span>
        </div>
        {quotes.slice(0,4).map(q => {
          const s = STATUS_STYLES[q.status] || STATUS_STYLES.new;
          return (
            <div key={q.id} onClick={() => setSelected(q)} style={{ padding:"14px 20px", borderBottom:`1px solid ${C.border}`, cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#1a1a1a")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                <div style={{ width:36, height:36, borderRadius:"50%", background:C.accentDim, display:"flex", alignItems:"center", justifyContent:"center", color:C.accent, fontWeight:700, fontSize:".9rem", flexShrink:0 }}>
                  {q.customer_name[0]}
                </div>
                <div>
                  <div style={{ fontWeight:600, color:C.text, fontSize:".9rem" }}>{q.customer_name}</div>
                  <div style={{ fontSize:".75rem", color:C.muted }}>{q.customer_address}</div>
                </div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:16, flexShrink:0 }}>
                <span style={{ fontSize:".7rem", fontWeight:700, color:s.color, background:s.bg, padding:"4px 10px", borderRadius:20 }}>{s.label}</span>
                <span style={{ color:C.accent, fontWeight:700 }}>${q.final_price || q.estimated_min}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ── QUOTES ──────────────────────────────────────────────────────────────────
  const Quotes = () => {
    const statuses = ["all","new","reviewed","quoted","booked","completed","cancelled"];
    return (
      <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
        <div style={{ fontSize:"1.4rem", fontWeight:800, color:C.text }}>All Quote Requests</div>

        {/* Filter chips */}
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          {statuses.map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding:"7px 16px", borderRadius:20, border:`1px solid ${filter===f ? C.accent : C.border}`, background:filter===f ? C.accentDim : "transparent", color:filter===f ? C.accent : C.muted, fontSize:".78rem", fontWeight:600, cursor:"pointer", textTransform:"capitalize" as const }}>
              {f.replace("_"," ")}
            </button>
          ))}
        </div>

        {/* Quote list */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, overflow:"hidden" }}>
          {filteredQuotes.length === 0 ? (
            <div style={{ padding:40, textAlign:"center", color:C.muted }}>No quotes found.</div>
          ) : filteredQuotes.map(q => {
            const s = STATUS_STYLES[q.status] || STATUS_STYLES.new;
            return (
              <div key={q.id} onClick={() => setSelected(q)} style={{ padding:"16px 20px", borderBottom:`1px solid ${C.border}`, cursor:"pointer", display:"grid", gridTemplateColumns:"1fr 1.5fr 100px 90px", gap:16, alignItems:"center" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#1a1a1a")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <div>
                  <div style={{ fontWeight:600, color:C.text }}>{q.customer_name}</div>
                  <div style={{ fontSize:".75rem", color:C.muted, marginTop:2 }}>{q.customer_phone}</div>
                </div>
                <div style={{ fontSize:".8rem", color:C.muted, lineHeight:1.4 }}>{q.ai_description?.slice(0,70)}...</div>
                <span style={{ fontSize:".7rem", fontWeight:700, color:s.color, background:s.bg, padding:"4px 10px", borderRadius:20, textAlign:"center" as const }}>{s.label}</span>
                <span style={{ color:C.accent, fontWeight:700, textAlign:"right" as const }}>${q.final_price || q.estimated_min}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ── SETTINGS ────────────────────────────────────────────────────────────────
  const Analytics = () => {
  const total        = quotes.length;
  const booked       = quotes.filter(q => q.status === "booked" || q.status === "completed").length;
  const completed    = quotes.filter(q => q.status === "completed").length;
  const cancelled    = quotes.filter(q => q.status === "cancelled").length;
  const conversion   = total ? Math.round((booked / total) * 100) : 0;
  const rejectedRate = total ? Math.round((cancelled / total) * 100) : 0;
  const revenue      = quotes.filter(q => q.final_price).reduce((s: number, q: any) => s + (q.final_price || 0), 0);
  const avgTicket    = booked ? Math.round(revenue / booked) : 0;

  const weekly: Record<string, { quotes: number; revenue: number }> = {};
  quotes.forEach(q => {
    const week = new Date(q.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    if (!weekly[week]) weekly[week] = { quotes: 0, revenue: 0 };
    weekly[week].quotes++;
    if (q.final_price) weekly[week].revenue += q.final_price;
  });
  const weeklyData = Object.entries(weekly).slice(-8).reverse();

  const exportCSV = () => {
    const headers = ["Date","Customer","Phone","Email","Address","AI Description","Status","Est Min","Est Max","Final Price"];
    const rows = quotes.map(q => [
      new Date(q.created_at).toLocaleDateString(),
      q.customer_name,
      q.customer_phone,
      q.customer_email,
      q.customer_address,
      `"${(q.ai_description || "").replace(/"/g, "'")}"`,
      q.status,
      q.estimated_min || "",
      q.estimated_max || "",
      q.final_price || "",
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `junkpix-quotes-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const StatBox = ({ label, value, sub, color }: any) => (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"20px 18px" }}>
      <div style={{ fontSize:".65rem", color:C.muted, letterSpacing:".1em", fontFamily:"monospace", marginBottom:8 }}>{label}</div>
      <div style={{ fontSize:"2rem", fontWeight:800, color:color||C.text, lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontSize:".75rem", color:C.muted, marginTop:6 }}>{sub}</div>}
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ fontSize:"1.4rem", fontWeight:800, color:C.text }}>Analytics</div>
        <button onClick={exportCSV} style={{ background:C.accent, color:"#000", border:"none", borderRadius:8, padding:"10px 20px", fontWeight:700, cursor:"pointer", fontSize:".88rem" }}>
          ⬇ Export CSV
        </button>
      </div>

      {/* Key metrics */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16 }}>
        <StatBox label="TOTAL QUOTES"      value={total}          sub="All time"               color={C.accent} />
        <StatBox label="CONVERSION RATE"   value={`${conversion}%`} sub="Quotes → booked"     color={C.green} />
        <StatBox label="AVG TICKET VALUE"  value={`$${avgTicket}`} sub="Booked jobs"           color={C.accent} />
        <StatBox label="TOTAL REVENUE"     value={`$${revenue}`}  sub="Completed + booked"    color={C.green} />
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16 }}>
        <StatBox label="COMPLETED JOBS"    value={completed}      sub="Finished hauls"         />
        <StatBox label="REJECTED / NO-GO"  value={`${rejectedRate}%`} sub="Cancelled quotes"  color={C.red} />
        <StatBox label="NEW REQUESTS"      value={quotes.filter(q=>q.status==="new").length} sub="Awaiting review" color={C.blue} />
        <StatBox label="BOOKED"            value={booked}         sub="Confirmed jobs"         color={C.green} />
      </div>

      {/* Weekly activity */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:24 }}>
        <div style={{ fontWeight:700, color:C.text, marginBottom:20 }}>Weekly Activity</div>
        {weeklyData.length === 0 ? (
          <div style={{ color:C.muted, fontSize:".88rem", textAlign:"center", padding:40 }}>No data yet. Submit some quotes to see activity.</div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
            <div style={{ display:"grid", gridTemplateColumns:"120px 1fr 1fr 100px", gap:16, padding:"8px 0", borderBottom:`1px solid ${C.border}`, marginBottom:8 }}>
              {["Date","Quotes","Revenue",""].map((h,i) => (
                <span key={i} style={{ fontSize:".68rem", color:C.muted, letterSpacing:".08em", fontFamily:"monospace" }}>{h}</span>
              ))}
            </div>
            {weeklyData.map(([week, data]) => (
              <div key={week} style={{ display:"grid", gridTemplateColumns:"120px 1fr 1fr 100px", gap:16, padding:"12px 0", borderBottom:`1px solid ${C.border}`, alignItems:"center" }}>
                <span style={{ fontSize:".84rem", color:C.muted }}>{week}</span>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ height:8, borderRadius:4, background:C.accent, width:`${Math.min(100, data.quotes * 20)}%`, minWidth:4 }} />
                  <span style={{ fontSize:".84rem", color:C.text }}>{data.quotes}</span>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ height:8, borderRadius:4, background:C.green, width:`${Math.min(100, (data.revenue/500)*100)}%`, minWidth: data.revenue ? 4 : 0 }} />
                  <span style={{ fontSize:".84rem", color:C.text }}>${data.revenue}</span>
                </div>
                <span style={{ fontSize:".78rem", color:data.revenue ? C.green : C.muted }}>{data.revenue ? "💰" : "pending"}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status breakdown */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:24 }}>
        <div style={{ fontWeight:700, color:C.text, marginBottom:16 }}>Quote Pipeline</div>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {[
            { label:"New",       count:quotes.filter(q=>q.status==="new").length,       color:C.blue },
            { label:"Reviewed",  count:quotes.filter(q=>q.status==="reviewed").length,  color:C.accent },
            { label:"Quoted",    count:quotes.filter(q=>q.status==="quoted").length,    color:"#a855f7" },
            { label:"Booked",    count:quotes.filter(q=>q.status==="booked").length,    color:C.green },
            { label:"Completed", count:quotes.filter(q=>q.status==="completed").length, color:C.muted },
            { label:"Cancelled", count:quotes.filter(q=>q.status==="cancelled").length, color:C.red },
          ].map(({ label, count, color }) => (
            <div key={label} style={{ display:"flex", alignItems:"center", gap:12 }}>
              <span style={{ fontSize:".82rem", color:C.muted, width:80, flexShrink:0 }}>{label}</span>
              <div style={{ flex:1, height:10, background:C.border, borderRadius:5, overflow:"hidden" }}>
                <div style={{ height:"100%", borderRadius:5, background:color, width:`${total ? (count/total)*100 : 0}%`, transition:"width .3s" }} />
              </div>
              <span style={{ fontSize:".82rem", fontWeight:700, color, width:30, textAlign:"right" }}>{count}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
  const SettingsScreen = () => {
    const [minJob, setMinJob]   = useState(String(operator?.minimum_job || 150));
    const [dump, setDump]       = useState(String(operator?.dump_fee_per_ton || 85));
    const [labor, setLabor]     = useState(String(operator?.labor_rate_per_hour || 25));
    const [crew, setCrew]       = useState(String(operator?.crew_size || 2));
    const [gas, setGas]         = useState(String(operator?.gas_price || 3.50));
    const [margin, setMargin]   = useState(String(operator?.margin_percent || 35));
    const [done, setDone]       = useState(false);

    const save = async () => {
      if (!operator) return;
      setSaving(true);
      const { error } = await supabase.from("operators").update({
        minimum_job: parseInt(minJob),
        dump_fee_per_ton: parseFloat(dump),
        labor_rate_per_hour: parseFloat(labor),
        crew_size: parseInt(crew),
        gas_price: parseFloat(gas),
        margin_percent: parseInt(margin),
      }).eq("id", operator.id);
      setSaving(false);
      if (!error) { setDone(true); setTimeout(() => setDone(false), 2000); }
    };

    const Field = ({ label, value, setter, note }: any) => (
      <div>
        <label style={{ fontSize:".72rem", color:C.muted, letterSpacing:".08em", fontFamily:"monospace", marginBottom:6, display:"block" }}>{label}</label>
        {note && <div style={{ fontSize:".72rem", color:C.muted, marginBottom:6, fontStyle:"italic" }}>{note}</div>}
        <input type="number" value={value} onChange={e => setter(e.target.value)} style={inp} />
      </div>
    );

    return (
      <div style={{ display:"flex", flexDirection:"column", gap:24, maxWidth:520 }}>
        <div style={{ fontSize:"1.4rem", fontWeight:800, color:C.text }}>Settings</div>

        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:24 }}>
          <div style={{ fontWeight:700, color:C.text, marginBottom:4 }}>Business</div>
          <div style={{ fontSize:".82rem", color:C.muted, marginBottom:20 }}>{operator?.business_name} · {operator?.city}, {operator?.state}</div>
          <div style={{ fontSize:".72rem", color:C.muted, marginBottom:4, fontFamily:"monospace" }}>YOUR QUOTE PAGE</div>
          <div style={{ background:C.surface, borderRadius:8, padding:"10px 14px", fontSize:".84rem", color:C.accent, fontFamily:"monospace", marginBottom:0 }}>
            junkpix.com/quote/{operator?.id?.slice(0,8)}
          </div>
        </div>

        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:24, display:"flex", flexDirection:"column", gap:16 }}>
          <div>
            <div style={{ fontWeight:700, color:C.text, marginBottom:4 }}>Pricing Settings</div>
            <div style={{ fontSize:".82rem", color:C.muted }}>Update anytime. Changes apply to all future quotes instantly.</div>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <Field label="MINIMUM JOB ($)"    value={minJob}  setter={setMinJob}  />
            <Field label="DUMP FEE / TON ($)" value={dump}    setter={setDump}    />
            <Field label="LABOR / HOUR ($)"   value={labor}   setter={setLabor}   />
            <Field label="CREW SIZE TODAY"    value={crew}    setter={setCrew}    note="Update daily" />
            <Field label="GAS PRICE ($)"      value={gas}     setter={setGas}     note="Update weekly" />
            <Field label="YOUR MARGIN (%)"    value={margin}  setter={setMargin}  />
          </div>

          <button onClick={save} disabled={saving} style={{ padding:"13px 0", borderRadius:8, border:"none", background:done ? C.green : C.accent, color:"#000", fontWeight:700, cursor:"pointer", fontSize:".95rem" }}>
            {saving ? "Saving..." : done ? "Saved ✓" : "Save Changes"}
          </button>
        </div>

        <button onClick={logout} style={{ padding:"12px 0", borderRadius:8, border:`1px solid rgba(239,68,68,0.3)`, background:"transparent", color:C.red, fontWeight:600, cursor:"pointer", fontSize:".88rem" }}>
          Log Out
        </button>
      </div>
    );
  };

  const SCREENS: Record<string, any> = { overview: Overview, quotes: Quotes, analytics: Analytics, settings: SettingsScreen };
  const Screen = SCREENS[active];

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:C.bg, fontFamily:"system-ui, sans-serif", color:C.text }}>

      {/* Sidebar */}
      <div style={{ width:200, background:C.surface, borderRight:`1px solid ${C.border}`, display:"flex", flexDirection:"column", padding:"24px 14px", gap:4, flexShrink:0 }}>
        <div style={{ padding:"8px 12px", marginBottom:24 }}>
          <div style={{ fontSize:"1.2rem", fontWeight:800 }}>
            <span style={{ color:C.accent }}>Junk</span>
            <span style={{ color:C.text }}>Pix</span>
          </div>
          <div style={{ fontSize:".72rem", color:C.muted, marginTop:2 }}>Operator Dashboard</div>
        </div>

        {NAV.map(item => (
          <button key={item.id} onClick={() => setActive(item.id)} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", borderRadius:8, border:"none", background:active===item.id ? C.accentDim : "transparent", color:active===item.id ? C.accent : C.muted, cursor:"pointer", fontWeight:active===item.id ? 600 : 400, fontSize:".88rem", textAlign:"left" as const }}>
            <span>{item.icon}</span>{item.label}
            {item.id === "quotes" && newCount > 0 && (
              <span style={{ marginLeft:"auto", background:C.accent, color:"#000", borderRadius:10, padding:"2px 7px", fontSize:".68rem", fontWeight:800 }}>{newCount}</span>
            )}
          </button>
        ))}

        <div style={{ marginTop:"auto", paddingTop:20, borderTop:`1px solid ${C.border}` }}>
          <div style={{ padding:"8px 12px" }}>
            <div style={{ fontSize:".82rem", fontWeight:600, color:C.text }}>{operator?.owner_name || "Operator"}</div>
            <div style={{ fontSize:".72rem", color:C.muted, marginTop:2 }}>{operator?.business_name || ""}</div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex:1, padding:32, overflowY:"auto" }}>
        <Screen />
      </div>

      {/* Quote detail modal */}
      {selected && <QuoteModal quote={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}