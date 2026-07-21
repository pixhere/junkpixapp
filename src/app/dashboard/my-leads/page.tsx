"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import NavLayout from "@/components/NavLayout";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const C = {
  bg:"#0A0A0A", surface:"#111111", card:"#161616", border:"#222222",
  accent:"#D97B4F", accentDim:"rgba(217,123,79,0.1)", text:"#F0F0F0",
  muted:"#666666", green:"#22c55e", red:"#ef4444",
};

export default function MyLeadsPage() {
  const [leads, setLeads]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [operatorId, setOperatorId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setOperatorId(user.id);
      const { data } = await supabase
        .from("leads")
        .select("*")
        .eq("assigned_operator_id", user.id)
        .order("created_at", { ascending: false });
      if (data) setLeads(data);
      setLoading(false);
    };
    load();
  }, []);

  const markOutcome = async (leadId: string, outcome: "won" | "lost") => {
    await supabase.from("leads").update({
      status: outcome,
      outcome,
      outcome_reported_at: new Date().toISOString(),
    }).eq("id", leadId);
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: outcome } : l));
  };

  if (loading) return (
    <NavLayout active="my-leads">
      <div style={{ padding:24, color:C.muted }}>Loading your leads...</div>
    </NavLayout>
  );

  return (
    <NavLayout active="my-leads">
      <div style={{ padding:24, maxWidth:640 }}>
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:"1.4rem", fontWeight:800, color:C.text }}>🌐 My Leads</div>
          <div style={{ fontSize:".84rem", color:C.muted, marginTop:4 }}>Leads assigned to you by JunkPix. Mark each outcome after contacting the customer.</div>
        </div>

        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:24 }}>
          {[
            { label:"Total", value: leads.length, color: C.text },
            { label:"Won", value: leads.filter(l => l.status === "won").length, color: C.green },
            { label:"Pending", value: leads.filter(l => l.status === "assigned").length, color: C.accent },
          ].map(s => (
            <div key={s.label} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:16, textAlign:"center" }}>
              <div style={{ fontSize:".65rem", color:C.muted, fontFamily:"monospace", marginBottom:4 }}>{s.label.toUpperCase()}</div>
              <div style={{ fontSize:"1.6rem", fontWeight:800, color:s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Billing info */}
        <div style={{ background:C.accentDim, border:`1px solid ${C.accent}`, borderRadius:12, padding:16, marginBottom:24 }}>
          <div style={{ fontSize:".82rem", color:C.text, lineHeight:1.7 }}>
            💰 <strong>How billing works:</strong> Won job = <strong style={{ color:C.green }}>$25</strong> · Didn't book = <strong style={{ color:C.muted }}>$5</strong><br/>
            Billed automatically every 2 weeks to your card on file.
          </div>
        </div>

        {leads.length === 0 ? (
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:40, textAlign:"center" }}>
            <div style={{ fontSize:"2rem", marginBottom:8 }}>🌐</div>
            <div style={{ color:C.muted, fontSize:".88rem" }}>No leads assigned yet. JunkPix will notify you when a lead is available in your area.</div>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {leads.map(lead => (
              <div key={lead.id} style={{ background:C.card, border:`1px solid ${lead.status === "won" ? C.green : lead.status === "lost" ? "#333" : C.accent}`, borderRadius:12, padding:20 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                  <div>
                    <div style={{ fontWeight:700, color:C.text, fontSize:"1rem", marginBottom:2 }}>{lead.name}</div>
                    <div style={{ fontSize:".78rem", color:C.muted }}>{lead.city}, {lead.state} {lead.zip}</div>
                    <a href={`tel:${lead.phone}`} style={{ fontSize:".88rem", color:C.accent, textDecoration:"none", fontWeight:700, display:"block", marginTop:4 }}>📞 {lead.phone}</a>
                    {lead.email && <a href={`mailto:${lead.email}`} style={{ fontSize:".78rem", color:C.muted, textDecoration:"none", display:"block", marginTop:2 }}>✉️ {lead.email}</a>}
                  </div>
                  <span style={{ fontSize:".6rem", fontWeight:700, padding:"4px 10px", borderRadius:20, fontFamily:"monospace",
                    background: lead.status === "won" ? "rgba(34,197,94,0.15)" : lead.status === "lost" ? "rgba(102,102,102,0.15)" : C.accentDim,
                    color: lead.status === "won" ? C.green : lead.status === "lost" ? C.muted : C.accent }}>
                    {lead.status?.toUpperCase()}
                  </span>
                </div>

                {lead.description && (
                  <div style={{ fontSize:".82rem", color:C.muted, lineHeight:1.6, marginBottom:12, padding:12, background:"#0A0A0A", borderRadius:8 }}>
                    {lead.description}
                  </div>
                )}

                {lead.ai_description && (
                  <div style={{ fontSize:".78rem", color:C.muted, lineHeight:1.6, marginBottom:12 }}>
                    <span style={{ color:C.accent, fontWeight:700 }}>AI: </span>{lead.ai_description}
                  </div>
                )}

                <div style={{ fontSize:".72rem", color:C.muted, marginBottom:12 }}>
                  Received: {new Date(lead.created_at).toLocaleDateString()}
                </div>

                {lead.status === "assigned" && (
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={() => markOutcome(lead.id, "won")}
                      style={{ flex:1, padding:"10px", borderRadius:8, border:`1px solid ${C.green}`, background:"transparent", color:C.green, fontWeight:700, cursor:"pointer", fontSize:".84rem" }}>
                      ✅ Won — Job Done
                    </button>
                    <button onClick={() => markOutcome(lead.id, "lost")}
                      style={{ flex:1, padding:"10px", borderRadius:8, border:"1px solid #444", background:"transparent", color:C.muted, fontWeight:700, cursor:"pointer", fontSize:".84rem" }}>
                      ❌ Didn't Book
                    </button>
                  </div>
                )}

                {lead.status === "won" && (
                  <div style={{ fontSize:".78rem", color:C.green, fontWeight:600, marginTop:4 }}>
                    ✅ Marked as won — $25 will be billed on your next invoice
                  </div>
                )}

                {lead.status === "lost" && (
                  <div style={{ fontSize:".78rem", color:C.muted, marginTop:4 }}>
                    ❌ Not booked — $5 will be billed on your next invoice
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </NavLayout>
  );
}
