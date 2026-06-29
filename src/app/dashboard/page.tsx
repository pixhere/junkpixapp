"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ReactDOM from "react-dom";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function scoreLead(quote: any) {
  let bookingScore = 0;
  let profitScore = 100;
  const bookingBreakdown: string[] = [];
  const profitBreakdown: string[] = [];
  let isComplex = false;

  const notes = (quote.customer_notes || "").toLowerCase();
  const photoCount = (quote.photo_urls || []).length;
  const minPrice = quote.estimated_min || 0;

  // Booking score
  if (notes.includes("today") || notes.includes("asap") || notes.includes("same day")) {
    bookingScore += 20; bookingBreakdown.push("+20 Same-day request");
  } else if (notes.includes("tomorrow") || notes.includes("next day")) {
    bookingScore += 15; bookingBreakdown.push("+15 Next-day request");
  }
  if (photoCount >= 3) { bookingScore += 15; bookingBreakdown.push(`+15 Multiple photos (${photoCount})`); }
  else if (photoCount >= 1) { bookingScore += 8; bookingBreakdown.push(`+8 Photos uploaded (${photoCount})`); }
  if (quote.customer_notes && quote.customer_notes.length > 30) { bookingScore += 10; bookingBreakdown.push("+10 Detailed notes"); }
  if (quote.customer_name && quote.customer_phone && quote.customer_email && quote.customer_address) { bookingScore += 10; bookingBreakdown.push("+10 Complete information"); }
  if (minPrice >= 300) { bookingScore += 10; bookingBreakdown.push("+10 High value job ($300+)"); }
  else if (minPrice >= 150) { bookingScore += 5; bookingBreakdown.push("+5 Medium value job"); }
  if ((quote.view_count || 0) >= 2) { bookingScore += 10; bookingBreakdown.push("+10 Quote viewed multiple times"); }
  bookingScore = Math.min(100, bookingScore);

  // Profit score
  if (quote.location_type === "basement") { profitScore -= 20; profitBreakdown.push("-20 Basement access"); isComplex = true; }
  if ((quote.stairs || 0) >= 2) { profitScore -= 15; profitBreakdown.push(`-15 Multiple stairs (${quote.stairs} flights)`); isComplex = true; }
  else if ((quote.stairs || 0) === 1) { profitScore -= 8; profitBreakdown.push("-8 One flight of stairs"); }
  if (quote.distance === "long") { profitScore -= 10; profitBreakdown.push("-10 Long carry distance"); }
  if (quote.condition === "hazard") { profitScore -= 25; profitBreakdown.push("-25 Hoarder/hazard condition"); isComplex = true; }
  if (minPrice < 150 && minPrice > 0) { profitScore -= 15; profitBreakdown.push("-15 Low value job"); }
  if (photoCount === 0) { profitScore -= 20; profitBreakdown.push("-20 No photos"); }
  else if (photoCount === 1) { profitScore -= 10; profitBreakdown.push("-10 Only one photo"); }
  if (!quote.customer_notes || quote.customer_notes.length < 10) { profitScore -= 10; profitBreakdown.push("-10 Missing notes"); }
  if (quote.extras?.includes("heavy") && (quote.location_type === "basement" || (quote.stairs || 0) >= 1)) {
    profitScore -= 10; profitBreakdown.push("-10 Heavy items + stairs"); isComplex = true;
  }
  profitScore = Math.max(0, Math.min(100, profitScore));

  let bookingTier = bookingScore >= 80 ? "hot" : bookingScore >= 50 ? "warm" : "standard";

  return { bookingScore, profitScore, isComplex, bookingTier, breakdown: { booking: bookingBreakdown, profit: profitBreakdown } };
}

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
  { id: "calendar",   label: "Calendar",   icon: "📅" },
  { id: "sales",      label: "Sales",      icon: "🎯" },
  { id: "social",     label: "Social",     icon: "📱" },
  { id: "analytics",  label: "Analytics",  icon: "📊" },
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
  const router = useRouter();
  const [quotes, setQuotes] = useState<any[]>([]);
  const [selected, setSelected]   = useState<any>(null);
  const [operator, setOperator]   = useState<any>(null);
  const [trialExpired, setTrialExpired] = useState(false);
  const [filter, setFilter]       = useState("all");
  const [finalPrice, setFinalPrice] = useState("");
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const scrollRef = React.useRef<number>(0);
  const [settingsTab, setSettingsTab] = useState("business");

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
     if (op) {
        setOperator(op);
        // Check trial status
        if (op.subscription_status === "trial") {
          const trialEnd = op.trial_ends_at
            ? new Date(op.trial_ends_at)
            : new Date(new Date(op.signup_date).getTime() + 30 * 24 * 60 * 60 * 1000);
          if (new Date() > trialEnd) {
            setTrialExpired(true);
          }
        }
      }

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

  // Poll for new quotes every 30 seconds
  const interval = setInterval(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: qs } = await supabase
        .from("quote_requests")
        .select("*")
        .eq("operator_id", user.id)
        .order("created_at", { ascending: false });
      if (qs) setQuotes(qs);
    }
  }, 30000);

  return () => clearInterval(interval);
}, []);


  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };
  // Trial expired paywall
  if (trialExpired) return (
    <div style={{ background:"#0A0A0A", minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:24, fontFamily:"system-ui,sans-serif" }}>
      <div style={{ maxWidth:480, width:"100%", textAlign:"center" as const }}>
        <div style={{ fontSize:"1rem", fontWeight:800, color:"#D97B4F", letterSpacing:".1em", marginBottom:24 }}>JUNKPIX</div>
        <div style={{ fontSize:"2rem", marginBottom:16 }}>⏰</div>
        <div style={{ fontSize:"1.4rem", fontWeight:800, color:"#fff", marginBottom:8 }}>Your free trial has ended</div>
        <div style={{ fontSize:".88rem", color:"rgba(255,255,255,.6)", marginBottom:32, lineHeight:1.6 }}>
          Choose a plan to keep access to your dashboard, quote page, and all AI features.
        </div>

        {[
          { label:"Founding", price:"$49/mo", priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_FOUNDING, badge:"🔥 Nearly sold out", desc:"Locked forever — never goes up" },
          { label:"Standard", price:"$99/mo", priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_STANDARD, badge:"", desc:"Full access, cancel anytime" },
          { label:"Agency", price:"$199/mo", priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_AGENCY, badge:"", desc:"Multiple trucks and operators" },
        ].map(plan => (
          <div key={plan.label} style={{ background:"#1a1a1a", border:"1px solid #333", borderRadius:12, padding:20, marginBottom:12, textAlign:"left" as const }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
              <div>
                <div style={{ fontWeight:700, color:"#fff", fontSize:"1rem" }}>{plan.label} {plan.badge && <span style={{ fontSize:".7rem", color:"#D97B4F" }}>{plan.badge}</span>}</div>
                <div style={{ fontSize:".78rem", color:"rgba(255,255,255,.4)", marginTop:2 }}>{plan.desc}</div>
              </div>
              <div style={{ fontSize:"1.2rem", fontWeight:800, color:"#D97B4F" }}>{plan.price}</div>
            </div>
            <button
              onClick={async () => {
                const res = await fetch("/api/create-checkout", {
                  method:"POST",
                  headers:{"Content-Type":"application/json"},
                  body: JSON.stringify({ priceId: plan.priceId, operatorId: operator?.id, email: operator?.email }),
                });
                const data = await res.json();
                if (data.url) window.location.href = data.url;
              }}
              style={{ width:"100%", padding:"11px 0", borderRadius:8, border:"none", background:"#D97B4F", color:"#000", fontWeight:700, cursor:"pointer", fontSize:".9rem", marginTop:8 }}
            >
              Get Started →
            </button>
          </div>
        ))}

        <button onClick={logout} style={{ marginTop:16, background:"none", border:"none", color:"rgba(255,255,255,.3)", cursor:"pointer", fontSize:".78rem" }}>
          Log out
        </button>
      </div>
    </div>
  );

  const newCount       = quotes.filter(q => q.status === "new").length;
  const bookedCount    = quotes.filter(q => q.status === "booked").length;
  const completedCount = quotes.filter(q => q.status === "completed").length;
  const weekRevenue    = quotes.filter(q => q.final_price).reduce((s: number, q: any) => s + (q.final_price || 0), 0);

  const filteredQuotes = filter === "all" ? quotes : quotes.filter(q => q.status === filter);

  const updateStatus = async (id: string, status: string) => {
    scrollRef.current = window.scrollY;
    const updates: any = { status };
    if (status === "completed") {
      updates.completed_at = new Date().toISOString();
    }
    await supabase.from("quote_requests").update(updates).eq("id", id);
    setQuotes(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q));
    if (selected?.id === id) setSelected((prev: any) => ({ ...prev, ...updates }));
  };

  const sendQuote = async (id: string, price: number) => {
    const quote = quotes.find(q => q.id === id);
    
    // Update in Supabase
    await supabase.from("quote_requests").update({ 
      status: "quoted", 
      final_price: price 
    }).eq("id", id);

    // Update local state
    setQuotes(prev => prev.map(q => q.id === id ? { ...q, status: "quoted", final_price: price } : q));
    if (selected?.id === id) setSelected((prev: any) => ({ ...prev, status: "quoted", final_price: price }));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);

    console.log("Sending quote email to:", quote?.customer_email, "price:", price);
    // Send customer email with price
    if (quote?.customer_email) {
      await fetch("/api/send-customer-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quote: { ...quote, final_price: price },
          operator,
          message: `Great news! We've reviewed your photos and your quote is ready.\n\nYour price: $${price}\n\nReply to this email or call us to book your junk removal.`,
        }),
      });
    }
    
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
  const QuoteModal = ({ quote, onClose }: any) => {
    useEffect(() => {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }, []);
    const s = STATUS_STYLES[quote.status] || STATUS_STYLES.new;
    const [price, setPrice] = useState(String(quote.final_price || quote.estimated_min || ""));

    // AI Replies state
    const [aiReply, setAiReply]           = useState("");
    const [loadingReply, setLoadingReply] = useState(false);
    const [copiedReply, setCopiedReply]   = useState(false);
    const [activeType, setActiveType]     = useState("");

    // Send email state
    const [emailBody, setEmailBody]       = useState("");
    const [sendingEmail, setSendingEmail] = useState(false);
    const [emailSent, setEmailSent]       = useState(false);

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
          {/* Lead Score */}
          {(() => {
            const score = scoreLead(quote);
            const [showBreakdown, setShowBreakdown] = useState(false);
            const tierColor = score.bookingTier === "hot" ? "#ef4444" : score.bookingTier === "warm" ? "#f59e0b" : C.muted;
            const tierIcon = score.bookingTier === "hot" ? "🔥" : score.bookingTier === "warm" ? "🟡" : "⚪";
            return (
              <div style={{ background:C.surface, borderRadius:10, padding:16, marginBottom:16 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                  <div style={{ display:"flex", gap:16, alignItems:"center" }}>
                    <div>
                      <div style={{ fontSize:".65rem", color:C.muted, fontFamily:"monospace", marginBottom:4 }}>BOOKING SCORE</div>
                      <div style={{ fontSize:"1.4rem", fontWeight:800, color:tierColor }}>{tierIcon} {score.bookingScore}/100</div>
                    </div>
                    <div>
                      <div style={{ fontSize:".65rem", color:C.muted, fontFamily:"monospace", marginBottom:4 }}>PROFIT SCORE</div>
                      <div style={{ fontSize:"1.4rem", fontWeight:800, color: score.profitScore >= 70 ? C.green : score.profitScore >= 40 ? "#f59e0b" : C.red }}>{score.profitScore}/100</div>
                    </div>
                    {score.isComplex && (
                      <div style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:8, padding:"6px 12px" }}>
                        <div style={{ fontSize:".65rem", color:C.red, fontWeight:700 }}>🔴 COMPLEX</div>
                        <div style={{ fontSize:".6rem", color:C.red, opacity:0.8 }}>Verify first</div>
                      </div>
                    )}
                  </div>
                  <button onClick={() => setShowBreakdown(!showBreakdown)} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:6, color:C.muted, cursor:"pointer", fontSize:".75rem", padding:"4px 10px" }}>
                    {showBreakdown ? "▲ Hide" : "▼ Why?"}
                  </button>
                </div>
                {showBreakdown && (
                  <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:12, display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                    <div>
                      <div style={{ fontSize:".65rem", color:C.muted, fontFamily:"monospace", marginBottom:8 }}>BOOKING SIGNALS</div>
                      {score.breakdown.booking.map((b, i) => (
                        <div key={i} style={{ fontSize:".75rem", color:C.green, marginBottom:4 }}>{b}</div>
                      ))}
                    </div>
                    <div>
                      <div style={{ fontSize:".65rem", color:C.muted, fontFamily:"monospace", marginBottom:8 }}>PROFIT SIGNALS</div>
                      {score.breakdown.profit.map((b, i) => (
                        <div key={i} style={{ fontSize:".75rem", color:C.red, marginBottom:4 }}>{b}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

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
                      <button
                        onClick={() => setEmailBody(aiReply)}
                        style={{ padding:"9px 14px", borderRadius:8, border:`1px solid ${C.border}`, background:"transparent", color:C.muted, fontWeight:600, cursor:"pointer", fontSize:".82rem" }}
                      >
                        ✉ Use in Email
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
{/* Send Email to Customer */}
          <div style={{ background:C.surface, borderRadius:10, padding:16, marginBottom:16, border:`1px solid rgba(59,130,246,0.15)` }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
              <span>✉️</span>
              <div style={{ fontSize:".7rem", color:C.blue, letterSpacing:".1em", fontFamily:"monospace", fontWeight:700 }}>EMAIL CUSTOMER</div>
              <div style={{ fontSize:".7rem", color:C.muted, marginLeft:"auto" }}>to: {quote.customer_email}</div>
            </div>
            <textarea
              value={emailBody}
              onChange={e => setEmailBody(e.target.value)}
              placeholder="Write your message here, or generate one with AI above then click 'Use in Email'..."
              rows={4}
              style={{ width:"100%", padding:"11px 14px", borderRadius:8, border:`1px solid ${C.border}`, background:C.card, color:C.text, fontSize:".84rem", fontFamily:"inherit", resize:"vertical" as const, boxSizing:"border-box" as const, marginBottom:10, outline:"none" }}
            />
            <div style={{ fontSize:".72rem", color:C.muted, marginBottom:10 }}>
              Quote details (address, price, job description) are automatically added to the email.
            </div>
            <button
              onClick={async () => {
                if (!emailBody.trim()) return;
                setSendingEmail(true);
                try {
                  const res = await fetch("/api/send-customer-email", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ quote, operator, message: emailBody }),
                  });
                  const data = await res.json();
                  if (data.success) { setEmailSent(true); setTimeout(() => setEmailSent(false), 3000); }
                } catch {
                  alert("Failed to send email. Try again.");
                } finally {
                  setSendingEmail(false);
                }
              }}
              disabled={!emailBody.trim() || sendingEmail}
              style={{ width:"100%", padding:"11px 0", borderRadius:8, border:"none", background: emailSent ? "rgba(34,197,94,0.15)" : emailBody.trim() ? C.blue : "rgba(59,130,246,0.3)", color: emailSent ? C.green : emailBody.trim() ? "#fff" : "rgba(255,255,255,0.3)", fontWeight:700, cursor: emailBody.trim() ? "pointer" : "not-allowed", fontSize:".88rem", transition:"all .2s" }}
            >
              {emailSent ? "Email Sent ✓" : sendingEmail ? "Sending..." : "Send Email to Customer"}
            </button>
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
                 onClick={(e) => { e.preventDefault(); price && sendQuote(quote.id, parseInt(price)); }}
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
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div>
          <div style={{ fontSize:"1.5rem", fontWeight:800, color:C.text }}>
            Good morning{operator?.owner_name ? `, ${operator.owner_name.split(" ")[0]}` : ""} 👋
          </div>
          <div style={{ fontSize:".88rem", color:C.muted, marginTop:4 }}>Here's what needs your attention today.</div>
        </div>
        <button onClick={() => router.push("/dashboard/settings")} style={{ background:"none", border:"1px solid #222222", borderRadius:8, color:"#666666", cursor:"pointer", padding:"8px 10px", fontSize:"1.1rem", flexShrink:0 }}>⚙️</button>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16 }} className="stats-grid">
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
            <div key={q.id} onClick={() => router.push(`/dashboard/quote/${q.id}`)} style={{ padding:"16px 20px", borderBottom:`1px solid ${C.border}`, cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center" }}
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
{(() => {
  const score = scoreLead(q);
  const tierColor = score.bookingTier === "hot" ? "#ef4444" : score.bookingTier === "warm" ? "#f59e0b" : C.muted;
  const tierIcon = score.bookingTier === "hot" ? "🔥" : score.bookingTier === "warm" ? "🟡" : "⚪";
  return (
    <div style={{ fontSize:".7rem", color:tierColor, fontWeight:700, marginTop:4 }}>
      {tierIcon} {score.bookingScore}/100
    </div>
  );
})()}
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
            <div key={q.id} onClick={() => router.push(`/dashboard/quote/${q.id}`)} style={{ padding:"14px 20px", borderBottom:`1px solid ${C.border}`, cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center" }}
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
              <div key={q.id} onClick={() => router.push(`/dashboard/quote/${q.id}`)} style={{ padding:"16px 20px", borderBottom:`1px solid ${C.border}`, cursor:"pointer" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#1a1a1a")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
                  <div>
                    <div style={{ fontWeight:600, color:C.text, fontSize:".9rem" }}>{q.customer_name}</div>
                    <div style={{ fontSize:".75rem", color:C.muted, marginTop:2 }}>{q.customer_phone}</div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
                    <span style={{ fontSize:".7rem", fontWeight:700, color:s.color, background:s.bg, padding:"4px 10px", borderRadius:20 }}>{s.label}</span>
                    <span style={{ color:C.accent, fontWeight:700, fontSize:".9rem" }}>
                      {q.final_price ? `$${q.final_price}` : `$${q.estimated_min}–$${q.estimated_max}`}
                    </span>
                  </div>
                </div>
                <div style={{ fontSize:".78rem", color:C.muted, lineHeight:1.4 }}>{q.ai_description?.slice(0,80)}...</div>
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
      <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:12 }} className="stats-grid">
        <StatBox label="TOTAL QUOTES"      value={total}          sub="All time"               color={C.accent} />
        <StatBox label="CONVERSION RATE"   value={`${conversion}%`} sub="Quotes → booked"     color={C.green} />
        <StatBox label="AVG TICKET VALUE"  value={`$${avgTicket}`} sub="Booked jobs"           color={C.accent} />
        <StatBox label="TOTAL REVENUE"     value={`$${revenue}`}  sub="Completed + booked"    color={C.green} />
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:12 }} className="stats-grid">
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
  const SettingsScreen = React.memo(() => {
    const [minJob, setMinJob]   = useState(String(operator?.minimum_job || 150));
    const [dump, setDump]       = useState(String(operator?.dump_fee_per_ton || 85));
    const [labor, setLabor]     = useState(String(operator?.labor_rate_per_hour || 25));
    const [crew, setCrew]       = useState(String(operator?.crew_size || 2));
    const [gas, setGas]         = useState(String(operator?.gas_price || 3.50));
    const [margin, setMargin]   = useState(String(operator?.margin_percent || 35));
    const [dumpConstruction, setDumpConstruction] = useState(String(operator?.dump_fee_construction || 106));
    const [dumpMinimum, setDumpMinimum]             = useState(String(operator?.dump_fee_minimum || 40));
    const [milesToDump, setMilesToDump]             = useState(String(operator?.dump_miles_to_site || 5));
    const [done, setDone]       = useState(false);
    const [connectStatus, setConnectStatus] = useState(operator?.stripe_connect_status || "not_connected");
    const [connectLoading, setConnectLoading] = useState(false);
    const [depositAmount, setDepositAmount] = useState(String(operator?.stripe_connect_deposit_amount || 50));
    const [requireDeposit, setRequireDeposit] = useState(operator?.stripe_connect_require_deposit || false);
    // Load tier pricing
    const [priceMinMin, setPriceMinMin] = useState(String(operator?.price_minimum_min || 150));
    const [priceMinMax, setPriceMinMax] = useState(String(operator?.price_minimum_max || 200));
    const [priceEighthMin, setPriceEighthMin] = useState(String(operator?.price_eighth_min || 200));
    const [priceEighthMax, setPriceEighthMax] = useState(String(operator?.price_eighth_max || 275));
    const [priceQuarterMin, setPriceQuarterMin] = useState(String(operator?.price_quarter_min || 300));
    const [priceQuarterMax, setPriceQuarterMax] = useState(String(operator?.price_quarter_max || 400));
    const [priceHalfMin, setPriceHalfMin] = useState(String(operator?.price_half_min || 475));
    const [priceHalfMax, setPriceHalfMax] = useState(String(operator?.price_half_max || 575));
    const [priceThreeqMin, setPriceThreeqMin] = useState(String(operator?.price_threeq_min || 675));
    const [priceThreeqMax, setPriceThreeqMax] = useState(String(operator?.price_threeq_max || 775));
    const [priceFullMin, setPriceFullMin] = useState(String(operator?.price_full_min || 875));
    const [priceFullMax, setPriceFullMax] = useState(String(operator?.price_full_max || 975));
    const [reviewLink, setReviewLink] = useState(String(operator?.review_link || ""));
    const [ownerName, setOwnerName] = useState(String(operator?.owner_name || ""));
    const [slug, setSlug] = useState(String(operator?.slug || ""));
    const [webhookUrl, setWebhookUrl] = useState(String(operator?.webhook_url || ""));
    const [webhookEnabled, setWebhookEnabled] = useState(operator?.webhook_enabled || false);
    const [formConfig, setFormConfig] = useState<any[]>([]);
    const [loadingConfig, setLoadingConfig] = useState(true);
    const [newItemLabel, setNewItemLabel] = useState("");
    const [newItemPrice, setNewItemPrice] = useState("0");
    const [newItemType, setNewItemType] = useState("extra");
    const [addingItem, setAddingItem] = useState(false);
    useEffect(() => {
      const loadConfig = async () => {
        if (!operator) return;
        const { data } = await supabase
          .from("quote_form_config")
          .select("*")
          .eq("operator_id", operator.id)
          .order("field_type")
          .order("sort_order");
        if (data) setFormConfig(data);
        setLoadingConfig(false);
      };
      loadConfig();
    }, [operator]);

    const save = async () => {
      if (!operator) return;
      setSaving(true);
      const { error } = await supabase.from("operators").update({
        minimum_job: parseInt(minJob),
        dump_fee_per_ton: parseFloat(dump),
        dump_fee_construction: parseFloat(dumpConstruction),
        dump_fee_minimum: parseFloat(dumpMinimum),
        dump_miles_to_site: parseInt(milesToDump),
        labor_rate_per_hour: parseFloat(labor),
        crew_size: parseInt(crew),
        gas_price: parseFloat(gas),
        margin_percent: parseInt(margin),
        review_link: reviewLink,
        owner_name: ownerName,
        slug: slug.toLowerCase().replace(/[^a-z0-9]/g, ""),
        webhook_url: webhookUrl,
        webhook_enabled: webhookEnabled,
        price_minimum_min: parseInt(priceMinMin),
        price_minimum_max: parseInt(priceMinMax),
        price_eighth_min: parseInt(priceEighthMin),
        price_eighth_max: parseInt(priceEighthMax),
        price_quarter_min: parseInt(priceQuarterMin),
        price_quarter_max: parseInt(priceQuarterMax),
        price_half_min: parseInt(priceHalfMin),
        price_half_max: parseInt(priceHalfMax),
        price_threeq_min: parseInt(priceThreeqMin),
        price_threeq_max: parseInt(priceThreeqMax),
        price_full_min: parseInt(priceFullMin),
        price_full_max: parseInt(priceFullMax),
      }).eq("id", operator.id);
      setSaving(false);
      if (!error) { 
        setDone(true); 
        setTimeout(() => setDone(false), 2000);
        // Refresh operator data
        const { data: fresh } = await supabase.from("operators").select("*").eq("id", operator.id).single();
        if (fresh) setOperator(fresh);
      }
    };

    const Field = ({ label, value, setter, note }: any) => (
      <div>
        <label style={{ fontSize:".72rem", color:C.muted, letterSpacing:".08em", fontFamily:"monospace", marginBottom:6, display:"block" }}>{label}</label>
        {note && <div style={{ fontSize:".72rem", color:C.muted, marginBottom:6, fontStyle:"italic" }}>{note}</div>}
        <input key={value} type="number" defaultValue={value} onBlur={e => setter(e.target.value)} style={inp} />
      </div>
    );

    return (
      <div style={{ display:"flex", flexDirection:"column", gap:24, maxWidth:520 }}>
        <div style={{ fontSize:"1.4rem", fontWeight:800, color:C.text }}>Settings</div>

        <div style={{ display:"flex", gap:8, flexWrap:"wrap" as const }}>
          {[
            { id:"business", label:"🏢 Business" },
            { id:"pricing", label:"💰 Pricing" },
            { id:"quoteform", label:"📋 Quote Form" },
            { id:"payments", label:"💳 Payments" },
            { id:"subscription", label:"📦 Subscription" },
            { id:"account", label:"🔐 Account" },
            { id:"support", label:"🆘 Support" },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSettingsTab(tab.id)}
              style={{
                padding:"8px 14px",
                borderRadius:8,
                border:`1px solid ${settingsTab === tab.id ? C.accent : C.border}`,
                background: settingsTab === tab.id ? C.accentDim : "transparent",
                color: settingsTab === tab.id ? C.accent : C.muted,
                fontWeight: settingsTab === tab.id ? 700 : 400,
                cursor:"pointer",
                fontSize:".82rem",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {settingsTab === "business" && <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:24 }}>
          <div style={{ fontWeight:700, color:C.text, marginBottom:4 }}>Business</div>
          <div style={{ fontSize:".82rem", color:C.muted, marginBottom:20 }}>{operator?.business_name} · {operator?.city}, {operator?.state}</div>
          <div style={{ fontSize:".72rem", color:C.muted, marginBottom:4, fontFamily:"monospace" }}>YOUR QUOTE PAGE</div>
          <div style={{ background:C.surface, borderRadius:8, padding:"10px 14px", fontSize:".84rem", color:C.accent, fontFamily:"monospace", marginBottom:0 }}>
            junkpix.com/quote/{operator?.slug || operator?.id?.slice(0,8)}
          </div>
          <div style={{ fontSize:".72rem", color:C.muted, marginTop:16, marginBottom:4, fontFamily:"monospace" }}>YOUR QUOTE PAGE URL</div>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
            <span style={{ color:C.muted, fontSize:".84rem", whiteSpace:"nowrap" as const }}>junkpix.com/quote/</span>
            <input
              type="text"
              value={slug}
              onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ""))}
              style={{ ...inp, marginBottom:0 }}
              placeholder="yourbusiness"
            />
          </div>
          <div style={{ fontSize:".7rem", color:C.muted, fontStyle:"italic", marginBottom:16 }}>
            Letters and numbers only. Share this link with customers.
          </div>
          <div style={{ fontSize:".7rem", color:C.muted, fontStyle:"italic", marginBottom:16 }}>
          </div>

          <div style={{ fontSize:".72rem", color:C.muted, marginTop:16, marginBottom:4, fontFamily:"monospace" }}>YOUR FIRST NAME</div>
          <input
            type="text"
            placeholder="George"
            value={ownerName}
            onChange={e => setOwnerName(e.target.value)}
            style={{ ...inp, marginBottom:4 }}
          />
          <div style={{ fontSize:".7rem", color:C.muted, fontStyle:"italic", marginBottom:16 }}>
            Customers see your name on the quote page and emails
          </div>
          <div style={{ fontSize:".72rem", color:C.muted, marginTop:16, marginBottom:4, fontFamily:"monospace" }}>GOOGLE / YELP REVIEW LINK</div>
          <input
            type="url"
            placeholder="https://g.page/your-business/review"
            value={reviewLink}
            onChange={e => setReviewLink(e.target.value)}
            style={{ ...inp, marginBottom:4 }}
          />
          <div style={{ fontSize:".7rem", color:C.muted, fontStyle:"italic" }}>
            Customers get this link 2 hours after job is marked complete
          </div>
          <div style={{ fontSize:".72rem", color:C.muted, marginTop:16, marginBottom:4, fontFamily:"monospace" }}>WEBHOOK INTEGRATION</div>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
            <div>
              <div style={{ fontSize:".86rem", color:C.text, fontWeight:600 }}>Enable Webhook</div>
              <div style={{ fontSize:".72rem", color:C.muted }}>Fire events to N8N, Zapier, or any tool</div>
            </div>
            <div
              onClick={() => setWebhookEnabled(!webhookEnabled)}
              style={{ width:44, height:24, borderRadius:12, background: webhookEnabled ? C.accent : C.border, cursor:"pointer", position:"relative" as const, transition:"background .2s" }}
            >
              <div style={{ width:20, height:20, borderRadius:"50%", background:"#fff", position:"absolute" as const, top:2, left: webhookEnabled ? 22 : 2, transition:"left .2s" }} />
            </div>
          </div>
          <input
            type="url"
            placeholder="https://your-n8n-instance.com/webhook/junkpix"
            value={webhookUrl}
            onChange={e => setWebhookUrl(e.target.value)}
            style={{ ...inp, marginBottom:4 }}
          />
          <div style={{ fontSize:".7rem", color:C.muted, fontStyle:"italic", marginBottom:16 }}>
            JunkPix will POST to this URL when quotes are submitted or status changes
          </div>
        </div>}

{settingsTab === "pricing" && <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:24, display:"flex", flexDirection:"column", gap:16 }}>          <div>
            <div style={{ fontWeight:700, color:C.text, marginBottom:4 }}>Pricing Settings</div>
            <div style={{ fontSize:".82rem", color:C.muted }}>Update anytime. Changes apply to all future quotes instantly.</div>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <Field label="MINIMUM JOB ($)"    value={minJob}  setter={setMinJob}  />
            <Field label="REGULAR DUMP FEE / TON ($)"      value={dump}             setter={setDump}             />
            <Field label="CONSTRUCTION DUMP FEE / TON ($)" value={dumpConstruction}  setter={setDumpConstruction}  />
            <Field label="MINIMUM DUMP FEE ($)"           value={dumpMinimum}      setter={setDumpMinimum}       />
            <Field label="MILES TO DUMP SITE"             value={milesToDump}      setter={setMilesToDump}       />
            <Field label="LABOR / HOUR ($)"   value={labor}   setter={setLabor}   />
            <Field label="CREW SIZE TODAY"    value={crew}    setter={setCrew}    note="Update daily" />
            <Field label="GAS PRICE ($)"      value={gas}     setter={setGas}     note="Update weekly" />
            <Field label="YOUR MARGIN (%)"    value={margin}  setter={setMargin}  />
          </div>

          <div>
            <div style={{ fontWeight:700, color:C.text, marginBottom:4, marginTop:8 }}>Load Tier Pricing</div>
            <div style={{ fontSize:".82rem", color:C.muted, marginBottom:16 }}>Set your price ranges per load size. AI uses these when estimating jobs.</div>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            {[
              { label:"MINIMUM JOB", min:priceMinMin, setMin:setPriceMinMin, max:priceMinMax, setMax:setPriceMinMax },
              { label:"1/8 LOAD", min:priceEighthMin, setMin:setPriceEighthMin, max:priceEighthMax, setMax:setPriceEighthMax },
              { label:"1/4 LOAD", min:priceQuarterMin, setMin:setPriceQuarterMin, max:priceQuarterMax, setMax:setPriceQuarterMax },
              { label:"1/2 LOAD", min:priceHalfMin, setMin:setPriceHalfMin, max:priceHalfMax, setMax:setPriceHalfMax },
              { label:"3/4 LOAD", min:priceThreeqMin, setMin:setPriceThreeqMin, max:priceThreeqMax, setMax:setPriceThreeqMax },
              { label:"FULL LOAD", min:priceFullMin, setMin:setPriceFullMin, max:priceFullMax, setMax:setPriceFullMax },
            ].map(tier => (
              <div key={tier.label} style={{ background:C.surface, borderRadius:8, padding:12 }}>
                <div style={{ fontSize:".65rem", color:C.muted, fontFamily:"monospace", marginBottom:8 }}>{tier.label}</div>
                <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                  <input type="number" value={tier.min} onChange={e => tier.setMin(e.target.value)} style={{ ...inp, padding:"8px 10px", fontSize:".82rem" }} placeholder="Min" />
                  <span style={{ color:C.muted, fontSize:".8rem", flexShrink:0 }}>–</span>
                  <input type="number" value={tier.max} onChange={e => tier.setMax(e.target.value)} style={{ ...inp, padding:"8px 10px", fontSize:".82rem" }} placeholder="Max" />
                </div>
              </div>
            ))}
          </div>

          <button onClick={save} disabled={saving} style={{ padding:"13px 0", borderRadius:8, border:"none", background:done ? C.green : C.accent, color:"#000", fontWeight:700, cursor:"pointer", fontSize:".95rem" }}>
            {saving ? "Saving..." : done ? "Saved ✓" : "Save Changes"}
          </button>
        </div>}

        {settingsTab === "subscription" && <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:24, marginBottom:16 }}>
          <div style={{ fontWeight:700, color:C.text, marginBottom:4 }}>Subscription</div>
          <div style={{ fontSize:".82rem", color:C.muted, marginBottom:20 }}>
            {operator?.subscription_status === "active" ? "✅ Active subscription" : 
             operator?.subscription_status === "past_due" ? "⚠️ Payment past due" :
             operator?.subscription_status === "cancelled" ? "❌ Subscription cancelled" :
             `🕐 Free trial — ${operator?.trial_ends_at ? Math.max(0, Math.ceil((new Date(operator.trial_ends_at).getTime() - Date.now()) / 86400000)) : 30} days left`}
          </div>
          {operator?.subscription_status !== "active" && (
            <div style={{ display:"flex", flexDirection:"column" as const, gap:10 }}>
              <div style={{ fontSize:".72rem", color:C.muted, fontFamily:"monospace", letterSpacing:".08em", marginBottom:4 }}>CHOOSE YOUR PLAN</div>
              {[
                { label:"Founding Operator", price:"$49/mo", priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_FOUNDING, badge:"🔥 19 spots left" },
                { label:"Standard", price:"$99/mo", priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_STANDARD, badge:"" },
                { label:"Agency / Team", price:"$199/mo", priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_AGENCY, badge:"" },
              ].map((plan) => (
                <button
                  key={plan.label}
                  onClick={async () => {
                    const res = await fetch("/api/create-checkout", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ priceId: plan.priceId, operatorId: operator.id, email: operator.email }),
                    });
                    const data = await res.json();
                    if (data.url) window.location.href = data.url;
                  }}
                  style={{ padding:"12px 16px", borderRadius:8, border:`1px solid ${C.border}`, background:C.surface, color:C.text, fontWeight:600, cursor:"pointer", fontSize:".88rem", display:"flex", justifyContent:"space-between", alignItems:"center" }}
                >
                  <span>{plan.label} {plan.badge && <span style={{ fontSize:".7rem", color:C.accent, marginLeft:6 }}>{plan.badge}</span>}</span>
                  <span style={{ color:C.accent, fontWeight:700 }}>{plan.price}</span>
                </button>
              ))}
            </div>
          )}
        </div>}
        
      {/* Quote Form Settings */}
       {settingsTab === "quoteform" && <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:24, marginBottom:16 }}>
          <div style={{ fontWeight:700, color:C.text, marginBottom:4 }}>Quote Form Options</div>
          <div style={{ fontSize:".82rem", color:C.muted, marginBottom:20 }}>Customize what customers see and set price impacts for each option.</div>

          {loadingConfig ? (
            <div style={{ color:C.muted, fontSize:".84rem" }}>Loading...</div>
          ) : (
            <>
              {["location", "condition", "distance", "extra"].map(fieldType => (
                <div key={fieldType} style={{ marginBottom:24 }}>
                  <div style={{ fontSize:".7rem", color:C.accent, fontFamily:"monospace", letterSpacing:".1em", fontWeight:700, marginBottom:12 }}>
                    {fieldType === "location" ? "📍 LOCATION OPTIONS" :
                     fieldType === "condition" ? "⚠️ CONDITION OPTIONS" :
                     fieldType === "distance" ? "📏 DISTANCE OPTIONS" :
                     "➕ EXTRA CHARGES"}
                  </div>
                  {formConfig.filter(c => c.field_type === fieldType).map(item => (
                    <div key={item.id} style={{ display:"flex", gap:8, alignItems:"center", marginBottom:8 }}>
                      <input
                        type="text"
                        value={item.label}
                        onChange={e => setFormConfig(prev => prev.map(c => c.id === item.id ? { ...c, label: e.target.value } : c))}
                        style={{ ...inp, flex:2, marginBottom:0 }}
                        placeholder="Label"
                      />
                      <div style={{ display:"flex", alignItems:"center", gap:4, flexShrink:0 }}>
                        <span style={{ fontSize:".75rem", color:C.muted }}>+$</span>
                        <input
                          type="number"
                          value={item.price_impact}
                          onChange={e => setFormConfig(prev => prev.map(c => c.id === item.id ? { ...c, price_impact: parseInt(e.target.value) || 0 } : c))}
                          style={{ ...inp, width:70, marginBottom:0 }}
                          placeholder="0"
                        />
                      </div>
                      <button
                        onClick={async () => {
                          await supabase.from("quote_form_config").delete().eq("id", item.id);
                          setFormConfig(prev => prev.filter(c => c.id !== item.id));
                        }}
                        style={{ padding:"8px 12px", borderRadius:6, border:`1px solid rgba(239,68,68,0.3)`, background:"transparent", color:C.red, cursor:"pointer", fontSize:".8rem", flexShrink:0 }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              ))}

              <button
                onClick={async () => {
                  for (const item of formConfig) {
                    await supabase.from("quote_form_config").update({
                      label: item.label,
                      price_impact: item.price_impact,
                    }).eq("id", item.id);
                  }
                  setSaved(true);
                  setTimeout(() => setSaved(false), 2000);
                }}
                style={{ width:"100%", padding:"11px 0", borderRadius:8, border:"none", background:C.accent, color:"#000", fontWeight:700, cursor:"pointer", fontSize:".88rem", marginBottom:16 }}
              >
                Save Form Options
              </button>

              <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:16 }}>
                <div style={{ fontSize:".7rem", color:C.muted, fontFamily:"monospace", marginBottom:10 }}>ADD NEW OPTION</div>
                <div style={{ display:"flex", gap:8, marginBottom:8 }}>
                  <select
                    value={newItemType}
                    onChange={e => setNewItemType(e.target.value)}
                    style={{ ...inp, flex:1, marginBottom:0 }}
                  >
                    <option value="location">Location</option>
                    <option value="condition">Condition</option>
                    <option value="distance">Distance</option>
                    <option value="extra">Extra Charge</option>
                  </select>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <input
                    type="text"
                    value={newItemLabel}
                    onChange={e => setNewItemLabel(e.target.value)}
                    style={{ ...inp, flex:2, marginBottom:0 }}
                    placeholder="e.g. Tight hallway"
                  />
                  <div style={{ display:"flex", alignItems:"center", gap:4, flexShrink:0 }}>
                    <span style={{ fontSize:".75rem", color:C.muted }}>+$</span>
                    <input
                      type="number"
                      value={newItemPrice}
                      onChange={e => setNewItemPrice(e.target.value)}
                      style={{ ...inp, width:70, marginBottom:0 }}
                      placeholder="0"
                    />
                  </div>
                  <button
                    onClick={async () => {
                      if (!newItemLabel.trim() || !operator) return;
                      setAddingItem(true);
                      const { data } = await supabase.from("quote_form_config").insert({
                        operator_id: operator.id,
                        field_type: newItemType,
                        label: newItemLabel,
                        value: newItemLabel.toLowerCase().replace(/\s+/g, "_"),
                        price_impact: parseInt(newItemPrice) || 0,
                        sort_order: formConfig.filter(c => c.field_type === newItemType).length + 1,
                      }).select().single();
                      if (data) setFormConfig(prev => [...prev, data]);
                      setNewItemLabel("");
                      setNewItemPrice("0");
                      setAddingItem(false);
                    }}
                    disabled={!newItemLabel.trim() || addingItem}
                    style={{ padding:"8px 16px", borderRadius:8, border:"none", background:newItemLabel.trim() ? C.green : "rgba(34,197,94,0.3)", color:"#000", fontWeight:700, cursor:newItemLabel.trim() ? "pointer" : "not-allowed", fontSize:".82rem", flexShrink:0 }}
                  >
                    + Add
                  </button>
                </div>
              </div>
            </>
          )}
       </div>}
        {/* Payments / Stripe Connect */}
        {settingsTab === "payments" && <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:24, marginBottom:16 }}>
          <div style={{ fontWeight:700, color:C.text, marginBottom:4 }}>💳 Payments</div>
          <div style={{ fontSize:".82rem", color:C.muted, marginBottom:20 }}>
            Connect your Stripe account to collect deposits directly from customers. Money goes straight to you — JunkPix never touches it.
          </div>

          {connectStatus === "active" ? (
            <div style={{ background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.3)", borderRadius:8, padding:16, marginBottom:16 }}>
              <div style={{ color:C.green, fontWeight:700, fontSize:".88rem" }}>✅ Stripe Connected</div>
              <div style={{ color:C.muted, fontSize:".78rem", marginTop:4 }}>You're ready to collect deposits from customers.</div>
            </div>
          ) : (
            <button
              onClick={async () => {
                setConnectLoading(true);
                try {
                  const res = await fetch("/api/stripe-connect/onboard", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ operatorId: operator?.id, email: operator?.email }),
                  });
                  const data = await res.json();
                  if (data.url) window.location.href = data.url;
                } catch {
                  setConnectLoading(false);
                }
              }}
              disabled={connectLoading}
              style={{ width:"100%", padding:"13px 0", borderRadius:8, border:"none", background: connectLoading ? "rgba(217,123,79,0.3)" : C.accent, color: connectLoading ? "rgba(0,0,0,0.3)" : "#000", fontWeight:700, cursor: connectLoading ? "not-allowed" : "pointer", fontSize:".9rem", marginBottom:16 }}
            >
              {connectLoading ? "Connecting..." : "Connect Your Stripe Account →"}
            </button>
          )}

          <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:16, marginTop:4 }}>
            <div style={{ fontSize:".7rem", color:C.muted, fontFamily:"monospace", marginBottom:12 }}>DEPOSIT SETTINGS</div>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
              <div>
                <div style={{ fontSize:".86rem", color:C.text, fontWeight:600 }}>Require deposit at booking</div>
                <div style={{ fontSize:".75rem", color:C.muted }}>Customer pays before job is confirmed</div>
              </div>
              <div
                onClick={() => setRequireDeposit(!requireDeposit)}
                style={{ width:44, height:24, borderRadius:12, background: requireDeposit ? C.accent : C.border, cursor:"pointer", position:"relative" as const, transition:"background .2s" }}
              >
                <div style={{ width:20, height:20, borderRadius:"50%", background:"#fff", position:"absolute" as const, top:2, left: requireDeposit ? 22 : 2, transition:"left .2s" }} />
              </div>
            </div>
            <div style={{ fontSize:".7rem", color:C.muted, fontFamily:"monospace", marginBottom:6 }}>DEPOSIT AMOUNT ($)</div>
            <input
              type="number"
              value={depositAmount}
              onChange={e => setDepositAmount(e.target.value)}
              style={{ ...inp, marginBottom:12 }}
              placeholder="50"
            />
            <button
              onClick={async () => {
                await supabase.from("operators").update({
                  stripe_connect_deposit_amount: parseInt(depositAmount),
                  stripe_connect_require_deposit: requireDeposit,
                }).eq("id", operator.id);
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
              }}
              style={{ width:"100%", padding:"11px 0", borderRadius:8, border:"none", background: C.accent, color:"#000", fontWeight:700, cursor:"pointer", fontSize:".88rem" }}
            >
              {saved ? "Saved ✓" : "Save Payment Settings"}
            </button>
          </div>
       </div>}

        {settingsTab === "support" && (
          <div>
            <div style={{ fontSize:"1rem", fontWeight:700, color:C.text, marginBottom:8 }}>Support & Help</div>
            <div style={{ fontSize:".84rem", color:C.muted, marginBottom:20 }}>Need help? Our team is here for you.</div>

            <div style={{ background:C.surface, borderRadius:12, padding:20, marginBottom:16, border:`1px solid ${C.border}` }}>
              <div style={{ fontWeight:700, color:C.text, marginBottom:4 }}>📧 Email Support</div>
              <div style={{ fontSize:".84rem", color:C.muted, marginBottom:12 }}>We typically respond within a few hours.</div>
              <a href="mailto:junkpixapp@gmail.com" style={{ display:"inline-block", padding:"10px 20px", borderRadius:8, background:C.accent, color:"#000", fontWeight:700, fontSize:".88rem", textDecoration:"none" }}>
                Email Us →
              </a>
            </div>

            <div style={{ background:C.surface, borderRadius:12, padding:20, marginBottom:16, border:`1px solid ${C.border}` }}>
              <div style={{ fontWeight:700, color:C.text, marginBottom:4 }}>💬 Feature Requests</div>
              <div style={{ fontSize:".84rem", color:C.muted, marginBottom:12 }}>Have an idea to make JunkPix better? We want to hear it.</div>
              <a href="mailto:junkpixapp@gmail.com?subject=Feature Request" style={{ display:"inline-block", padding:"10px 20px", borderRadius:8, border:`1px solid ${C.border}`, background:"transparent", color:C.text, fontWeight:700, fontSize:".88rem", textDecoration:"none" }}>
                Send Idea →
              </a>
            </div>

            <div style={{ background:C.surface, borderRadius:12, padding:20, border:`1px solid ${C.border}` }}>
              <div style={{ fontWeight:700, color:C.text, marginBottom:4 }}>🐛 Report a Bug</div>
              <div style={{ fontSize:".84rem", color:C.muted, marginBottom:12 }}>Something not working right? Let us know.</div>
              <a href="mailto:junkpixapp@gmail.com?subject=Bug Report" style={{ display:"inline-block", padding:"10px 20px", borderRadius:8, border:`1px solid rgba(239,68,68,0.3)`, background:"transparent", color:C.red, fontWeight:700, fontSize:".88rem", textDecoration:"none" }}>
                Report Bug →
              </a>
            </div>
          </div>
        )}

        {settingsTab === "account" && <button onClick={logout} style={{ padding:"12px 0", borderRadius:8, border:`1px solid rgba(239,68,68,0.3)`, background:"transparent", color:C.red, fontWeight:600, cursor:"pointer", fontSize:".88rem" }}>
          Log Out
        </button>}
      </div>
    );
  });
  
  // ── SOCIAL MEDIA ────────────────────────────────────────────────────────────
  const SocialScreen = () => {
    const [selectedQuote, setSelectedQuote] = useState<any>(null);
    const [generating, setGenerating] = useState(false);
    const [posts, setPosts] = useState<any>(null);
    const [copied, setCopied] = useState("");

    const completedQuotes = quotes.filter(q => q.status === "completed" || q.status === "booked");

    const generate = async (quote: any) => {
      setSelectedQuote(quote);
      setGenerating(true);
      setPosts(null);
      setCopied("");
      try {
        const res = await fetch("/api/generate-social", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quote, operator }),
        });
        const data = await res.json();
        setPosts(data.posts);
      } catch {
        setPosts(null);
      } finally {
        setGenerating(false);
      }
    };

    const copy = (text: string, key: string) => {
      navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(""), 2000);
    };

    const platforms = [
      { key: "google", label: "Google Business", icon: "🔍", tip: "City + keywords = local SEO" },
      { key: "instagram", label: "Instagram", icon: "📸", tip: "Visual, energetic, transformation" },
      { key: "facebook", label: "Facebook", icon: "👥", tip: "Community focused, friendly" },
    ];

    return (
      <div style={{ display:"flex", flexDirection:"column" as const, gap:24 }}>
        <div>
          <div style={{ fontSize:"1.4rem", fontWeight:800, color:C.text }}>Social Media</div>
          <div style={{ fontSize:".84rem", color:C.muted, marginTop:4 }}>Turn completed jobs into content. AI writes the post — you copy and paste.</div>
        </div>

        {/* Job selector */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20 }}>
          <div style={{ fontSize:".7rem", color:C.muted, fontFamily:"monospace", letterSpacing:".1em", marginBottom:14 }}>SELECT A COMPLETED JOB</div>
          {completedQuotes.length === 0 ? (
            <div style={{ color:C.muted, fontSize:".88rem", textAlign:"center" as const, padding:"20px 0" }}>
              No completed or booked jobs yet. Mark a job as Booked or Completed to generate posts.
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column" as const, gap:8 }}>
              {completedQuotes.map(q => (
                <div key={q.id}>
                  <button
                    onClick={() => generate(q)}
                    disabled={generating}
                    style={{
                      width:"100%",
                      padding:"14px 16px",
                      borderRadius:8,
                      border:`1px solid ${selectedQuote?.id === q.id ? C.accent : C.border}`,
                      background: selectedQuote?.id === q.id ? C.accentDim : C.surface,
                      color:C.text,
                      cursor:"pointer",
                      textAlign:"left" as const,
                      display:"flex",
                      justifyContent:"space-between",
                      alignItems:"center",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight:600, fontSize:".9rem" }}>{q.customer_name}</div>
                      <div style={{ fontSize:".75rem", color:C.muted, marginTop:2 }}>{q.ai_description?.slice(0, 60)}...</div>
                    </div>
                    <div style={{ fontSize:".78rem", color:C.accent, fontWeight:700, flexShrink:0, marginLeft:12 }}>
                      ${q.final_price || q.estimated_min}
                    </div>
                  </button>
                  {selectedQuote?.id === q.id && generating && (
                    <div style={{ padding:"16px", background:C.card, border:`1px solid ${C.border}`, borderTop:"none", borderRadius:"0 0 8px 8px", display:"flex", alignItems:"center", gap:10 }}>
                      <div style={{ width:18, height:18, border:`2px solid ${C.border}`, borderTopColor:C.accent, borderRadius:"50%", animation:"spin .8s linear infinite", flexShrink:0 }} />
                      <span style={{ color:C.muted, fontSize:".84rem" }}>✨ Generating posts...</span>
                    </div>
                  )}
                  {selectedQuote?.id === q.id && posts && (
                    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderTop:"none", borderRadius:"0 0 8px 8px", padding:16 }}>
                      {Object.entries(posts).map(([platform, post]: any) => (
                        <div key={platform} style={{ marginBottom:16, paddingBottom:16, borderBottom:`1px solid ${C.border}` }}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                            <div style={{ fontSize:".7rem", color:C.accent, fontFamily:"monospace", fontWeight:700 }}>{platform.toUpperCase()}</div>
                            <button onClick={() => { navigator.clipboard.writeText(post); setCopied(platform); setTimeout(() => setCopied(""), 2000); }} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:6, color:C.muted, cursor:"pointer", fontSize:".72rem", padding:"4px 10px" }}>
                              {copied === platform ? "Copied ✓" : "📋 Copy"}
                            </button>
                          </div>
                          <div style={{ fontSize:".82rem", color:C.text, lineHeight:1.6, whiteSpace:"pre-wrap" as const }}>{post}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    );
  };
  
  // ── SALES ACADEMY ───────────────────────────────────────────────────────────
  const SalesScreen = () => {
    const [selectedQuote, setSelectedQuote] = useState<any>(null);
    const [activeTab, setActiveTab] = useState("close");
    const [loading, setLoading] = useState(false);
    const [content, setContent] = useState("");
    const [question, setQuestion] = useState("");
    const [notes, setNotes] = useState<any[]>([]);
    const [newNote, setNewNote] = useState("");
    const [savingNote, setSavingNote] = useState(false);
    const [notesLoaded, setNotesLoaded] = useState(false);
    useEffect(() => {
      if (activeTab === "notes" && !notesLoaded && operator) {
        const loadNotes = async () => {
          const { data } = await supabase
            .from("sales_notes")
            .select("*")
            .eq("operator_id", operator.id)
            .order("created_at", { ascending: false });
          if (data) setNotes(data);
          setNotesLoaded(true);
        };
        loadNotes();
      }
    }, [activeTab, operator, notesLoaded]);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [editingNote, setEditingNote] = useState<any>(null);
    const [editContent, setEditContent] = useState("");

    const NoteCard = ({ note }: { note: any }) => {
      const isCopied = copiedId === note.id;
      const isEditing = editingNote?.id === note.id;

      return (
        <div style={{ background:C.card, border:`1px solid ${isEditing ? C.accent : C.border}`, borderRadius:10, padding:16 }}>
          {isEditing ? (
            <div style={{ display:"flex", flexDirection:"column" as const, gap:10 }}>
              <textarea
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                rows={4}
                style={{ width:"100%", padding:"12px", borderRadius:8, border:`1px solid ${C.border}`, background:C.surface, color:C.text, fontSize:".84rem", fontFamily:"inherit", resize:"vertical" as const, boxSizing:"border-box" as const, outline:"none" }}
              />
              <div style={{ display:"flex", gap:8 }}>
                <button
                  onClick={async () => {
                    await supabase.from("sales_notes").update({ content: editContent }).eq("id", note.id);
                    setNotes(prev => prev.map(n => n.id === note.id ? { ...n, content: editContent } : n));
                    setEditingNote(null);
                  }}
                  style={{ flex:1, padding:"9px 0", borderRadius:8, border:"none", background:C.accent, color:"#000", fontWeight:700, cursor:"pointer", fontSize:".84rem" }}
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingNote(null)}
                  style={{ padding:"9px 16px", borderRadius:8, border:`1px solid ${C.border}`, background:"transparent", color:C.muted, cursor:"pointer", fontSize:".84rem" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12 }}>
              <div style={{ fontSize:".86rem", color:C.text, lineHeight:1.6, flex:1 }}>{note.content}</div>
              <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(note.content);
                    setCopiedId(note.id);
                    setTimeout(() => setCopiedId(null), 2000);
                  }}
                  style={{ padding:"5px 10px", borderRadius:6, border:`1px solid ${isCopied ? "rgba(34,197,94,0.4)" : C.border}`, background: isCopied ? "rgba(34,197,94,0.1)" : "transparent", color: isCopied ? C.green : C.muted, cursor:"pointer", fontSize:".72rem", transition:"all .2s" }}
                >
                  {isCopied ? "✓ Copied" : "📋"}
                </button>
                <button
                  onClick={() => { setEditingNote(note); setEditContent(note.content); }}
                  style={{ padding:"5px 10px", borderRadius:6, border:`1px solid ${C.border}`, background:"transparent", color:C.muted, cursor:"pointer", fontSize:".72rem" }}
                >
                  ✏️
                </button>
                <button
                  onClick={async () => {
                    await supabase.from("sales_notes").delete().eq("id", note.id);
                    setNotes(prev => prev.filter(n => n.id !== note.id));
                  }}
                  style={{ padding:"5px 10px", borderRadius:6, border:`1px solid rgba(239,68,68,0.3)`, background:"transparent", color:C.red, cursor:"pointer", fontSize:".72rem" }}
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>
      );
    };

    const generate = async (type: string, quote?: any) => {
      setLoading(true);
      setContent("");
      localStorage.removeItem(`sales_${type}`);
      try {
        const res = await fetch("/api/sales-coach", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, quote: quote || selectedQuote, operator, question }),
        });

        if (!res.ok) {
          setContent("Something went wrong. Try again.");
          return;
        }

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let full = "";
        setLoading(false);

       while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          full += chunk;
          setContent(full);
        }
        localStorage.setItem(`sales_${activeTab}`, full);
        localStorage.setItem(`sales_${activeTab}_date`, new Date().toDateString());
      } catch {
        setContent("Something went wrong. Try again.");
      } finally {
        setLoading(false);
      }
    };
