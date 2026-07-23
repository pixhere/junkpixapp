"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const C = {
  bg: "#0F172A",
  card: "#1E2937",
  surface: "#162032",
  border: "#2D3748",
  accent: "#00D4C8",
  accentDim: "rgba(0,212,200,0.1)",
  text: "#F1F5F9",
  muted: "#94A3B8",
  green: "#22C55E",
  red: "#ef4444",
  yellow: "#F59E0B",
};

export default function AdminPage() {
  const router = useRouter();
  const [operators, setOperators] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [tab, setTab] = useState("operators");

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const [{ data: ops }, { data: qs }, { data: ls }] = await Promise.all([
      supabase.from("operators").select("*").order("created_at", { ascending: false }),
      supabase.from("quote_requests").select("operator_id, status, created_at, estimated_min, booking_score").order("created_at", { ascending: false }),
      supabase.from("leads").select("*").order("created_at", { ascending: false }),
    ]);
    if (ops) setOperators(ops);
    if (qs) setQuotes(qs);
    if (ls) setLeads(ls);
    setLoading(false);
  };

  const logout = async () => {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    await supabase.auth.signOut();
    await fetch("/api/admin-logout", { method: "POST" });
    window.location.href = "/admin/login";
  };

  const getOpQuotes = (opId: string) => quotes.filter(q => q.operator_id === opId);
  const getOpLeads = (opId: string) => leads.filter(l => l.assigned_operator_id === opId);

  const totalRevenue = leads.filter(l => l.status === "won").length * 25 + leads.filter(l => l.status === "lost").length * 5;
  const activeOps = operators.filter(o => o.subscription_status === "active" || o.subscription_status === "trial");

  if (loading) return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", color:C.muted, fontFamily:"system-ui" }}>
      Loading admin panel...
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:"system-ui,sans-serif", color:C.text }}>
      
      {/* Header */}
      <div style={{ background:C.card, borderBottom:`1px solid ${C.border}`, padding:"16px 24px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ fontSize:"1.1rem", fontWeight:800, color:C.accent, fontFamily:"monospace", letterSpacing:".1em" }}>JUNKPIX</div>
          <div style={{ fontSize:".72rem", color:C.muted, background:C.surface, border:`1px solid ${C.border}`, borderRadius:6, padding:"3px 8px" }}>ADMIN</div>
        </div>
        <button onClick={logout} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:8, color:C.muted, cursor:"pointer", padding:"6px 14px", fontSize:".82rem" }}>
          Sign Out
        </button>
      </div>

      <div style={{ maxWidth:1200, margin:"0 auto", padding:24 }}>

        {/* KPI Cards */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(180px, 1fr))", gap:12, marginBottom:24 }}>
          {[
            { label:"TOTAL OPERATORS", value: operators.length, color: C.text },
            { label:"ACTIVE / TRIAL", value: activeOps.length, color: C.green },
            { label:"TOTAL QUOTES", value: quotes.length, color: C.accent },
            { label:"TOTAL LEADS", value: leads.length, color: C.accent },
            { label:"LEADS WON", value: leads.filter(l => l.status === "won").length, color: C.green },
            { label:"NETWORK REVENUE", value: `$${totalRevenue}`, color: C.green },
          ].map(k => (
            <div key={k.label} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:16 }}>
              <div style={{ fontSize:".6rem", color:C.muted, fontFamily:"monospace", marginBottom:6 }}>{k.label}</div>
              <div style={{ fontSize:"1.6rem", fontWeight:800, color:k.color }}>{k.value}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", gap:8, marginBottom:20 }}>
          {["operators", "leads", "quotes"].map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding:"8px 18px", borderRadius:8, border:`1px solid ${tab === t ? C.accent : C.border}`, background: tab === t ? C.accentDim : "transparent", color: tab === t ? C.accent : C.muted, cursor:"pointer", fontWeight: tab === t ? 700 : 400, fontSize:".84rem", textTransform:"capitalize" }}>
              {t}
            </button>
          ))}
        </div>

        {/* Operators Tab */}
        {tab === "operators" && (
          <div>
            {selected ? (
              <div>
                <button onClick={() => setSelected(null)} style={{ background:"none", border:"none", color:C.muted, cursor:"pointer", marginBottom:16, fontSize:".84rem" }}>← Back to operators</button>
                <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:24, marginBottom:16 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                    <div>
                      <div style={{ fontSize:"1.3rem", fontWeight:800, color:C.text }}>{selected.business_name}</div>
                      <div style={{ fontSize:".84rem", color:C.muted }}>{selected.owner_name} · {selected.city}, {selected.state}</div>
                      <a href={`mailto:${selected.email}`} style={{ fontSize:".84rem", color:C.accent, textDecoration:"none" }}>{selected.email}</a>
                    </div>
                    <span style={{ padding:"4px 12px", borderRadius:20, fontSize:".7rem", fontWeight:700,
                      background: selected.subscription_status === "active" ? "rgba(34,197,94,0.15)" : selected.subscription_status === "trial" ? "rgba(0,212,200,0.15)" : "rgba(239,68,68,0.15)",
                      color: selected.subscription_status === "active" ? C.green : selected.subscription_status === "trial" ? C.accent : C.red }}>
                      {selected.subscription_status?.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:16 }}>
                    <div style={{ background:C.surface, borderRadius:8, padding:12 }}>
                      <div style={{ fontSize:".6rem", color:C.muted, marginBottom:4 }}>TOTAL QUOTES</div>
                      <div style={{ fontSize:"1.4rem", fontWeight:800, color:C.text }}>{getOpQuotes(selected.id).length}</div>
                    </div>
                    <div style={{ background:C.surface, borderRadius:8, padding:12 }}>
                      <div style={{ fontSize:".6rem", color:C.muted, marginBottom:4 }}>LEADS ASSIGNED</div>
                      <div style={{ fontSize:"1.4rem", fontWeight:800, color:C.text }}>{getOpLeads(selected.id).length}</div>
                    </div>
                    <div style={{ background:C.surface, borderRadius:8, padding:12 }}>
                      <div style={{ fontSize:".6rem", color:C.muted, marginBottom:4 }}>SIGNED UP</div>
                      <div style={{ fontSize:".88rem", fontWeight:700, color:C.text }}>{new Date(selected.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    <a href={`https://junkpix.com/quote/${selected.slug}`} target="_blank" rel="noreferrer"
                      style={{ flex:1, padding:"10px", borderRadius:8, border:`1px solid ${C.border}`, background:"transparent", color:C.text, textDecoration:"none", textAlign:"center", fontSize:".84rem", fontWeight:600 }}>
                      View Quote Page →
                    </a>
                    <a href={`mailto:${selected.email}`}
                      style={{ flex:1, padding:"10px", borderRadius:8, border:"none", background:C.accent, color:"#000", textDecoration:"none", textAlign:"center", fontSize:".84rem", fontWeight:700 }}>
                      Email Operator
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {operators.map(op => (
                  <div key={op.id} onClick={() => setSelected(op)}
                    style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"16px 20px", cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div>
                      <div style={{ fontWeight:700, color:C.text }}>{op.business_name}</div>
                      <div style={{ fontSize:".78rem", color:C.muted }}>{op.owner_name} · {op.city}, {op.state || ""}</div>
                      <div style={{ fontSize:".72rem", color:C.muted, marginTop:2 }}>{op.email}</div>
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6 }}>
                      <span style={{ padding:"3px 10px", borderRadius:20, fontSize:".65rem", fontWeight:700,
                        background: op.subscription_status === "active" ? "rgba(34,197,94,0.15)" : op.subscription_status === "trial" ? "rgba(0,212,200,0.15)" : "rgba(239,68,68,0.15)",
                        color: op.subscription_status === "active" ? C.green : op.subscription_status === "trial" ? C.accent : C.red }}>
                        {op.subscription_status?.toUpperCase()}
                      </span>
                      <div style={{ fontSize:".72rem", color:C.muted }}>{getOpQuotes(op.id).length} quotes</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Leads Tab */}
        {tab === "leads" && (
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {leads.map(lead => (
              <div key={lead.id} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"16px 20px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <div style={{ fontWeight:700, color:C.text }}>{lead.name}</div>
                  <div style={{ fontSize:".78rem", color:C.muted }}>{lead.city}, {lead.state} · {lead.phone}</div>
                  <div style={{ fontSize:".72rem", color:C.muted, marginTop:2 }}>{new Date(lead.created_at).toLocaleDateString()}</div>
                </div>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4 }}>
                  <span style={{ padding:"3px 10px", borderRadius:20, fontSize:".65rem", fontWeight:700,
                    background: lead.status === "won" ? "rgba(34,197,94,0.15)" : lead.status === "lost" ? "rgba(148,163,184,0.15)" : lead.status === "assigned" ? "rgba(0,212,200,0.15)" : "rgba(245,158,11,0.15)",
                    color: lead.status === "won" ? C.green : lead.status === "lost" ? C.muted : lead.status === "assigned" ? C.accent : C.yellow }}>
                    {lead.status?.toUpperCase()}
                  </span>
                  {lead.estimated_min && <span style={{ fontSize:".78rem", color:C.accent, fontWeight:700 }}>${lead.estimated_min}–${lead.estimated_max}</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quotes Tab */}
        {tab === "quotes" && (
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {quotes.slice(0, 50).map((q, i) => {
              const op = operators.find(o => o.id === q.operator_id);
              return (
                <div key={i} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"14px 20px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <div style={{ fontWeight:600, color:C.text, fontSize:".88rem" }}>{op?.business_name || "Unknown operator"}</div>
                    <div style={{ fontSize:".72rem", color:C.muted }}>{new Date(q.created_at).toLocaleDateString()}</div>
                  </div>
                  <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                    {q.booking_score && <span style={{ fontSize:".72rem", color: q.booking_score >= 70 ? C.green : q.booking_score >= 40 ? C.yellow : C.red, fontWeight:700 }}>{q.booking_score}/100</span>}
                    <span style={{ fontSize:".72rem", color:C.accent, fontWeight:700 }}>{q.estimated_min ? `$${q.estimated_min}` : "—"}</span>
                    <span style={{ padding:"2px 8px", borderRadius:20, fontSize:".6rem", fontWeight:700, background:"rgba(0,212,200,0.1)", color:C.accent }}>{q.status?.toUpperCase()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
