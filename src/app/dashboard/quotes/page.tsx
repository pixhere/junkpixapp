"use client";
import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import NavLayout from "@/components/NavLayout";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const C = {
  bg:"#0F172A", card:"#1E2937", border:"#2D3748", text:"#F5F4F0",
  muted:"#666660", accent:"#00D4C8", accentDim:"rgba(0,212,200,0.1)", surface:"#1a1a1a", green:"#22c55e",
};

const STATUS_STYLES: Record<string,any> = {
  new:       { label:"New",       color:"#00D4C8", bg:"rgba(0,212,200,0.1)" },
  reviewed:  { label:"Reviewed",  color:"#3b82f6", bg:"rgba(59,130,246,0.1)" },
  quoted:    { label:"Quoted",    color:"#a855f7", bg:"rgba(168,85,247,0.1)" },
  booked:    { label:"Booked",    color:"#22c55e", bg:"rgba(34,197,94,0.1)"  },
  completed: { label:"Completed", color:"#888882", bg:"rgba(136,136,130,0.1)"},
  cancelled: { label:"Cancelled", color:"#ef4444", bg:"rgba(239,68,68,0.1)"  },
};

export default function QuotesPage() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [operator, setOperator] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [manualJob, setManualJob] = useState({
    customer_name:"", customer_phone:"", customer_address:"",
    description:"", final_price:"", job_date:"", status:"completed"
  });

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data: op } = await supabase.from("operators").select("*").eq("id", user.id).single();
      if (op) setOperator(op);
      const { data: qs } = await supabase.from("quote_requests").select("*").eq("operator_id", user.id).order("created_at", { ascending: false });
      if (qs) setQuotes(qs);
      setLoading(false);
    };
    load();
    const interval = setInterval(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: qs } = await supabase.from("quote_requests").select("*").eq("operator_id", user.id).order("created_at", { ascending: false });
        if (qs) setQuotes(qs);
      }
    }, 30000);
    const saveManualJob = async () => {
    if (!manualJob.customer_name || !manualJob.final_price || !operator) return;
    setSaving(true);
    const { data } = await supabase.from("quote_requests").insert({
      operator_id: operator.id,
      customer_name: manualJob.customer_name,
      customer_phone: manualJob.customer_phone || null,
      customer_address: manualJob.customer_address || null,
      ai_description: manualJob.description || "Manual job entry",
      final_price: parseInt(manualJob.final_price),
      status: manualJob.status,
      is_manual: true,
      scheduled_date: manualJob.job_date || null,
      created_at: manualJob.job_date ? new Date(manualJob.job_date).toISOString() : new Date().toISOString(),
    }).select().single();
    if (data) setQuotes(prev => [data, ...prev]);
    setManualJob({ customer_name:"", customer_phone:"", customer_address:"", description:"", final_price:"", job_date:"", status:"completed" });
    setShowManual(false);
    setSaving(false);
  };

  return () => clearInterval(interval);
  }, []);

  const filtered = filter === "all" ? quotes : quotes.filter(q => q.status === filter);
  const newCount = quotes.filter(q => q.status === "new").length;

  const saveManualJob = async () => {
    if (!manualJob.customer_name || !manualJob.final_price || !operator) return;
    setSaving(true);
    const { data } = await supabase.from("quote_requests").insert({
      operator_id: operator.id,
      customer_name: manualJob.customer_name,
      customer_phone: manualJob.customer_phone || null,
      customer_address: manualJob.customer_address || null,
      ai_description: manualJob.description || "Manual job entry",
      final_price: parseInt(manualJob.final_price),
      status: manualJob.status,
      is_manual: true,
      scheduled_date: manualJob.job_date || null,
      created_at: manualJob.job_date ? new Date(manualJob.job_date).toISOString() : new Date().toISOString(),
    }).select().single();
    if (data) setQuotes(prev => [data, ...prev]);
    setManualJob({ customer_name:"", customer_phone:"", customer_address:"", description:"", final_price:"", job_date:"", status:"completed" });
    setShowManual(false);
    setSaving(false);
  };

  return (
    <NavLayout active="quotes" title="📋 Quotes">
      <div style={{ padding: 16 }}>

        {/* Header with Add Job button */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <div style={{ fontSize:"1.1rem", fontWeight:800, color:C.text }}>📋 Quotes</div>
          <button onClick={() => setShowManual(true)}
            style={{ padding:"8px 16px", borderRadius:8, border:"none", background:C.accent, color:"#000", fontWeight:700, cursor:"pointer", fontSize:".82rem" }}>
            + Add Job
          </button>
        </div>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto" as const, paddingBottom: 4 }}>
          {["all","new","reviewed","quoted","booked","completed"].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: "7px 14px", borderRadius: 20, border: "1px solid " + (filter === f ? C.accent : C.border), background: filter === f ? "rgba(0,212,200,0.15)" : "transparent", color: filter === f ? C.accent : C.muted, cursor: "pointer", fontSize: ".78rem", fontWeight: filter === f ? 700 : 400, whiteSpace: "nowrap" as const, flexShrink: 0 }}>
              {f === "all" ? "All" : STATUS_STYLES[f]?.label}
              {f === "new" && newCount > 0 && <span style={{ marginLeft: 6, background: C.accent, color: "#000", borderRadius: 10, padding: "1px 6px", fontSize: ".65rem", fontWeight: 800 }}>{newCount}</span>}
            </button>
          ))}
        </div>

        {loading && <div style={{ color: C.muted, textAlign: "center" as const, padding: 40 }}>Loading...</div>}

        {!loading && filtered.length === 0 && (
          <div style={{ color: C.muted, textAlign: "center" as const, padding: 40, fontSize: ".88rem" }}>No quotes found.</div>
        )}

        <div style={{ display: "flex", flexDirection: "column" as const, gap: 1 }}>
          {filtered.map(q => {
            const s = STATUS_STYLES[q.status] || STATUS_STYLES.new;
            const saveManualJob = async () => {
    if (!manualJob.customer_name || !manualJob.final_price || !operator) return;
    setSaving(true);
    const { data } = await supabase.from("quote_requests").insert({
      operator_id: operator.id,
      customer_name: manualJob.customer_name,
      customer_phone: manualJob.customer_phone || null,
      customer_address: manualJob.customer_address || null,
      ai_description: manualJob.description || "Manual job entry",
      final_price: parseInt(manualJob.final_price),
      status: manualJob.status,
      is_manual: true,
      scheduled_date: manualJob.job_date || null,
      created_at: manualJob.job_date ? new Date(manualJob.job_date).toISOString() : new Date().toISOString(),
    }).select().single();
    if (data) setQuotes(prev => [data, ...prev]);
    setManualJob({ customer_name:"", customer_phone:"", customer_address:"", description:"", final_price:"", job_date:"", status:"completed" });
    setShowManual(false);
    setSaving(false);
  };

  return (
              <div key={q.id} className="jp-card-hover" onClick={() => router.push("/dashboard/quote/" + q.id)} style={{ padding: "16px", background: C.card, borderBottom: "1px solid " + C.border, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <div style={{ fontWeight: 700, fontSize: ".95rem", color: C.text }}>{q.customer_name}{q.is_manual && <span style={{ marginLeft:6, fontSize:".6rem", color:C.muted, border:"1px solid "+C.border, borderRadius:4, padding:"1px 5px" }}>MANUAL</span>}</div>
                    <span style={{ fontSize: ".65rem", fontWeight: 700, color: s.color, background: s.bg, padding: "2px 8px", borderRadius: 10, flexShrink: 0 }}>{s.label}</span>
                  </div>
                  <div style={{ fontSize: ".75rem", color: C.muted, marginBottom: 2 }}>{q.customer_address}</div>
                  <div style={{ fontSize: ".72rem", color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{q.ai_description?.slice(0,60)}...</div>
                </div>
                <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
                  <div style={{ fontWeight: 800, color: C.accent, fontSize: ".95rem" }}>${q.final_price || q.estimated_min}</div>
                  <div style={{ fontSize: ".65rem", color: C.muted, marginTop: 2 }}>{new Date(q.created_at).toLocaleDateString()}</div>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Manual Job Modal */}
      {showManual && (
        <div style={{ position:"fixed" as const, inset:0, background:"rgba(0,0,0,0.75)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div style={{ background:C.card, border:"1px solid "+C.border, borderRadius:16, padding:24, width:"100%", maxWidth:480, maxHeight:"90vh", overflowY:"auto" as const }}>
            <div style={{ fontWeight:800, color:C.text, fontSize:"1.1rem", marginBottom:4 }}>+ Add Manual Job</div>
            <div style={{ fontSize:".78rem", color:C.muted, marginBottom:20 }}>Log a job done outside JunkPix. It counts toward your revenue and analytics.</div>

            {[
              { key:"customer_name", label:"Customer Name *", placeholder:"Full name", type:"text" },
              { key:"customer_phone", label:"Phone", placeholder:"Phone number", type:"tel" },
              { key:"customer_address", label:"Address", placeholder:"Job address", type:"text" },
              { key:"description", label:"Job Description", placeholder:"What was removed?", type:"text" },
              { key:"final_price", label:"Amount Charged *", placeholder:"e.g. 450", type:"number" },
              { key:"job_date", label:"Job Date", placeholder:"", type:"date" },
            ].map(f => (
              <div key={f.key} style={{ marginBottom:12 }}>
                <label style={{ fontSize:".72rem", color:C.muted, display:"block", marginBottom:4 }}>{f.label}</label>
                <input type={f.type} placeholder={f.placeholder}
                  value={manualJob[f.key as keyof typeof manualJob]}
                  onChange={e => setManualJob(p => ({...p, [f.key]: e.target.value}))}
                  style={{ width:"100%", padding:"10px 14px", borderRadius:8, border:"1px solid "+C.border, background:C.surface, color:C.text, fontSize:".88rem", outline:"none", boxSizing:"border-box" as const }} />
              </div>
            ))}

            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:".72rem", color:C.muted, display:"block", marginBottom:4 }}>STATUS</label>
              <div style={{ display:"flex", gap:8 }}>
                {["booked","completed"].map(st => (
                  <button key={st} onClick={() => setManualJob(p => ({...p, status:st}))}
                    style={{ flex:1, padding:"9px", borderRadius:8, border:"1px solid "+(manualJob.status === st ? C.accent : C.border), background: manualJob.status === st ? C.accentDim : "transparent", color: manualJob.status === st ? C.accent : C.muted, cursor:"pointer", fontWeight: manualJob.status === st ? 700 : 400, fontSize:".82rem", textTransform:"capitalize" as const }}>
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display:"flex", gap:8 }}>
              <button onClick={() => setShowManual(false)}
                style={{ flex:1, padding:"12px", borderRadius:8, border:"1px solid "+C.border, background:"transparent", color:C.muted, cursor:"pointer", fontWeight:600 }}>
                Cancel
              </button>
              <button onClick={saveManualJob} disabled={!manualJob.customer_name || !manualJob.final_price || saving}
                style={{ flex:1, padding:"12px", borderRadius:8, border:"none", background:(manualJob.customer_name && manualJob.final_price) ? C.accent : "#333", color:(manualJob.customer_name && manualJob.final_price) ? "#000" : C.muted, cursor:(manualJob.customer_name && manualJob.final_price) ? "pointer" : "not-allowed", fontWeight:700 }}>
                {saving ? "Saving..." : "Save Job"}
              </button>
            </div>
          </div>
        </div>
      )}

    </NavLayout>
  );
}