useEffect(() => {
      const lastTab = localStorage.getItem("sales_last_tab");
      if (lastTab) setActiveTab(lastTab);
    }, []);

   useEffect(() => {
      localStorage.setItem("sales_last_tab", activeTab);
      const today = new Date().toDateString();
      const cachedDate = localStorage.getItem(`sales_${activeTab}_date`);
      const cached = localStorage.getItem(`sales_${activeTab}`);
      
      // For daily tab - expire cache every day
      if (activeTab === "daily" && cachedDate !== today) {
        localStorage.removeItem(`sales_daily`);
        localStorage.removeItem(`sales_daily_date`);
        setContent("");
      } else if (cached) {
        setContent(cached);
      } else {
        setContent("");
      }
    }, [activeTab]);
   const tabs = [
      { id: "close", label: "🎯 Close a Job", desc: "Full closing playbook for a specific lead" },
      { id: "daily", label: "⚡ Daily Intel", desc: "Today's sales lesson from the masters" },
      { id: "academy", label: "📚 Sales Academy", desc: "Books, curriculum, daily habits" },
      { id: "ask", label: "💬 Ask the Coach", desc: "Ask anything about sales or business" },
      { id: "notes", label: "📝 Notes", desc: "Save your favorite lines and scripts" },
    ];

    const activeQuotes = quotes.filter(q => q.status === "new" || q.status === "reviewed" || q.status === "quoted");

    return (
      <div style={{ display:"flex", flexDirection:"column" as const, gap:24 }}>
        <div>
          <div style={{ fontSize:"1.4rem", fontWeight:800, color:C.text }}>Sales Academy</div>
          <div style={{ fontSize:".84rem", color:C.muted, marginTop:4 }}>
            Powered by 15 of the greatest sales minds across 100 years. Grant Cardone · Alex Hormozi · Chris Voss · Mary Kay Ash · Estée Lauder · Napoleon Hill · and more.
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" as const }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); if (tab.id === "notes") setNotesLoaded(false); }}
              style={{
                padding:"10px 16px",
                borderRadius:10,
                border:`1px solid ${activeTab === tab.id ? C.accent : C.border}`,
                background: activeTab === tab.id ? C.accentDim : "transparent",
                color: activeTab === tab.id ? C.accent : C.muted,
                fontWeight: activeTab === tab.id ? 700 : 400,
                cursor:"pointer",
                fontSize:".84rem",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Close a Job */}
        {activeTab === "close" && (
          <div style={{ display:"flex", flexDirection:"column" as const, gap:16 }}>
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20 }}>
              <div style={{ fontSize:".7rem", color:C.muted, fontFamily:"monospace", letterSpacing:".1em", marginBottom:14 }}>SELECT A LEAD TO CLOSE</div>
              {activeQuotes.length === 0 ? (
                <div style={{ color:C.muted, fontSize:".84rem" }}>No active leads. New, reviewed, or quoted jobs will appear here.</div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column" as const, gap:8 }}>
                  {activeQuotes.map(q => (
                    <button
                      key={q.id}
                      onClick={() => setSelectedQuote(q)}
                      style={{
                        padding:"14px 16px",
                        borderRadius:8,
                        border:`1px solid ${selectedQuote?.id === q.id ? C.accent : C.border}`,
                        background: selectedQuote?.id === q.id ? C.accentDim : C.surface,
                        color:C.text,
                        cursor:"pointer",
                        textAlign:"left" as const,
                        display:"flex",
                        justifyContent:"space-between",
                        alignItems:"center",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight:600, fontSize:".9rem" }}>{q.customer_name}</div>
                        <div style={{ fontSize:".75rem", color:C.muted, marginTop:2 }}>{q.ai_description?.slice(0,60)}...</div>
                      </div>
                      <div style={{ textAlign:"right" as const, flexShrink:0, marginLeft:12 }}>
                        <div style={{ color:C.accent, fontWeight:700, fontSize:".9rem" }}>${q.estimated_min}-${q.estimated_max}</div>
                        <div style={{ fontSize:".65rem", color:C.muted }}>
                          {q.booking_score ? `🎯 ${q.booking_score}/100` : ""}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedQuote && (
              <button
                onClick={() => generate("close_job")}
                disabled={loading}
                style={{ padding:"14px 0", borderRadius:10, border:"none", background: loading ? "rgba(217,123,79,0.3)" : C.accent, color: loading ? "rgba(255,255,255,0.4)" : "#000", fontWeight:800, cursor: loading ? "not-allowed" : "pointer", fontSize:"1rem" }}
              >
                {loading ? "Generating your closing playbook..." : "🎯 Generate Closing Playbook"}
              </button>
            )}
          </div>
        )}

        {/* Daily Intel */}
        {activeTab === "daily" && (
          <button
            onClick={() => generate("daily_intel")}
            disabled={loading}
            style={{ padding:"14px 0", borderRadius:10, border:"none", background: loading ? "rgba(217,123,79,0.3)" : C.accent, color: loading ? "rgba(255,255,255,0.4)" : "#000", fontWeight:800, cursor: loading ? "not-allowed" : "pointer", fontSize:"1rem" }}
          >
            {loading ? "Pulling today's intel..." : "⚡ Get Today's Sales Intel"}
          </button>
        )}

        {/* Academy */}
        {activeTab === "academy" && (
          <button
            onClick={() => generate("academy")}
            disabled={loading}
            style={{ padding:"14px 0", borderRadius:10, border:"none", background: loading ? "rgba(217,123,79,0.3)" : C.accent, color: loading ? "rgba(255,255,255,0.4)" : "#000", fontWeight:800, cursor: loading ? "not-allowed" : "pointer", fontSize:"1rem" }}
          >
            {loading ? "Building your curriculum..." : "📚 Open Sales Academy"}
          </button>
        )}

        {/* Ask */}
        {activeTab === "ask" && (
          <div style={{ display:"flex", flexDirection:"column" as const, gap:12 }}>
            <textarea
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="Ask anything... 'How do I handle a customer who says they got a cheaper quote?' or 'How do I price a hoarder job?' or 'What's the best way to follow up after no response?'"
              rows={4}
              style={{ width:"100%", padding:"14px", borderRadius:10, border:`1px solid ${C.border}`, background:C.card, color:C.text, fontSize:".88rem", fontFamily:"inherit", resize:"vertical" as const, boxSizing:"border-box" as const, outline:"none" }}
            />
            <button
              onClick={() => question.trim() && generate("ask")}
              disabled={!question.trim() || loading}
              style={{ padding:"14px 0", borderRadius:10, border:"none", background: !question.trim() || loading ? "rgba(217,123,79,0.3)" : C.accent, color: !question.trim() || loading ? "rgba(255,255,255,0.4)" : "#000", fontWeight:800, cursor: !question.trim() || loading ? "not-allowed" : "pointer", fontSize:"1rem" }}
            >
              {loading ? "Thinking..." : "💬 Ask the Coach"}
            </button>
          </div>
        )}
        {/* Notes */}
        {activeTab === "notes" && (
          <div style={{ display:"flex", flexDirection:"column" as const, gap:16 }}>
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20 }}>
              <div style={{ fontSize:".7rem", color:C.muted, fontFamily:"monospace", letterSpacing:".1em", marginBottom:12 }}>ADD A NOTE</div>
              <textarea
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                placeholder="Save a line that works, a closing script, a book lesson, anything you want to remember..."
                rows={3}
                style={{ width:"100%", padding:"12px 14px", borderRadius:8, border:`1px solid ${C.border}`, background:C.surface, color:C.text, fontSize:".84rem", fontFamily:"inherit", resize:"vertical" as const, boxSizing:"border-box" as const, marginBottom:10, outline:"none" }}
              />
              <button
                onClick={async () => {
                  if (!newNote.trim() || !operator) return;
                  setSavingNote(true);
                  const { data } = await supabase.from("sales_notes").insert({
                    operator_id: operator.id,
                    content: newNote.trim(),
                  }).select().single();
                  if (data) setNotes(prev => [data, ...prev]);
                  setNewNote("");
                  setSavingNote(false);
                }}
                disabled={!newNote.trim() || savingNote}
                style={{ width:"100%", padding:"11px 0", borderRadius:8, border:"none", background: newNote.trim() ? C.accent : "rgba(217,123,79,0.3)", color: newNote.trim() ? "#000" : "rgba(255,255,255,0.3)", fontWeight:700, cursor: newNote.trim() ? "pointer" : "not-allowed", fontSize:".88rem" }}
              >
                {savingNote ? "Saving..." : "💾 Save Note"}
              </button>
            </div>

            {notes.length === 0 && notesLoaded ? (
              <div style={{ color:C.muted, fontSize:".84rem", textAlign:"center" as const, padding:24 }}>
                No notes yet. Save your favorite lines and scripts here.
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column" as const, gap:10 }}>
                <div style={{ fontSize:".7rem", color:C.muted, fontFamily:"monospace", letterSpacing:".1em" }}>SAVED NOTES ({notes.length})</div>
                {notes.map(note => (
                <NoteCard key={note.id} note={note} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign:"center" as const, padding:"32px 0", color:C.muted }}>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <div style={{ width:36, height:36, border:`2px solid ${C.border}`, borderTopColor:C.accent, borderRadius:"50%", animation:"spin .8s linear infinite", margin:"0 auto 16px" }} />
            <div style={{ fontSize:".84rem" }}>The masters are thinking...</div>
          </div>
        )}

        {/* Content */}
        {content && !loading && (
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:24 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <div style={{ fontSize:".7rem", color:C.accent, fontFamily:"monospace", fontWeight:700, letterSpacing:".1em" }}>
                ✨ FROM THE MASTERS
              </div>
              <button
                onClick={() => { navigator.clipboard.writeText(content); }}
                style={{ padding:"6px 12px", borderRadius:6, border:`1px solid ${C.border}`, background:"transparent", color:C.muted, cursor:"pointer", fontSize:".75rem" }}
              >
                📋 Copy
              </button>
            </div>
            <div style={{ fontSize:".88rem", color:C.text, lineHeight:1.8, whiteSpace:"pre-wrap" as const, maxHeight:"60vh", overflowY:"auto" as const }}>
              {content}
            </div>
          </div>
        )}
      </div>
    );
  };
  // ── CALENDAR ─────────────────────────────────────────────────────────────────
  const CalendarScreen = () => {
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const scheduledQuotes = quotes.filter(q => q.scheduled_date);

    const getDaysInMonth = (date: Date) => {
      const year = date.getFullYear();
      const month = date.getMonth();
      const firstDay = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      return { firstDay, daysInMonth, year, month };
    };

    const { firstDay, daysInMonth, year, month } = getDaysInMonth(currentMonth);

    const getJobsForDay = (day: number) => {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      return scheduledQuotes.filter(q => q.scheduled_date === dateStr);
    };

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    const selectedJobs = selectedDate ? scheduledQuotes.filter(q => q.scheduled_date === selectedDate) : [];

    const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];

    return (
      <div style={{ display:"flex", flexDirection:"column" as const, gap:20 }}>
        <div>
          <div style={{ fontSize:"1.4rem", fontWeight:800, color:C.text }}>Calendar</div>
          <div style={{ fontSize:".84rem", color:C.muted, marginTop:4 }}>
            {scheduledQuotes.length} job{scheduledQuotes.length !== 1 ? "s" : ""} scheduled
          </div>
        </div>

        {/* Month navigation */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <button onClick={() => setCurrentMonth(new Date(year, month - 1))} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:8, color:C.muted, cursor:"pointer", padding:"6px 12px", fontSize:".84rem" }}>←</button>
            <div style={{ fontWeight:700, color:C.text, fontSize:"1rem" }}>{monthNames[month]} {year}</div>
            <button onClick={() => setCurrentMonth(new Date(year, month + 1))} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:8, color:C.muted, cursor:"pointer", padding:"6px 12px", fontSize:".84rem" }}>→</button>
          </div>

          {/* Day headers */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2, marginBottom:4 }}>
            {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
              <div key={d} style={{ textAlign:"center" as const, fontSize:".65rem", color:C.muted, fontFamily:"monospace", padding:"4px 0" }}>{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2 }}>
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const jobs = getJobsForDay(day);
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;

              return (
                <div
                  key={day}
                  onClick={() => setSelectedDate(dateStr === selectedDate ? null : dateStr)}
                  style={{
                    padding:"6px 4px",
                    borderRadius:8,
                    textAlign:"center" as const,
                    cursor:"pointer",
                    background: isSelected ? C.accentDim : isToday ? "rgba(255,255,255,0.05)" : "transparent",
                    border: isSelected ? `1px solid ${C.accent}` : isToday ? `1px solid rgba(255,255,255,0.1)` : "1px solid transparent",
                  }}
                >
                  <div style={{ fontSize:".82rem", fontWeight: isToday ? 700 : 400, color: isToday ? C.accent : C.text }}>{day}</div>
                  {jobs.length > 0 && (
                    <div style={{ marginTop:2, display:"flex", justifyContent:"center", gap:2, flexWrap:"wrap" as const }}>
                      {jobs.slice(0,3).map((_, j) => (
                        <div key={j} style={{ width:6, height:6, borderRadius:"50%", background:C.accent }} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected day jobs */}
        {selectedDate && (
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20 }}>
            <div style={{ fontSize:".65rem", color:C.muted, fontFamily:"monospace", letterSpacing:".1em", marginBottom:12 }}>
              {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric" })}
            </div>
            {selectedJobs.length === 0 ? (
              <div style={{ color:C.muted, fontSize:".84rem" }}>No jobs scheduled this day.</div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column" as const, gap:10 }}>
                {selectedJobs.map(q => (
                  <div
                    key={q.id}
                    onClick={() => router.push(`/dashboard/quote/${q.id}`)}
                    style={{ padding:"14px 16px", borderRadius:8, background:C.surface, border:`1px solid ${C.border}`, cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center" }}
                  >
                    <div>
                      <div style={{ fontWeight:600, color:C.text, fontSize:".9rem" }}>{q.customer_name}</div>
                      <div style={{ fontSize:".75rem", color:C.muted, marginTop:2 }}>{q.customer_address}</div>
                      {q.scheduled_time && <div style={{ fontSize:".75rem", color:C.accent, marginTop:2 }}>⏰ {q.scheduled_time}</div>}
                      {q.schedule_notes && <div style={{ fontSize:".72rem", color:C.muted, marginTop:2 }}>{q.schedule_notes}</div>}
                    </div>
                    <div style={{ textAlign:"right" as const, flexShrink:0, marginLeft:12 }}>
                      <div style={{ color:C.accent, fontWeight:700 }}>${q.final_price || q.estimated_min}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Upcoming jobs */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20 }}>
          <div style={{ fontSize:".65rem", color:C.muted, fontFamily:"monospace", letterSpacing:".1em", marginBottom:12 }}>UPCOMING JOBS</div>
          {scheduledQuotes.length === 0 ? (
            <div style={{ color:C.muted, fontSize:".84rem" }}>No jobs scheduled yet. Schedule a booked job from the quote detail page.</div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column" as const, gap:10 }}>
              {scheduledQuotes
                .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime())
                .slice(0, 10)
                .map(q => (
                  <div
                    key={q.id}
                    onClick={() => router.push(`/dashboard/quote/${q.id}`)}
                    style={{ padding:"14px 16px", borderRadius:8, background:C.surface, border:`1px solid ${C.border}`, cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center" }}
                  >
                    <div>
                      <div style={{ fontWeight:600, color:C.text, fontSize:".9rem" }}>{q.customer_name}</div>
                      <div style={{ fontSize:".75rem", color:C.muted, marginTop:2 }}>{q.customer_address}</div>
                      <div style={{ fontSize:".75rem", color:C.accent, marginTop:2 }}>
                        📅 {new Date(q.scheduled_date + "T12:00:00").toLocaleDateString("en-US", { weekday:"short", month:"short", day:"numeric" })}
                        {q.scheduled_time && ` · ${q.scheduled_time}`}
                      </div>
                    </div>
                    <div style={{ color:C.accent, fontWeight:700, flexShrink:0, marginLeft:12 }}>
                      ${q.final_price || q.estimated_min}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    );
  };
const SCREENS: Record<string, any> = { overview: Overview, quotes: Quotes, calendar: CalendarScreen, social: SocialScreen, analytics: Analytics, settings: SettingsScreen };  
  const Screen = SCREENS[active];
  if (active === "sales") { router.push("/dashboard/sales"); return null; }

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:C.bg, fontFamily:"system-ui, sans-serif", color:C.text }}>

      {/* Sidebar — desktop only */}
      <div style={{ width:200, background:C.surface, borderRight:`1px solid ${C.border}`, display:"flex", flexDirection:"column", padding:"24px 14px", gap:4, flexShrink:0 }} className="desktop-sidebar">
        <div style={{ padding:"8px 12px", marginBottom:24 }}>
          <div style={{ fontSize:"1.2rem", fontWeight:800 }}>
            <span style={{ color:C.accent }}>Junk</span>
            <span style={{ color:C.text }}>Pix</span>
          </div>
          <div style={{ fontSize:".72rem", color:C.muted, marginTop:2 }}>Operator Dashboard</div>
        </div>

        {NAV.map(item => (
          <button key={item.id} onClick={() => (item as any).href ? router.push((item as any).href) : setActive(item.id)} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", borderRadius:8, border:"none", background:active===item.id ? C.accentDim : "transparent", color:active===item.id ? C.accent : C.muted, cursor:"pointer", fontWeight:active===item.id ? 600 : 400, fontSize:".88rem", textAlign:"left" as const }}>
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
      <div style={{ flex:1, padding:32, overflowY:"auto", paddingBottom:80 }} className="main-content">
        <Screen />
      </div>

      {/* Quote detail modal */}
      {selected && typeof document !== "undefined" && ReactDOM.createPortal(
        <QuoteModal quote={selected} onClose={() => setSelected(null)} />,
        document.body
      )}
        {/* Bottom nav — mobile only */}
      <div style={{ display:"none" }} className="mobile-nav">
        <style>{`
        @media (max-width: 768px) {
            .desktop-sidebar { display: none !important; }
            .mobile-nav { display: flex !important; position: fixed; bottom: 0; left: 0; right: 0; background: #111111; border-top: 1px solid #222222; padding: 8px 0 24px; z-index: 50; justify-content: space-around; align-items: center; }
            .main-content { padding: 16px !important; padding-bottom: 90px !important; }
            .stats-grid { grid-template-columns: repeat(2,1fr) !important; }
          }
        `}</style>
       {[
          { id:"overview",  label:"Home",      icon:"▦" },
          { id:"quotes",    label:"Quotes",    icon:"📋" },
          { id:"calendar",  label:"Calendar",  icon:"📅" },
          { id:"sales",     label:"Sales",     icon:"🎯" },
          { id:"social",    label:"Social",    icon:"📱" },
          { id:"analytics", label:"Analytics", icon:"📊" },
        ].map(item => (
          <button key={item.id} onClick={() => (item as any).href ? router.push((item as any).href) : setActive(item.id)} style={{ background:"none", border:"none", color: active===item.id ? C.accent : C.muted, cursor:"pointer", display:"flex", flexDirection:"column" as const, alignItems:"center", gap:4, padding:"4px 16px", position:"relative" as const }}>
            <span style={{ fontSize:"1.3rem" }}>{item.icon}</span>
            <span style={{ fontSize:".6rem", fontWeight: active===item.id ? 700 : 400 }}>{item.label}</span>
            {item.id === "quotes" && newCount > 0 && (
              <span style={{ position:"absolute" as const, top:0, right:8, background:C.accent, color:"#000", borderRadius:10, padding:"1px 5px", fontSize:".55rem", fontWeight:800 }}>{newCount}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}