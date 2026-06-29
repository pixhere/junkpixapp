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
  bg:"#0A0A0A", card:"#111111", border:"#222222", text:"#F5F4F0",
  muted:"#666660", accent:"#D97B4F", surface:"#1a1a1a", green:"#22c55e",
};

export default function AnalyticsPage() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data: qs } = await supabase.from("quote_requests").select("*").eq("operator_id", user.id);
      if (qs) setQuotes(qs);
    };
    load();
  }, []);

  const total = quotes.length;
  const booked = quotes.filter(q => q.status === "booked" || q.status === "completed").length;
  const completed = quotes.filter(q => q.status === "completed").length;
  const revenue = quotes.filter(q => q.final_price).reduce((s,q) => s + (q.final_price || 0), 0);
  const convRate = total > 0 ? Math.round((booked / total) * 100) : 0;
  const avgJob = booked > 0 ? Math.round(revenue / booked) : 0;

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7*24*60*60*1000);
  const weekQuotes = quotes.filter(q => new Date(q.created_at) > weekAgo);
  const weekRevenue = weekQuotes.filter(q => q.final_price).reduce((s,q) => s + (q.final_price || 0), 0);

  const statCard = (label: string, value: string, sub?: string, color?: string) => (
    <div style={{ background: C.card, border: "1px solid " + C.border, borderRadius: 12, padding: 16 }}>
      <div style={{ fontSize: ".65rem", color: C.muted, fontFamily: "monospace", letterSpacing: ".08em", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: "1.6rem", fontWeight: 800, color: color || C.text }}>{value}</div>
      {sub && <div style={{ fontSize: ".72rem", color: C.muted, marginTop: 4 }}>{sub}</div>}
    </div>
  );

  return (
    <NavLayout active="analytics" title="📊 Analytics">
      <div style={{ maxWidth: 700, margin: "0 auto", padding: 16 }}>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          {statCard("TOTAL QUOTES", String(total), "All time")}
          {statCard("CONVERSION RATE", convRate + "%", "Quotes → booked", convRate > 50 ? C.green : C.accent)}
          {statCard("TOTAL REVENUE", "$" + revenue.toLocaleString(), "From completed jobs", C.accent)}
          {statCard("AVG JOB VALUE", "$" + avgJob, "Per booked job")}
          {statCard("THIS WEEK", weekQuotes.length + " quotes", weekQuotes.length + " new requests")}
          {statCard("WEEK REVENUE", "$" + weekRevenue.toLocaleString(), "Last 7 days", C.green)}
        </div>

        {/* Status breakdown */}
        <div style={{ background: C.card, border: "1px solid " + C.border, borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: ".65rem", color: C.muted, fontFamily: "monospace", marginBottom: 12 }}>STATUS BREAKDOWN</div>
          {["new","reviewed","quoted","booked","completed","cancelled"].map(status => {
            const count = quotes.filter(q => q.status === status).length;
            const pct = total > 0 ? Math.round((count/total)*100) : 0;
            return (
              <div key={status} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: ".8rem", color: C.text, textTransform: "capitalize" as const }}>{status}</span>
                  <span style={{ fontSize: ".8rem", color: C.muted }}>{count} ({pct}%)</span>
                </div>
                <div style={{ height: 6, background: C.surface, borderRadius: 3 }}>
                  <div style={{ height: 6, background: C.accent, borderRadius: 3, width: pct + "%" }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent activity */}
        <div style={{ background: C.card, border: "1px solid " + C.border, borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: ".65rem", color: C.muted, fontFamily: "monospace", marginBottom: 12 }}>RECENT QUOTES</div>
          {quotes.slice(0,5).map(q => (
            <div key={q.id} onClick={() => router.push("/dashboard/quote/"+q.id)} style={{ padding: "10px 0", borderBottom: "1px solid " + C.border, cursor: "pointer", display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: ".84rem", fontWeight: 600, color: C.text }}>{q.customer_name}</div>
                <div style={{ fontSize: ".72rem", color: C.muted }}>{new Date(q.created_at).toLocaleDateString()}</div>
              </div>
              <div style={{ textAlign: "right" as const }}>
                <div style={{ fontSize: ".84rem", fontWeight: 700, color: C.accent }}>${q.final_price || q.estimated_min}</div>
                <div style={{ fontSize: ".65rem", color: C.muted, textTransform: "capitalize" as const }}>{q.status}</div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </NavLayout>
  );
}
