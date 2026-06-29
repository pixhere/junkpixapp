"use client";
import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter, useParams } from "next/navigation";
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

export default function CostsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [quote, setQuote] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [dumpFee, setDumpFee] = useState("0");
  const [laborHours, setLaborHours] = useState("0");
  const [laborRate, setLaborRate] = useState("20");
  const [crewSize, setCrewSize] = useState("2");
  const [fuelCost, setFuelCost] = useState("0");
  const [materialCost, setMaterialCost] = useState("0");
  const [otherCost, setOtherCost] = useState("0");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data: q } = await supabase.from("quote_requests").select("*").eq("id", id).single();
      if (q) {
        setQuote(q);
        setDumpFee(String(q.actual_dump_fee || 0));
        setLaborHours(String(q.actual_labor_hours || 0));
        setLaborRate(String(q.actual_labor_rate || 20));
        setCrewSize(String(q.actual_crew_size || 2));
        setFuelCost(String(q.actual_fuel_cost || 0));
        setMaterialCost(String(q.actual_material_cost || 0));
        setOtherCost(String(q.actual_other_cost || 0));
        setNotes(q.cost_notes || "");
      }
    };
    load();
  }, [id]);

  const totalCost = parseFloat(dumpFee) + (parseFloat(laborHours) * parseFloat(laborRate) * parseFloat(crewSize)) + parseFloat(fuelCost) + parseFloat(materialCost) + parseFloat(otherCost);
  const revenue = quote?.final_price || quote?.estimated_min || 0;
  const profit = revenue - totalCost;
  const margin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;

  const save = async () => {
    setSaving(true);
    await supabase.from("quote_requests").update({
      actual_dump_fee: parseFloat(dumpFee),
      actual_labor_hours: parseFloat(laborHours),
      actual_labor_rate: parseFloat(laborRate),
      actual_crew_size: parseInt(crewSize),
      actual_fuel_cost: parseFloat(fuelCost),
      actual_material_cost: parseFloat(materialCost),
      actual_other_cost: parseFloat(otherCost),
      cost_notes: notes,
      actual_total_cost: totalCost,
      actual_profit: profit,
      actual_margin_percent: margin,
    }).eq("id", id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const inp: any = { width:"100%", padding:"11px 14px", borderRadius:8, border:"1px solid #222222", background:"#111111", color:"#F0F0F0", fontSize:".88rem", outline:"none", boxSizing:"border-box", fontFamily:"inherit" };

  const StatBox = ({ label, value, color }: any) => (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"20px 18px" }}>
      <div style={{ fontSize:".65rem", color:C.muted, letterSpacing:".1em", fontFamily:"monospace", marginBottom:8 }}>{label}</div>
      <div style={{ fontSize:"2rem", fontWeight:800, color:color||C.text, lineHeight:1 }}>{value}</div>
    </div>
  );

  if (!quote) return <NavLayout active="quotes"><div style={{ padding:24, color:"#666666" }}>Loading...</div></NavLayout>;

  return (
    <NavLayout active="quotes" title="💰 Job Cost Tracking" backHref={`/dashboard/quote/${id}`}>
      <div style={{ padding:24, display:"flex", flexDirection:"column" as const, gap:24 }}>

        <div>
          <div style={{ fontSize:"1.4rem", fontWeight:800, color:C.text }}>{quote.customer_name}</div>
          <div style={{ fontSize:".84rem", color:C.muted, marginTop:4 }}>{quote.customer_address}</div>
        </div>

        {/* Profit summary */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
          <StatBox label="REVENUE" value={`$${revenue}`} color={C.accent} />
          <StatBox label="TOTAL COST" value={`$${Math.round(totalCost)}`} color={C.red} />
          <StatBox label="PROFIT" value={`$${Math.round(profit)}`} color={profit > 0 ? C.green : C.red} />
          <StatBox label="MARGIN" value={`${margin}%`} color={margin > 30 ? C.green : margin > 0 ? C.accent : C.red} />
        </div>

        {/* Cost inputs */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:24 }}>
          <div style={{ fontWeight:700, color:C.text, marginBottom:20 }}>Actual Job Costs</div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
            <div>
              <div style={{ fontSize:".65rem", color:C.muted, fontFamily:"monospace", marginBottom:6 }}>DUMP FEE PAID ($)</div>
              <input type="number" value={dumpFee} onChange={e => setDumpFee(e.target.value)} style={inp} />
            </div>
            <div>
              <div style={{ fontSize:".65rem", color:C.muted, fontFamily:"monospace", marginBottom:6 }}>FUEL COST ($)</div>
              <input type="number" value={fuelCost} onChange={e => setFuelCost(e.target.value)} style={inp} />
            </div>
            <div>
              <div style={{ fontSize:".65rem", color:C.muted, fontFamily:"monospace", marginBottom:6 }}>LABOR HOURS</div>
              <input type="number" value={laborHours} onChange={e => setLaborHours(e.target.value)} style={inp} />
            </div>
            <div>
              <div style={{ fontSize:".65rem", color:C.muted, fontFamily:"monospace", marginBottom:6 }}>LABOR RATE ($/HR)</div>
              <input type="number" value={laborRate} onChange={e => setLaborRate(e.target.value)} style={inp} />
            </div>
            <div>
              <div style={{ fontSize:".65rem", color:C.muted, fontFamily:"monospace", marginBottom:6 }}>CREW SIZE</div>
              <input type="number" value={crewSize} onChange={e => setCrewSize(e.target.value)} style={inp} />
            </div>
            <div>
              <div style={{ fontSize:".65rem", color:C.muted, fontFamily:"monospace", marginBottom:6 }}>MATERIALS ($)</div>
              <input type="number" value={materialCost} onChange={e => setMaterialCost(e.target.value)} style={inp} />
            </div>
            <div style={{ gridColumn:"1 / -1" }}>
              <div style={{ fontSize:".65rem", color:C.muted, fontFamily:"monospace", marginBottom:6 }}>OTHER COSTS ($)</div>
              <input type="number" value={otherCost} onChange={e => setOtherCost(e.target.value)} style={inp} />
            </div>
            <div style={{ gridColumn:"1 / -1" }}>
              <div style={{ fontSize:".65rem", color:C.muted, fontFamily:"monospace", marginBottom:6 }}>NOTES</div>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} style={{ ...inp, resize:"vertical" as const }} placeholder="Any notes about this job..." />
            </div>
          </div>

          <button onClick={save} disabled={saving} style={{ width:"100%", padding:"13px 0", borderRadius:8, border:"none", background:saved ? C.green : C.accent, color:"#000", fontWeight:700, cursor:"pointer", fontSize:".95rem", marginTop:20 }}>
            {saving ? "Saving..." : saved ? "Saved ✓" : "Save Job Costs"}
          </button>
        </div>

        {/* Nav to photos */}
        <button onClick={() => router.push(`/dashboard/quote/${id}/photos`)} style={{ padding:"13px", borderRadius:8, border:`1px solid ${C.border}`, background:"transparent", color:C.muted, fontWeight:600, cursor:"pointer", fontSize:".88rem" }}>
          📸 View Before & After Photos →
        </button>

      </div>
    </NavLayout>
  );
}
