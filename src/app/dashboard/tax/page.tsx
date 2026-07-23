"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import NavLayout from "@/components/NavLayout";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const C = {
  bg:"#0F172A", card:"#1E2937", surface:"#162032", border:"#2D3748",
  accent:"#00D4C8", accentDim:"rgba(0,212,200,0.08)", text:"#F1F5F9",
  muted:"#94A3B8", green:"#22C55E", yellow:"#F59E0B", red:"#ef4444",
};

const SE_TAX = 15.3;

const QUARTERS = [
  { label:"Q1", period:"Jan 1 – Mar 31", due:"April 15" },
  { label:"Q2", period:"Apr 1 – May 31", due:"June 15" },
  { label:"Q3", period:"Jun 1 – Aug 31", due:"September 15" },
  { label:"Q4", period:"Sep 1 – Dec 31", due:"January 15" },
];

export default function TaxEstimatorPage() {
  const [operator, setOperator] = useState<any>(null);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Tax rates
  const [federalRate, setFederalRate] = useState("");
  const [stateRate, setStateRate] = useState("");
  const [localRate, setLocalRate] = useState("");
  const [country, setCountry] = useState("US");
  const [manualIncome, setManualIncome] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: op } = await supabase
        .from("operators")
        .select("*")
        .eq("id", user.id)
        .single();

      if (op) {
        setOperator(op);
        setFederalRate(op.tax_federal_rate?.toString() || "");
        setStateRate(op.tax_state_rate?.toString() || "");
        setLocalRate(op.tax_local_rate?.toString() || "");
        setCountry(op.tax_country || "US");
      }

      const { data: qs } = await supabase
        .from("quote_requests")
        .select("final_price, actual_total_cost, created_at, status")
        .eq("operator_id", user.id)
        .eq("status", "completed")
        .not("final_price", "is", null);

      if (qs) setQuotes(qs);
      setLoading(false);
    };
    load();
  }, []);

  const saveRates = async () => {
    if (!operator) return;
    setSaving(true);
    await supabase.from("operators").update({
      tax_federal_rate: parseFloat(federalRate) || 0,
      tax_state_rate: parseFloat(stateRate) || 0,
      tax_local_rate: parseFloat(localRate) || 0,
      tax_country: country,
    }).eq("id", operator.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  // Calculate YTD income from completed jobs
  const jobIncome = quotes.reduce((s, q) => s + (q.final_price || 0), 0);
  const jobCosts = quotes.reduce((s, q) => s + (q.actual_total_cost || 0), 0);
  const jobProfit = jobIncome - jobCosts;
  const manualIncomeNum = parseFloat(manualIncome) || 0;
  const totalProfit = jobProfit + manualIncomeNum;

  const federal = parseFloat(federalRate) || 0;
  const state = parseFloat(stateRate) || 0;
  const local = parseFloat(localRate) || 0;
  const isUS = country === "US";

  const seTax = isUS ? (totalProfit * (SE_TAX / 100)) : 0;
  const federalTax = totalProfit * (federal / 100);
  const stateTax = totalProfit * (state / 100);
  const localTax = totalProfit * (local / 100);
  const totalTax = seTax + federalTax + stateTax + localTax;
  const quarterlyTax = totalTax / 4;

  const inp = {
    width:"100%", padding:"11px 14px", borderRadius:8,
    border:`1px solid ${C.border}`, background:C.surface,
    color:C.text, fontSize:".9rem", outline:"none", boxSizing:"border-box" as const,
  };

  if (loading) return (
    <NavLayout active="tax">
      <div style={{ padding:24, color:C.muted }}>Loading...</div>
    </NavLayout>
  );

  return (
    <NavLayout active="tax">
      <div style={{ padding:24, maxWidth:680, fontFamily:"system-ui,sans-serif" }}>

        {/* Header */}
        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:"1.4rem", fontWeight:800, color:C.text }}>🧾 Tax Estimator</div>
          <div style={{ fontSize:".84rem", color:C.muted, marginTop:4 }}>
            Estimate your quarterly tax obligations based on your JunkPix earnings.
          </div>
        </div>

        {/* Country selector */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20, marginBottom:16 }}>
          <div style={{ fontSize:".65rem", color:C.accent, fontFamily:"monospace", fontWeight:700, marginBottom:12 }}>YOUR LOCATION</div>
          <div style={{ display:"flex", gap:8 }}>
            {["US", "AU", "CA", "UK", "OTHER"].map(c => (
              <button key={c} onClick={() => setCountry(c)}
                style={{ flex:1, padding:"10px", borderRadius:8, border:`1px solid ${country === c ? C.accent : C.border}`, background: country === c ? C.accentDim : "transparent", color: country === c ? C.accent : C.muted, cursor:"pointer", fontWeight: country === c ? 700 : 400, fontSize:".82rem" }}>
                {c}
              </button>
            ))}
          </div>
          {country !== "US" && (
            <div style={{ marginTop:12, padding:12, background:"rgba(245,158,11,0.08)", border:"1px solid rgba(245,158,11,0.2)", borderRadius:8, fontSize:".78rem", color:C.yellow, lineHeight:1.6 }}>
              ⚠️ SE Tax (15.3%) is a US-specific tax and has been excluded. Enter your applicable tax rates below. Consult your country's tax authority for accurate rates:<br/>
              🇦🇺 Australia: <a href="https://ato.gov.au" target="_blank" rel="noreferrer" style={{ color:C.accent }}>ato.gov.au</a> &nbsp;·&nbsp;
              🇨🇦 Canada: <a href="https://canada.ca/taxes" target="_blank" rel="noreferrer" style={{ color:C.accent }}>canada.ca/taxes</a> &nbsp;·&nbsp;
              🇬🇧 UK: <a href="https://gov.uk/income-tax" target="_blank" rel="noreferrer" style={{ color:C.accent }}>gov.uk/income-tax</a>
            </div>
          )}
        </div>

        {/* Tax rates */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20, marginBottom:16 }}>
          <div style={{ fontSize:".65rem", color:C.accent, fontFamily:"monospace", fontWeight:700, marginBottom:16 }}>TAX RATES</div>

          {isUS && (
            <div style={{ background:C.surface, borderRadius:8, padding:14, marginBottom:16, fontSize:".82rem", color:C.muted, lineHeight:1.6 }}>
              🇺🇸 <strong style={{ color:C.text }}>Self-Employment Tax: 15.3%</strong> — automatically applied (fixed US federal rate).<br/>
              Find your rates: &nbsp;
              <a href="https://irs.gov/taxtopics/tc409" target="_blank" rel="noreferrer" style={{ color:C.accent }}>Federal (IRS.gov)</a> &nbsp;·&nbsp;
              <a href="https://taxfoundation.org/data/all/state/state-income-tax-rates" target="_blank" rel="noreferrer" style={{ color:C.accent }}>State rates</a> &nbsp;·&nbsp;
              Check your city/county website for local rates.
            </div>
          )}

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
            <div>
              <label style={{ fontSize:".72rem", color:C.muted, fontFamily:"monospace", display:"block", marginBottom:6 }}>
                {isUS ? "FEDERAL INCOME TAX %" : "INCOME TAX %"}
              </label>
              <input style={inp} type="number" placeholder="e.g. 22" value={federalRate} onChange={e => setFederalRate(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize:".72rem", color:C.muted, fontFamily:"monospace", display:"block", marginBottom:6 }}>
                {isUS ? "STATE INCOME TAX %" : "REGIONAL TAX %"}
              </label>
              <input style={inp} type="number" placeholder="e.g. 3.07" value={stateRate} onChange={e => setStateRate(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize:".72rem", color:C.muted, fontFamily:"monospace", display:"block", marginBottom:6 }}>LOCAL / MUNICIPAL TAX %</label>
              <input style={inp} type="number" placeholder="e.g. 1" value={localRate} onChange={e => setLocalRate(e.target.value)} />
            </div>
            {isUS && (
              <div style={{ background:C.surface, borderRadius:8, padding:14, display:"flex", alignItems:"center" }}>
                <div>
                  <div style={{ fontSize:".72rem", color:C.muted, fontFamily:"monospace", marginBottom:4 }}>SE TAX (AUTO)</div>
                  <div style={{ fontSize:"1.1rem", fontWeight:800, color:C.accent }}>15.3%</div>
                </div>
              </div>
            )}
          </div>

          <button onClick={saveRates} disabled={saving}
            style={{ width:"100%", marginTop:16, padding:"12px", borderRadius:8, border:"none", background: saved ? C.green : C.accent, color:"#000", fontWeight:700, cursor:"pointer", fontSize:".88rem" }}>
            {saving ? "Saving..." : saved ? "✅ Saved!" : "Save Tax Rates"}
          </button>
        </div>

        {/* Income */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20, marginBottom:16 }}>
          <div style={{ fontSize:".65rem", color:C.accent, fontFamily:"monospace", fontWeight:700, marginBottom:16 }}>INCOME THIS YEAR</div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:16 }}>
            <div style={{ background:C.surface, borderRadius:8, padding:12 }}>
              <div style={{ fontSize:".6rem", color:C.muted, marginBottom:4 }}>JOB REVENUE</div>
              <div style={{ fontSize:"1.1rem", fontWeight:800, color:C.text }}>${jobIncome.toLocaleString()}</div>
              <div style={{ fontSize:".68rem", color:C.muted }}>{quotes.length} completed jobs</div>
            </div>
            <div style={{ background:C.surface, borderRadius:8, padding:12 }}>
              <div style={{ fontSize:".6rem", color:C.muted, marginBottom:4 }}>JOB COSTS</div>
              <div style={{ fontSize:"1.1rem", fontWeight:800, color:C.red }}>${jobCosts.toLocaleString()}</div>
            </div>
            <div style={{ background:C.surface, borderRadius:8, padding:12 }}>
              <div style={{ fontSize:".6rem", color:C.muted, marginBottom:4 }}>NET PROFIT</div>
              <div style={{ fontSize:"1.1rem", fontWeight:800, color:C.green }}>${jobProfit.toLocaleString()}</div>
            </div>
          </div>

          <div>
            <label style={{ fontSize:".72rem", color:C.muted, fontFamily:"monospace", display:"block", marginBottom:6 }}>ADDITIONAL INCOME (manual entry)</label>
            <input style={inp} type="number" placeholder="Income not tracked in JunkPix" value={manualIncome} onChange={e => setManualIncome(e.target.value)} />
            <div style={{ fontSize:".72rem", color:C.muted, marginTop:4 }}>Include cash jobs, side income, or any revenue outside JunkPix</div>
          </div>

          <div style={{ marginTop:16, padding:14, background:C.accentDim, border:`1px solid ${C.accent}`, borderRadius:8, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div style={{ fontSize:".82rem", color:C.muted }}>Total Taxable Profit</div>
            <div style={{ fontSize:"1.3rem", fontWeight:800, color:C.accent }}>${totalProfit.toLocaleString()}</div>
          </div>
        </div>

        {/* Quarterly estimates */}
        {totalProfit > 0 && (federal > 0 || state > 0 || local > 0) && (
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20, marginBottom:16 }}>
            <div style={{ fontSize:".65rem", color:C.accent, fontFamily:"monospace", fontWeight:700, marginBottom:16 }}>QUARTERLY ESTIMATES</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:12, marginBottom:16 }}>
              {QUARTERS.map(q => (
                <div key={q.label} style={{ background:C.surface, borderRadius:10, padding:16 }}>
                  <div style={{ fontSize:".65rem", color:C.yellow, fontFamily:"monospace", fontWeight:700, marginBottom:4 }}>DUE: {q.due}</div>
                  <div style={{ fontSize:".72rem", color:C.muted, marginBottom:8 }}>{q.period}</div>
                  <div style={{ fontSize:"1.3rem", fontWeight:800, color:C.text }}>≈ ${Math.round(quarterlyTax).toLocaleString()}</div>
                  <div style={{ fontSize:".68rem", color:C.muted, marginTop:2 }}>{q.label} estimated payment</div>
                </div>
              ))}
            </div>

            {/* Breakdown */}
            <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:16 }}>
              <div style={{ fontSize:".65rem", color:C.muted, fontFamily:"monospace", marginBottom:12 }}>ANNUAL BREAKDOWN</div>
              {isUS && <div style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:`1px solid ${C.border}`, fontSize:".84rem" }}><span style={{ color:C.muted }}>Self-Employment Tax (15.3%)</span><span style={{ color:C.text, fontWeight:600 }}>≈ ${Math.round(seTax).toLocaleString()}</span></div>}
              {federal > 0 && <div style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:`1px solid ${C.border}`, fontSize:".84rem" }}><span style={{ color:C.muted }}>{isUS ? "Federal" : "Income"} Tax ({federal}%)</span><span style={{ color:C.text, fontWeight:600 }}>≈ ${Math.round(federalTax).toLocaleString()}</span></div>}
              {state > 0 && <div style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:`1px solid ${C.border}`, fontSize:".84rem" }}><span style={{ color:C.muted }}>{isUS ? "State" : "Regional"} Tax ({state}%)</span><span style={{ color:C.text, fontWeight:600 }}>≈ ${Math.round(stateTax).toLocaleString()}</span></div>}
              {local > 0 && <div style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:`1px solid ${C.border}`, fontSize:".84rem" }}><span style={{ color:C.muted }}>Local Tax ({local}%)</span><span style={{ color:C.text, fontWeight:600 }}>≈ ${Math.round(localTax).toLocaleString()}</span></div>}
              <div style={{ display:"flex", justifyContent:"space-between", padding:"10px 0 0", fontSize:"1rem" }}>
                <span style={{ color:C.text, fontWeight:700 }}>Total Annual Tax</span>
                <span style={{ color:C.yellow, fontWeight:800, fontSize:"1.2rem" }}>≈ ${Math.round(totalTax).toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div style={{ background:"rgba(245,158,11,0.06)", border:"1px solid rgba(245,158,11,0.2)", borderRadius:12, padding:16 }}>
          <div style={{ fontSize:".78rem", color:C.yellow, fontWeight:700, marginBottom:6 }}>⚠️ Important Disclaimer</div>
          <div style={{ fontSize:".75rem", color:C.muted, lineHeight:1.7 }}>
            All amounts shown are <strong style={{ color:C.text }}>approximately</strong> estimated based on the information you provided. These figures are not tax advice and should not be used as the sole basis for tax payments. Tax obligations vary based on deductions, filing status, and local regulations. <strong style={{ color:C.text }}>Always consult a licensed accountant or tax professional</strong> for your exact tax obligation before making any payments.
          </div>
        </div>

      </div>
    </NavLayout>
  );
}
