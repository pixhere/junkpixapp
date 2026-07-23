"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import NavLayout from "@/components/NavLayout";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const C = {
  bg:"#0F172A", surface:"#0F172A", card:"#1E2937", border:"#2D3748",
  accent:"#00D4C8", accentDim:"rgba(0,212,200,0.1)", text:"#F1F5F9",
  muted:"#94A3B8", green:"#22c55e", red:"#ef4444", blue:"#3b82f6",
};

const STATUS_COLORS: Record<string, string> = {
  new: "#00D4C8",
  assigned: "#3b82f6",
  won: "#22c55e",
  lost: "#94A3B8",
};

export default function LeadsPage() {
  const [leads, setLeads]         = useState<any[]>([]);
  const [operators, setOperators] = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState<any>(null);
  const [filter, setFilter]       = useState("all");
  const [assigning, setAssigning] = useState(false);
  const [selectedOp, setSelectedOp] = useState("");

  useEffect(() => {
    const load = async () => {
      const [{ data: leadsData }, { data: opsData }] = await Promise.all([
        supabase.from("leads").select("*").order("created_at", { ascending: false }),
        supabase.from("operators").select("id, business_name, email, city, state").order("business_name"),
      ]);
      if (leadsData) setLeads(leadsData);
      if (opsData) setOperators(opsData);
      setLoading(false);
    };
    load();
  }, []);

  const assignLead = async (leadId: string, operatorId: string) => {
    setAssigning(true);
    const op = operators.find(o => o.id === operatorId);
    const lead = leads.find(l => l.id === leadId);
    if (!op || !lead) return;

    await supabase.from("leads").update({
      assigned_operator_id: operatorId,
      status: "assigned",
    }).eq("id", leadId);

    // Notify operator via email
    await fetch("/api/notify-lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lead, operator: op }),
    });

    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, assigned_operator_id: operatorId, status: "assigned" } : l));
    setSelected((prev: any) => prev?.id === leadId ? { ...prev, assigned_operator_id: operatorId, status: "assigned" } : prev);
    setAssigning(false);
    setSelectedOp("");
  };

  const filtered = filter === "all" ? leads : leads.filter(l => l.status === filter);

  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === "new").length,
    assigned: leads.filter(l => l.status === "assigned").length,
    won: leads.filter(l => l.status === "won").length,
    lost: leads.filter(l => l.status === "lost").length,
    revenue: leads.filter(l => l.status === "won").length * 25 + leads.filter(l => l.status === "lost").length * 5,
  };

  if (loading) return (
    <NavLayout active="leads">
      <div style={{ padding: 24, color: C.muted }}>Loading leads...</div>
    </NavLayout>
  );

  if (selected) return (
    <NavLayout active="leads" title="Lead Detail" backHref="/dashboard/leads">
      <div style={{ padding: 24, maxWidth: 600 }}>
        <div style={{ display:"flex", alignItems:"center", gap: 10, marginBottom: 20 }}>
          <span style={{ background: STATUS_COLORS[selected.status] || C.muted, color:"#000", fontSize:".65rem", fontWeight:700, padding:"4px 10px", borderRadius:20, fontFamily:"monospace" }}>
            {selected.status?.toUpperCase()}
          </span>
          <span style={{ fontSize:".78rem", color:C.muted }}>{new Date(selected.created_at).toLocaleDateString()}</span>
        </div>

        <div style={{ fontSize:"1.4rem", fontWeight:800, color:C.text, marginBottom:4 }}>{selected.name}</div>
        <div style={{ fontSize:".84rem", color:C.muted, marginBottom:20 }}>{selected.address}</div>

        {/* Contact */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20, marginBottom:16 }}>
          <div style={{ fontSize:".65rem", color:C.muted, fontFamily:"monospace", marginBottom:12 }}>CONTACT INFO</div>
          <div style={{ display:"flex", flexDirection:"column" as const, gap:8 }}>
            <a href={`tel:${selected.phone}`} style={{ fontSize:".9rem", color:C.accent, fontWeight:600, textDecoration:"none" }}>📞 {selected.phone}</a>
            <a href={`mailto:${selected.email}`} style={{ fontSize:".84rem", color:C.accent, textDecoration:"none" }}>✉️ {selected.email}</a>
            <div style={{ fontSize:".84rem", color:C.muted }}>📍 {selected.city}, {selected.state} {selected.zip}</div>
            {selected.lead_source && <div style={{ fontSize:".78rem", color:C.muted }}>🔍 Source: {selected.lead_source}</div>}
          </div>
        </div>

        {/* AI Description */}
        {selected.ai_description && (
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20, marginBottom:16 }}>
            <div style={{ fontSize:".65rem", color:C.accent, fontFamily:"monospace", marginBottom:8 }}>AI ANALYSIS</div>
            <div style={{ fontSize:".84rem", color:C.text, lineHeight:1.6 }}>{selected.ai_description}</div>
            {selected.estimated_min && (
              <div style={{ marginTop:12, paddingTop:12, borderTop:`1px solid ${C.border}`, display:"flex", justifyContent:"space-between" }}>
                <span style={{ fontSize:".78rem", color:C.muted }}>Estimated Range</span>
                <span style={{ fontWeight:800, color:C.accent }}>${selected.estimated_min} – ${selected.estimated_max}</span>
              </div>
            )}
          </div>
        )}

        {/* Description */}
        {selected.description && (
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20, marginBottom:16 }}>
            <div style={{ fontSize:".65rem", color:C.muted, fontFamily:"monospace", marginBottom:8 }}>CUSTOMER DESCRIPTION</div>
            <div style={{ fontSize:".84rem", color:C.text, lineHeight:1.6 }}>{selected.description}</div>
          </div>
        )}

        {/* Photos */}
        {selected.photo_urls?.length > 0 && (
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20, marginBottom:16 }}>
            <div style={{ fontSize:".65rem", color:C.muted, fontFamily:"monospace", marginBottom:12 }}>PHOTOS ({selected.photo_urls.length})</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(100px, 1fr))", gap:8 }}>
              {selected.photo_urls.map((url: string, i: number) => (
                <img key={i} src={url} alt="" style={{ width:"100%", aspectRatio:"1", objectFit:"cover", borderRadius:8, border:`1px solid ${C.border}` }} />
              ))}
            </div>
          </div>
        )}

        {/* Assign to operator */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20, marginBottom:16 }}>
          <div style={{ fontSize:".65rem", color:C.accent, fontFamily:"monospace", marginBottom:12 }}>ASSIGN TO OPERATOR</div>
          {selected.assigned_operator_id ? (
            <div>
              <div style={{ fontSize:".84rem", color:C.green, fontWeight:600, marginBottom:8 }}>
                ✅ Assigned to {operators.find(o => o.id === selected.assigned_operator_id)?.business_name || "operator"}
              </div>
              <button onClick={() => { setSelected((p: any) => ({ ...p, assigned_operator_id: null, status: "new" })); supabase.from("leads").update({ assigned_operator_id: null, status: "new" }).eq("id", selected.id); }}
                style={{ fontSize:".78rem", color:C.muted, background:"none", border:"none", cursor:"pointer", textDecoration:"underline" }}>
                Reassign
              </button>
            </div>
          ) : (
            <div style={{ display:"flex", gap:8 }}>
              <select value={selectedOp} onChange={e => setSelectedOp(e.target.value)}
                style={{ flex:1, padding:"10px 12px", borderRadius:8, border:`1px solid ${C.border}`, background:C.surface, color:C.text, fontSize:".84rem", outline:"none" }}>
                <option value="">Select operator...</option>
                {operators.map(op => (
                  <option key={op.id} value={op.id}>{op.business_name} — {op.city}, {op.state}</option>
                ))}
              </select>
              <button onClick={() => assignLead(selected.id, selectedOp)} disabled={!selectedOp || assigning}
                style={{ padding:"10px 16px", borderRadius:8, border:"none", background: selectedOp ? C.accent : "#333", color: selectedOp ? "#000" : C.muted, fontWeight:700, cursor: selectedOp ? "pointer" : "not-allowed", fontSize:".84rem", whiteSpace:"nowrap" as const }}>
                {assigning ? "Sending..." : "Send Lead"}
              </button>
            </div>
          )}
        </div>

        {/* Outcome */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20 }}>
          <div style={{ fontSize:".65rem", color:C.muted, fontFamily:"monospace", marginBottom:12 }}>OUTCOME</div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={async () => { await supabase.from("leads").update({ status:"won", outcome:"won", outcome_reported_at: new Date().toISOString() }).eq("id", selected.id); setLeads(p => p.map(l => l.id === selected.id ? { ...l, status:"won" } : l)); setSelected((p: any) => ({ ...p, status:"won" })); }}
              style={{ flex:1, padding:"12px", borderRadius:8, border:`1px solid ${C.green}`, background: selected.status === "won" ? C.green : "transparent", color: selected.status === "won" ? "#000" : C.green, fontWeight:700, cursor:"pointer", fontSize:".84rem" }}>
              ✅ Won — Bill $25
            </button>
            <button onClick={async () => { await supabase.from("leads").update({ status:"lost", outcome:"lost", outcome_reported_at: new Date().toISOString() }).eq("id", selected.id); setLeads(p => p.map(l => l.id === selected.id ? { ...l, status:"lost" } : l)); setSelected((p: any) => ({ ...p, status:"lost" })); }}
              style={{ flex:1, padding:"12px", borderRadius:8, border:`1px solid ${C.red}`, background: selected.status === "lost" ? C.red : "transparent", color: selected.status === "lost" ? "#fff" : C.red, fontWeight:700, cursor:"pointer", fontSize:".84rem" }}>
              ❌ Lost — Bill $5
            </button>
          </div>
        </div>
      </div>
    </NavLayout>
  );

  return (
    <NavLayout active="leads">
      <div style={{ padding:24 }}>

        {/* Header */}
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:"1.4rem", fontWeight:800, color:C.text }}>🌐 Lead Network</div>
          <div style={{ fontSize:".84rem", color:C.muted, marginTop:4 }}>Incoming leads from junkpix.com/get-a-quote</div>
        </div>

        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(130px, 1fr))", gap:12, marginBottom:24 }}>
          {[
            { label:"Total Leads", value: stats.total, color: C.text },
            { label:"New", value: stats.new, color: C.accent },
            { label:"Assigned", value: stats.assigned, color: C.blue },
            { label:"Won", value: stats.won, color: C.green },
            { label:"Lost", value: stats.lost, color: C.muted },
            { label:"Revenue", value: `$${stats.revenue}`, color: C.green },
          ].map(s => (
            <div key={s.label} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:16 }}>
              <div style={{ fontSize:".65rem", color:C.muted, fontFamily:"monospace", marginBottom:4 }}>{s.label}</div>
              <div style={{ fontSize:"1.4rem", fontWeight:800, color:s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" as const }}>
          {["all","new","assigned","won","lost"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding:"6px 14px", borderRadius:20, border:`1px solid ${filter === f ? C.accent : C.border}`, background: filter === f ? C.accentDim : "transparent", color: filter === f ? C.accent : C.muted, cursor:"pointer", fontSize:".78rem", fontWeight:600, textTransform:"capitalize" as const }}>
              {f === "all" ? `All (${stats.total})` : `${f} (${stats[f as keyof typeof stats]})`}
            </button>
          ))}
        </div>

        {/* Leads list */}
        {filtered.length === 0 ? (
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:40, textAlign:"center" as const }}>
            <div style={{ fontSize:"2rem", marginBottom:8 }}>🌐</div>
            <div style={{ color:C.muted, fontSize:".88rem" }}>No leads yet. Share junkpix.com/get-a-quote to start receiving leads.</div>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column" as const, gap:8 }}>
            {filtered.map(lead => (
              <div key={lead.id} onClick={() => setSelected(lead)}
                style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"16px 20px", cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <div style={{ fontWeight:700, color:C.text, marginBottom:2 }}>{lead.name}</div>
                  <div style={{ fontSize:".78rem", color:C.muted }}>{lead.city}, {lead.state} {lead.zip}</div>
                  <div style={{ fontSize:".72rem", color:C.muted, marginTop:2 }}>{new Date(lead.created_at).toLocaleDateString()}</div>
                </div>
                <div style={{ display:"flex", flexDirection:"column" as const, alignItems:"flex-end", gap:4 }}>
                  <span style={{ background: STATUS_COLORS[lead.status] || C.muted, color:"#000", fontSize:".6rem", fontWeight:700, padding:"3px 8px", borderRadius:20, fontFamily:"monospace" }}>
                    {lead.status?.toUpperCase()}
                  </span>
                  {lead.estimated_min && <span style={{ fontSize:".78rem", color:C.accent, fontWeight:700 }}>${lead.estimated_min}–${lead.estimated_max}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </NavLayout>
  );
}
