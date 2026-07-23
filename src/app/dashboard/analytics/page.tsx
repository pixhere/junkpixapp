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
  bg:"#0F172A", surface:"#0F172A", card:"#1E2937", border:"#2D3748",
  accent:"#00D4C8", accentDim:"rgba(0,212,200,0.1)", text:"#F1F5F9",
  muted:"#94A3B8", green:"#22c55e", red:"#ef4444", blue:"#3b82f6",
};

const StatBox = ({ label, value, sub, color }: any) => (
  <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"20px 18px" }}>
    <div style={{ fontSize:".65rem", color:C.muted, letterSpacing:".1em", fontFamily:"monospace", marginBottom:8 }}>{label}</div>
    <div style={{ fontSize:"2rem", fontWeight:800, color:color||C.text, lineHeight:1 }}>{value}</div>
    {sub && <div style={{ fontSize:".75rem", color:C.muted, marginTop:6 }}>{sub}</div>}
  </div>
);

export default function AnalyticsPage() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data: qs } = await supabase.from("quote_requests").select("*").eq("operator_id", user.id).order("created_at", { ascending: false });
      if (qs) setQuotes(qs);
    };
    load();
  }, []);

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
    const week = new Date(q.created_at).toLocaleDateString("en-US", { month:"short", day:"numeric" });
    if (!weekly[week]) weekly[week] = { quotes:0, revenue:0 };
    weekly[week].quotes++;
    if (q.final_price) weekly[week].revenue += q.final_price;
  });
  const weeklyData = Object.entries(weekly).slice(-8).reverse();

  const exportCSV = () => {
    const headers = ["Date","Customer","Phone","Email","Address","AI Description","Status","Est Min","Est Max","Final Price"];
    const rows = quotes.map(q => [
      new Date(q.created_at).toLocaleDateString(),
      q.customer_name, q.customer_phone, q.customer_email, q.customer_address,
      `"${(q.ai_description || "").replace(/"/g, "'")}"`,
      q.status, q.estimated_min || "", q.estimated_max || "", q.final_price || "",
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type:"text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `junkpix-quotes-${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <NavLayout active="analytics" title="Analytics">
      <div style={{ display:"flex", flexDirection:"column" as const, gap:24, padding:24, }}>

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontSize:"1.4rem", fontWeight:800, color:C.text }}>Analytics</div>
          <button onClick={exportCSV} style={{ background:C.accent, color:"#000", border:"none", borderRadius:8, padding:"10px 20px", fontWeight:700, cursor:"pointer", fontSize:".88rem" }}>
            ⬇ Export CSV
          </button>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:12 }}>
          <StatBox label="TOTAL QUOTES"     value={total}              sub="All time"            color={C.accent} />
          <StatBox label="CONVERSION RATE"  value={`${conversion}%`}  sub="Quotes → booked"     color={C.green} />
          <StatBox label="AVG TICKET VALUE" value={`$${avgTicket}`}   sub="Booked jobs"          color={C.accent} />
          <StatBox label="TOTAL REVENUE"    value={`$${revenue}`}     sub="Completed + booked"   color={C.green} />
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:12 }}>
          <StatBox label="COMPLETED JOBS"   value={completed}          sub="Finished hauls" />
          <StatBox label="REJECTED / NO-GO" value={`${rejectedRate}%`} sub="Cancelled quotes"    color={C.red} />
          <StatBox label="NEW REQUESTS"     value={quotes.filter(q=>q.status==="new").length} sub="Awaiting review" color={C.blue} />
          <StatBox label="BOOKED"           value={booked}             sub="Confirmed jobs"       color={C.green} />
        </div>

        {/* Weekly activity */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:24 }}>
          <div style={{ fontWeight:700, color:C.text, marginBottom:20 }}>Weekly Activity</div>
          {weeklyData.length === 0 ? (
            <div style={{ color:C.muted, fontSize:".88rem", textAlign:"center" as const, padding:40 }}>No data yet. Submit some quotes to see activity.</div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column" as const, gap:0 }}>
              <div style={{ display:"grid", gridTemplateColumns:"120px 1fr 1fr 100px", gap:16, padding:"8px 0", borderBottom:`1px solid ${C.border}`, marginBottom:8 }}>
                {["Date","Quotes","Revenue",""].map((h,i) => (
                  <span key={i} style={{ fontSize:".68rem", color:C.muted, letterSpacing:".08em", fontFamily:"monospace" }}>{h}</span>
                ))}
              </div>
              {weeklyData.map(([week, data]) => (
                <div key={week} style={{ display:"grid", gridTemplateColumns:"120px 1fr 1fr 100px", gap:16, padding:"12px 0", borderBottom:`1px solid ${C.border}`, alignItems:"center" }}>
                  <span style={{ fontSize:".84rem", color:C.muted }}>{week}</span>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ height:8, borderRadius:4, background:C.accent, width:`${Math.min(100, data.quotes*20)}%`, minWidth:4 }} />
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

        {/* Pipeline */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:24 }}>
          <div style={{ fontWeight:700, color:C.text, marginBottom:16 }}>Quote Pipeline</div>
          <div style={{ display:"flex", flexDirection:"column" as const, gap:12 }}>
            {[
              { label:"New",       count:quotes.filter(q=>q.status==="new").length,       color:C.blue },
              { label:"Reviewed",  count:quotes.filter(q=>q.status==="reviewed").length,  color:C.accent },
              { label:"Quoted",    count:quotes.filter(q=>q.status==="quoted").length,    color:"#a855f7" },
              { label:"Booked",    count:quotes.filter(q=>q.status==="booked").length,    color:C.green },
              { label:"Completed", count:quotes.filter(q=>q.status==="completed").length, color:C.muted },
              { label:"Cancelled", count:quotes.filter(q=>q.status==="cancelled").length, color:C.red },
            ].map(s => (
              <div key={s.label} style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:80, fontSize:".82rem", color:C.muted }}>{s.label}</div>
                <div style={{ flex:1, height:8, background:C.surface, borderRadius:4 }}>
                  <div style={{ height:8, borderRadius:4, background:s.color, width:total ? `${Math.round((s.count/total)*100)}%` : "0%" }} />
                </div>
                <div style={{ width:24, fontSize:".84rem", color:C.text, textAlign:"right" as const }}>{s.count}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </NavLayout>
  );
}
