"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const STATUS_STEPS = [
  { key: "new",       label: "Received",  desc: "Your photos are with the owner",     icon: "📸" },
  { key: "reviewed",  label: "Reviewing", desc: "Owner is reviewing your job",         icon: "🔍" },
  { key: "quoted",    label: "Quoted",    desc: "Your price is ready",                 icon: "💰" },
  { key: "booked",    label: "Booked",    desc: "Job is confirmed and scheduled",      icon: "✅" },
  { key: "completed", label: "Complete",  desc: "Job is done!",                        icon: "🎉" },
];

const C = {
  bg: "#F5F4F0",
  card: "#ffffff",
  border: "#e5e3dc",
  text: "#1a1a18",
  muted: "#888882",
  accent: "#D97B4F",
  green: "#22c55e",
};

export default function StatusPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const [quote, setQuote] = useState<any>(null);
  const [operator, setOperator] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data: q, error: qErr } = await supabase
        .from("quote_requests")
        .select("*")
        .eq("id", id)
        .single();

      if (qErr || !q) {
        setError("Quote not found.");
        setLoading(false);
        return;
      }

      setQuote(q);

      const { data: op } = await supabase
        .from("operators")
        .select("business_name, owner_name, phone")
        .eq("id", q.operator_id)
        .single();

      if (op) setOperator(op);
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) return (
    <div style={{ background:C.bg, minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"system-ui,sans-serif" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ width:36, height:36, border:`2px solid ${C.border}`, borderTopColor:C.accent, borderRadius:"50%", animation:"spin .8s linear infinite", margin:"0 auto 12px" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ color:C.muted, fontSize:".84rem" }}>Loading your quote...</div>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ background:C.bg, minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"system-ui,sans-serif" }}>
      <div style={{ textAlign:"center", color:C.muted }}>
        <div style={{ fontSize:"2rem", marginBottom:12 }}>🔍</div>
        <div style={{ fontWeight:700, color:C.text, marginBottom:8 }}>Quote not found</div>
        <div style={{ fontSize:".84rem" }}>Check your link or contact the operator directly.</div>
      </div>
    </div>
  );

  const currentStepIndex = STATUS_STEPS.findIndex(s => s.key === quote.status);
  const currentStep = STATUS_STEPS[currentStepIndex] || STATUS_STEPS[0];
  const ownerName = operator?.owner_name || operator?.business_name || "the owner";

  return (
    <div style={{ background:C.bg, minHeight:"100vh", fontFamily:"system-ui,sans-serif", padding:20 }}>
      <div style={{ maxWidth:480, margin:"0 auto" }}>

        <div style={{ textAlign:"center", padding:"32px 0 24px" }}>
          <div style={{ fontSize:"1rem", fontWeight:800, color:C.accent, letterSpacing:".1em", marginBottom:8 }}>JUNKPIX</div>
          <div style={{ fontSize:"1.4rem", fontWeight:800, color:C.text }}>Your Quote Status</div>
          <div style={{ fontSize:".84rem", color:C.muted, marginTop:4 }}>Hi {quote.customer_name?.split(" ")[0]} 👋</div>
        </div>

        <div style={{ background:C.accent, borderRadius:12, padding:24, marginBottom:20, textAlign:"center" }}>
          <div style={{ fontSize:"2.5rem", marginBottom:8 }}>{currentStep.icon}</div>
          <div style={{ fontSize:"1.2rem", fontWeight:800, color:"#fff", marginBottom:4 }}>{currentStep.label}</div>
          <div style={{ fontSize:".84rem", color:"rgba(255,255,255,.8)" }}>{currentStep.desc}</div>
        </div>

        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20, marginBottom:20 }}>
          {STATUS_STEPS.filter(s => s.key !== "cancelled").map((step, i) => {
            const isDone = i <= currentStepIndex;
            const isCurrent = i === currentStepIndex;
            return (
              <div key={step.key} style={{ display:"flex", alignItems:"center", gap:12, marginBottom: i < STATUS_STEPS.length - 2 ? 16 : 0 }}>
                <div style={{ width:32, height:32, borderRadius:"50%", background: isDone ? C.accent : C.border, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  {isDone ? <span style={{ color:"#fff", fontSize:".8rem" }}>✓</span> : <span style={{ color:C.muted, fontSize:".75rem" }}>{i+1}</span>}
                </div>
                <div>
                  <div style={{ fontWeight: isCurrent ? 700 : 400, color: isDone ? C.text : C.muted, fontSize:".88rem" }}>{step.label}</div>
                  {isCurrent && <div style={{ fontSize:".75rem", color:C.muted }}>{step.desc}</div>}
                </div>
              </div>
            );
          })}
        </div>

        {(quote.status === "quoted" || quote.status === "booked" || quote.status === "completed") && quote.estimated_min && (
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20, marginBottom:20 }}>
            <div style={{ fontSize:".65rem", color:C.muted, fontFamily:"monospace", letterSpacing:".1em", marginBottom:8 }}>
              {quote.final_price ? "YOUR PRICE" : "ESTIMATED RANGE"}
            </div>
            <div style={{ fontSize:"2rem", fontWeight:800, color:C.accent }}>
              {quote.final_price ? `$${quote.final_price}` : `$${quote.estimated_min} – $${quote.estimated_max}`}
            </div>
          </div>
        )}

        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20, marginBottom:20 }}>
          <div style={{ fontWeight:700, color:C.text, marginBottom:12, fontSize:".9rem" }}>Questions? Contact {ownerName}</div>
          {operator?.phone && (
            <a href={`tel:${operator.phone}`} style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 16px", background:C.bg, borderRadius:8, textDecoration:"none", color:C.text, marginBottom:8 }}>
              <span>📞</span>
              <span style={{ fontSize:".88rem", fontWeight:600 }}>{operator.phone}</span>
            </a>
          )}
          <div style={{ fontSize:".75rem", color:C.muted, marginTop:8 }}>
            Powered by {operator?.business_name}
          </div>
        </div>

        {quote.photo_urls && quote.photo_urls.length > 0 && (
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20, marginBottom:20 }}>
            <div style={{ fontSize:".65rem", color:C.muted, fontFamily:"monospace", letterSpacing:".1em", marginBottom:12 }}>YOUR PHOTOS</div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" as const }}>
              {quote.photo_urls.map((url: string, i: number) => (
                <img key={i} src={url} alt={`Photo ${i+1}`} style={{ width:72, height:72, borderRadius:8, objectFit:"cover" as const }} />
              ))}
            </div>
          </div>
        )}

<button
          onClick={() => window.location.reload()}
          style={{ width:"100%", padding:"12px 0", borderRadius:8, border:`1px solid ${C.border}`, background:"transparent", color:C.muted, cursor:"pointer", fontSize:".84rem", marginBottom:16 }}
        >
          🔄 Refresh Status
        </button>
        <div style={{ textAlign:"center", fontSize:".72rem", color:C.muted, padding:"16px 0" }}>
          Powered by JunkPix · AI Photo Quoting
        </div>

      </div>
    </div>
  );
}