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

const STATUS_STYLES: Record<string,any> = {
  new:       { label:"New",       color:"#D97B4F", bg:"rgba(217,123,79,0.1)" },
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
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
    return () => clearInterval(interval);
  }, []);

  const filtered = filter === "all" ? quotes : quotes.filter(q => q.status === filter);
  const newCount = quotes.filter(q => q.status === "new").length;

  return (
    <NavLayout active="quotes" title="📋 Quotes">
      <div style={{ padding: 16 }}>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto" as const, paddingBottom: 4 }}>
          {["all","new","reviewed","quoted","booked","completed"].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: "7px 14px", borderRadius: 20, border: "1px solid " + (filter === f ? C.accent : C.border), background: filter === f ? "rgba(217,123,79,0.15)" : "transparent", color: filter === f ? C.accent : C.muted, cursor: "pointer", fontSize: ".78rem", fontWeight: filter === f ? 700 : 400, whiteSpace: "nowrap" as const, flexShrink: 0 }}>
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
            return (
              <div key={q.id} onClick={() => router.push("/dashboard/quote/" + q.id)} style={{ padding: "16px", background: C.card, borderBottom: "1px solid " + C.border, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <div style={{ fontWeight: 700, fontSize: ".95rem", color: C.text }}>{q.customer_name}</div>
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
    </NavLayout>
  );
}
