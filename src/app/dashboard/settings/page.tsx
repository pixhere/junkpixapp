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
  bg: "#0F172A", surface: "#0F172A", card: "#1E2937", border: "#2D3748",
  accent: "#00D4C8", accentDim: "rgba(0,212,200,0.1)", text: "#F1F5F9",
  muted: "#94A3B8", green: "#22c55e", red: "#ef4444",
};

const inp: any = { width:"100%", padding:"11px 14px", borderRadius:8, border:"1px solid #2D3748", background:"#0F172A", color:"#F1F5F9", fontSize:".88rem", outline:"none", boxSizing:"border-box", fontFamily:"inherit", marginBottom:12 };

const TABS = [
  { id:"business",     label:"Business" },
  { id:"pricing",      label:"Pricing" },
  { id:"subscription", label:"Subscription" },
  { id:"quoteform",    label:"Quote Form" },
  { id:"payments",     label:"Payments" },
  { id:"account",      label:"Account" },
  { id:"support",      label:"Support" },
];

export default function SettingsPage() {
  const router = useRouter();
  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const setupSuccess = searchParams?.get("setup") === "success";
  const [operator, setOperator] = useState<any>(null);
  const [tab, setTab] = useState("business");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [formConfig, setFormConfig] = useState<any[]>([]);
  const [newItemType, setNewItemType] = useState("location");
  const [newItemLabel, setNewItemLabel] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("0");
  const [addingItem, setAddingItem] = useState(false);
  const [connectStatus, setConnectStatus] = useState("");
  const [connectLoading, setConnectLoading] = useState(false);
  const [requireDeposit, setRequireDeposit] = useState(false);
  const [depositAmount, setDepositAmount] = useState("50");

  // Business
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [slug, setSlug] = useState("");
  const [reviewLink, setReviewLink] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookEnabled, setWebhookEnabled] = useState(false);

  // Social Media
  const [fbPageId, setFbPageId] = useState("");
  const [igAccountId, setIgAccountId] = useState("");
  const [googleBizId, setGoogleBizId] = useState("");
  const [nextdoorId, setNextdoorId] = useState("");
  const [tiktokId, setTiktokId] = useState("");
  const [n8nWebhookUrl, setN8nWebhookUrl] = useState("");
  const [extraSocials, setExtraSocials] = useState<{label:string,value:string}[]>([]);
  const [socialSaved, setSocialSaved] = useState(false);

  // Pricing
  const [minJob, setMinJob] = useState("150");
  const [dump, setDump] = useState("113.49");
  const [dumpConstruction, setDumpConstruction] = useState("106");
  const [dumpMinimum, setDumpMinimum] = useState("40");
  const [milesToDump, setMilesToDump] = useState("5");
  const [labor, setLabor] = useState("20");
  const [crew, setCrew] = useState("2");
  const [gas, setGas] = useState("3.50");
  const [margin, setMargin] = useState("300");
  const [priceMinMin, setPriceMinMin] = useState("150");
  const [priceMinMax, setPriceMinMax] = useState("200");
  const [priceQuarterMin, setPriceQuarterMin] = useState("300");
  const [priceQuarterMax, setPriceQuarterMax] = useState("400");
  const [priceHalfMin, setPriceHalfMin] = useState("475");
  const [priceHalfMax, setPriceHalfMax] = useState("575");
  const [priceFullMin, setPriceFullMin] = useState("875");
  const [priceFullMax, setPriceFullMax] = useState("975");

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data: op } = await supabase.from("operators").select("*").eq("id", user.id).single();
      if (op) {
        setOperator(op);
        setBusinessName(op.business_name || "");
        setPhone(op.phone || "");
        setWebsite(op.website || "");
        setOwnerName(op.owner_name || "");
        setSlug(op.slug || "");
        setReviewLink(op.review_link || "");
        setWebhookUrl(op.webhook_url || "");
        setWebhookEnabled(op.webhook_enabled || false);
        setFbPageId(op.fb_page_id || "");
        setIgAccountId(op.ig_account_id || "");
        setGoogleBizId(op.google_biz_id || "");
        setNextdoorId(op.nextdoor_id || "");
        setTiktokId(op.tiktok_id || "");
        setN8nWebhookUrl(op.n8n_webhook_url || "");
        setExtraSocials(op.extra_socials || []);
        setMinJob(String(op.minimum_job || 150));
        setDump(String(op.dump_fee_per_ton || 113.49));
        setDumpConstruction(String(op.dump_fee_construction || 106));
        setDumpMinimum(String(op.dump_fee_minimum || 40));
        setMilesToDump(String(op.dump_miles_to_site || 5));
        setLabor(String(op.labor_rate_per_hour || 20));
        setCrew(String(op.crew_size || 2));
        setGas(String(op.gas_price || 3.50));
        setMargin(String(op.margin_percent || 300));
        setPriceMinMin(String(op.price_minimum_min || 150));
        setPriceMinMax(String(op.price_minimum_max || 200));
        setPriceQuarterMin(String(op.price_quarter_min || 300));
        setPriceQuarterMax(String(op.price_quarter_max || 400));
        setPriceHalfMin(String(op.price_half_min || 475));
        setPriceHalfMax(String(op.price_half_max || 575));
        setPriceFullMin(String(op.price_full_min || 875));
        setPriceFullMax(String(op.price_full_max || 975));
        setRequireDeposit(op.stripe_connect_require_deposit || false);
        setDepositAmount(String(op.stripe_connect_deposit_amount || 50));
      }
      const { data: fc } = await supabase.from("quote_form_config").select("*").eq("operator_id", user.id).order("sort_order");
      if (fc) setFormConfig(fc);
      setLoadingConfig(false);
      const { data: sc } = await supabase.from("operators").select("stripe_account_id").eq("id", user.id).single();
      if (sc?.stripe_account_id) setConnectStatus("active");
    };
    load();
  }, []);

  const save = async () => {
    if (!operator) return;
    setSaving(true);
    await supabase.from("operators").update({
      business_name: businessName, phone, website,
      owner_name: ownerName, slug: slug.toLowerCase().replace(/[^a-z0-9]/g,""),
      review_link: reviewLink, webhook_url: webhookUrl, webhook_enabled: webhookEnabled,
      minimum_job: parseInt(minJob), dump_fee_per_ton: parseFloat(dump),
      dump_fee_construction: parseFloat(dumpConstruction), dump_fee_minimum: parseFloat(dumpMinimum),
      dump_miles_to_site: parseInt(milesToDump), labor_rate_per_hour: parseFloat(labor),
      crew_size: parseInt(crew), gas_price: parseFloat(gas), margin_percent: parseInt(margin),
      price_minimum_min: parseInt(priceMinMin), price_minimum_max: parseInt(priceMinMax),
      price_quarter_min: parseInt(priceQuarterMin), price_quarter_max: parseInt(priceQuarterMax),
      price_half_min: parseInt(priceHalfMin), price_half_max: parseInt(priceHalfMax),
      price_full_min: parseInt(priceFullMin), price_full_max: parseInt(priceFullMax),
    }).eq("id", operator.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const Field = ({ label, value, setter, type="text", note="" }: any) => (
    <div>
      <div style={{ fontSize:".65rem", color:C.muted, fontFamily:"monospace", marginBottom:4 }}>{label}</div>
      <input type={type} value={value} onChange={e => setter(e.target.value)} style={inp} />
      {note && <div style={{ fontSize:".68rem", color:C.muted, marginTop:-8, marginBottom:12, fontStyle:"italic" }}>{note}</div>}
    </div>
  );

  return (
    <NavLayout active="settings" title="⚙️ Settings">
      <div style={{ maxWidth:700, margin:"0 auto", padding:16 }}>

        <div style={{ fontSize:"1.4rem", fontWeight:800, color:C.text, marginBottom:16 }}>Settings</div>

        {/* Tab nav */}
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" as const, marginBottom:20 }}>
          {[
            { id:"business",     label:"🏢 Business" },
            { id:"pricing",      label:"💰 Pricing" },
            { id:"quoteform",    label:"📋 Quote Form" },
            { id:"payments",     label:"💳 Payments" },
            { id:"subscription", label:"📦 Subscription" },
            { id:"account",      label:"🔐 Account" },
            { id:"support",      label:"🆘 Support" },
            { id:"social",       label:"📱 Social Media" },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ padding:"8px 14px", borderRadius:8, border:"1px solid "+(tab===t.id ? C.accent : C.border), background:tab===t.id ? C.accentDim : "transparent", color:tab===t.id ? C.accent : C.muted, cursor:"pointer", fontSize:".82rem", fontWeight:tab===t.id ? 700 : 400 }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Business */}
        {tab === "business" && (
          <div style={{ background:C.card, border:"1px solid "+C.border, borderRadius:12, padding:20 }}>
            <Field label="BUSINESS NAME" value={businessName} setter={setBusinessName} />
            <Field label="PHONE" value={phone} setter={setPhone} type="tel" />
            <Field label="WEBSITE" value={website} setter={setWebsite} />
            <div style={{ fontSize:".65rem", color:C.muted, fontFamily:"monospace", marginBottom:4 }}>YOUR QUOTE PAGE URL</div>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
              <span style={{ color:C.muted, fontSize:".84rem", whiteSpace:"nowrap" as const }}>junkpix.com/quote/</span>
              <input type="text" value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g,""))} style={{ ...inp, marginBottom:0 }} placeholder="yourbusiness" />
            </div>
            <Field label="YOUR FIRST NAME" value={ownerName} setter={setOwnerName} note="Shown on quote page and emails" />
            <Field label="GOOGLE/YELP REVIEW LINK" value={reviewLink} setter={setReviewLink} />
            <div style={{ fontSize:".65rem", color:C.muted, fontFamily:"monospace", marginBottom:8 }}>WEBHOOK</div>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
              <div style={{ fontSize:".84rem", color:C.text }}>Enable Webhook</div>
              <div onClick={() => setWebhookEnabled(!webhookEnabled)} style={{ width:44, height:24, borderRadius:12, background:webhookEnabled ? C.accent : C.border, cursor:"pointer", position:"relative" as const }}>
                <div style={{ width:20, height:20, borderRadius:"50%", background:"#fff", position:"absolute" as const, top:2, left:webhookEnabled ? 22 : 2, transition:"left .2s" }} />
              </div>
            </div>
            <input type="url" placeholder="https://your-n8n.com/webhook/junkpix" value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} style={inp} />
          </div>
        )}

        {/* Pricing */}
        {tab === "pricing" && (
          <div style={{ background:C.card, border:"1px solid "+C.border, borderRadius:12, padding:20 }}>
            <div style={{ fontWeight:700, color:C.text, marginBottom:4 }}>Your Real Costs</div>
            <div style={{ fontSize:".78rem", color:C.muted, marginBottom:16 }}>AI uses these to calculate accurate prices for your market.</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <Field label="REGULAR DUMP $/TON" value={dump} setter={setDump} type="number" />
              <Field label="CONSTRUCTION DUMP $/TON" value={dumpConstruction} setter={setDumpConstruction} type="number" />
              <Field label="MIN DUMP FEE ($)" value={dumpMinimum} setter={setDumpMinimum} type="number" />
              <Field label="MILES TO DUMP" value={milesToDump} setter={setMilesToDump} type="number" />
              <Field label="LABOR $/HOUR" value={labor} setter={setLabor} type="number" />
              <Field label="CREW SIZE" value={crew} setter={setCrew} type="number" />
              <Field label="GAS PRICE ($)" value={gas} setter={setGas} type="number" />
              <Field label="MARGIN %" value={margin} setter={setMargin} type="number" />
            </div>
            <div style={{ fontWeight:700, color:C.text, marginBottom:4, marginTop:8 }}>Load Tier Prices</div>
            <div style={{ fontSize:".78rem", color:C.muted, marginBottom:12 }}>Override AI pricing with fixed ranges.</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              <Field label="MIN JOB MIN ($)" value={priceMinMin} setter={setPriceMinMin} type="number" />
              <Field label="MIN JOB MAX ($)" value={priceMinMax} setter={setPriceMinMax} type="number" />
              <Field label="QUARTER MIN ($)" value={priceQuarterMin} setter={setPriceQuarterMin} type="number" />
              <Field label="QUARTER MAX ($)" value={priceQuarterMax} setter={setPriceQuarterMax} type="number" />
              <Field label="HALF MIN ($)" value={priceHalfMin} setter={setPriceHalfMin} type="number" />
              <Field label="HALF MAX ($)" value={priceHalfMax} setter={setPriceHalfMax} type="number" />
              <Field label="FULL MIN ($)" value={priceFullMin} setter={setPriceFullMin} type="number" />
              <Field label="FULL MAX ($)" value={priceFullMax} setter={setPriceFullMax} type="number" />
            </div>
          </div>
        )}

        {/* Subscription */}
        {tab === "subscription" && (
          <div style={{ background:C.card, border:"1px solid "+C.border, borderRadius:12, padding:20 }}>
            <div style={{ fontWeight:700, color:C.text, marginBottom:4 }}>Subscription</div>
            <div style={{ fontSize:".82rem", color:C.muted, marginBottom:20 }}>
              {operator?.subscription_status === "active" ? "✅ Active subscription" :
               operator?.subscription_status === "past_due" ? "⚠️ Payment past due" :
               operator?.subscription_status === "cancelled" ? "❌ Subscription cancelled" :
               "🕐 Free trial — " + (operator?.trial_ends_at ? Math.max(0, Math.ceil((new Date(operator.trial_ends_at).getTime() - Date.now()) / 86400000)) : 30) + " days left"}
            </div>
            {operator?.subscription_status !== "active" && (
              <div style={{ display:"flex", flexDirection:"column" as const, gap:10 }}>
                <div style={{ fontSize:".72rem", color:C.muted, fontFamily:"monospace", letterSpacing:".08em", marginBottom:4 }}>CHOOSE YOUR PLAN</div>
                {[
                  { label:"Founding Operator", price:"$49/mo", priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_FOUNDING, badge:"🔥 19 spots left" },
                  { label:"Standard", price:"$99/mo", priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_STANDARD, badge:"" },
                  { label:"Agency / Team", price:"$199/mo", priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_AGENCY, badge:"" },
                ].map(plan => (
                  <button key={plan.label} onClick={async () => {
                    const res = await fetch("/api/create-checkout", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ priceId: plan.priceId, operatorId: operator?.id, email: operator?.email }) });
                    const data = await res.json();
                    if (data.url) window.location.href = data.url;
                  }} style={{ padding:"12px 16px", borderRadius:8, border:"1px solid "+C.border, background:C.surface, color:C.text, fontWeight:600, cursor:"pointer", fontSize:".88rem", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span>{plan.label} {plan.badge && <span style={{ fontSize:".7rem", color:C.accent, marginLeft:6 }}>{plan.badge}</span>}</span>
                    <span style={{ color:C.accent, fontWeight:700 }}>{plan.price}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Quote Form */}
        {tab === "quoteform" && (
          <div style={{ background:C.card, border:"1px solid "+C.border, borderRadius:12, padding:20 }}>
            <div style={{ fontWeight:700, color:C.text, marginBottom:4 }}>Quote Form Options</div>
            <div style={{ fontSize:".82rem", color:C.muted, marginBottom:20 }}>Customize what customers see and set price impacts for each option.</div>
            {loadingConfig ? (
              <div style={{ color:C.muted, fontSize:".84rem" }}>Loading...</div>
            ) : (
              <>
                {["location","condition","distance","extra","special_item"].map(fieldType => (
                  <div key={fieldType} style={{ marginBottom:24 }}>
                    <div style={{ fontSize:".7rem", color:C.accent, fontFamily:"monospace", letterSpacing:".1em", fontWeight:700, marginBottom:12 }}>
                      {fieldType === "location" ? "📍 LOCATION OPTIONS" : fieldType === "condition" ? "⚠️ CONDITION OPTIONS" : fieldType === "distance" ? "📏 DISTANCE OPTIONS" : fieldType === "special_item" ? "🎹 SPECIAL ITEMS (Piano, Safe, Hot Tub, etc.)" : "➕ EXTRA CHARGES"}
                    </div>
                    {formConfig.filter(c => c.field_type === fieldType).map(item => (
                      <div key={item.id} style={{ display:"flex", gap:8, alignItems:"center", marginBottom:8 }}>
                        <input type="text" value={item.label} onChange={e => setFormConfig(prev => prev.map(c => c.id === item.id ? {...c, label: e.target.value} : c))} style={{ ...inp, flex:2, marginBottom:0 }} placeholder="Label" />
                        <div style={{ display:"flex", alignItems:"center", gap:4, flexShrink:0 }}>
                          <span style={{ fontSize:".75rem", color:C.muted }}>+$</span>
                          <input type="number" value={item.price_impact} onChange={e => setFormConfig(prev => prev.map(c => c.id === item.id ? {...c, price_impact: parseInt(e.target.value)||0} : c))} style={{ ...inp, width:70, marginBottom:0 }} />
                        </div>
                        <button onClick={async () => { await supabase.from("quote_form_config").delete().eq("id", item.id); setFormConfig(prev => prev.filter(c => c.id !== item.id)); }} style={{ padding:"8px 12px", borderRadius:6, border:"1px solid rgba(239,68,68,0.3)", background:"transparent", color:C.red, cursor:"pointer", fontSize:".8rem", flexShrink:0 }}>✕</button>
                      </div>
                    ))}
                  </div>
                ))}
                <button onClick={async () => {
                  for (const item of formConfig) {
                    await supabase.from("quote_form_config").update({ label: item.label, price_impact: item.price_impact }).eq("id", item.id);
                  }
                  setSaved(true); setTimeout(() => setSaved(false), 2000);
                }} style={{ width:"100%", padding:"11px 0", borderRadius:8, border:"none", background:C.accent, color:"#000", fontWeight:700, cursor:"pointer", fontSize:".88rem", marginBottom:16 }}>
                  {saved ? "Saved ✓" : "Save Form Options"}
                </button>
                <div style={{ borderTop:"1px solid "+C.border, paddingTop:16 }}>
                  <div style={{ fontSize:".7rem", color:C.muted, fontFamily:"monospace", marginBottom:10 }}>ADD NEW OPTION</div>
                  <div style={{ display:"flex", gap:8, marginBottom:8 }}>
                    <select value={newItemType} onChange={e => setNewItemType(e.target.value)} style={{ ...inp, flex:1, marginBottom:0 }}>
                      <option value="location">Location</option>
                      <option value="condition">Condition</option>
                      <option value="distance">Distance</option>
                      <option value="extra">Extra Charge</option>
                      <option value="special_item">Special Item</option>
                    </select>
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    <input type="text" value={newItemLabel} onChange={e => setNewItemLabel(e.target.value)} style={{ ...inp, flex:2, marginBottom:0 }} placeholder="e.g. Tight hallway" />
                    <div style={{ display:"flex", alignItems:"center", gap:4, flexShrink:0 }}>
                      <span style={{ fontSize:".75rem", color:C.muted }}>+$</span>
                      <input type="number" value={newItemPrice} onChange={e => setNewItemPrice(e.target.value)} style={{ ...inp, width:70, marginBottom:0 }} placeholder="0" />
                    </div>
                    <button onClick={async () => {
                      if (!newItemLabel.trim() || !operator) return;
                      setAddingItem(true);
                      const { data } = await supabase.from("quote_form_config").insert({ operator_id: operator.id, field_type: newItemType, label: newItemLabel, value: newItemLabel.toLowerCase().replace(/\s+/g,"_"), price_impact: parseInt(newItemPrice)||0, sort_order: formConfig.filter(c => c.field_type === newItemType).length+1 }).select().single();
                      if (data) setFormConfig(prev => [...prev, data]);
                      setNewItemLabel(""); setNewItemPrice("0"); setAddingItem(false);
                    }} disabled={!newItemLabel.trim() || addingItem} style={{ padding:"8px 16px", borderRadius:8, border:"none", background:newItemLabel.trim() ? C.green : "rgba(34,197,94,0.3)", color:"#000", fontWeight:700, cursor:newItemLabel.trim() ? "pointer" : "not-allowed", fontSize:".82rem", flexShrink:0 }}>+ Add</button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Payments */}
        {tab === "payments" && (
          <div style={{ background:C.card, border:"1px solid "+C.border, borderRadius:12, padding:20 }}>
            <div style={{ fontWeight:700, color:C.text, marginBottom:16 }}>💳 Payments</div>

            {/* Lead Network Billing */}
            <div style={{ background:C.surface, border:"1px solid "+C.border, borderRadius:10, padding:20, marginBottom:20 }}>
              {setupSuccess && (
                <div style={{ background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.3)", borderRadius:8, padding:12, marginBottom:12 }}>
                  <div style={{ color:C.green, fontWeight:700, fontSize:".88rem" }}>🎉 Payment method added successfully!</div>
                </div>
              )}
              <div style={{ fontSize:".65rem", color:C.accent, fontFamily:"monospace", fontWeight:700, marginBottom:8 }}>LEAD NETWORK BILLING</div>
              <div style={{ fontSize:".82rem", color:C.muted, marginBottom:16, lineHeight:1.6 }}>
                Add a card to receive JunkPix leads. You're billed $25 for completed jobs and $5 for leads that don't book — charged every 2 weeks automatically.
              </div>
              {operator?.lead_payment_method_id ? (
                <div style={{ background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.3)", borderRadius:8, padding:14, marginBottom:12 }}>
                  <div style={{ color:C.green, fontWeight:700, fontSize:".88rem" }}>✅ Payment Method on File</div>
                  <div style={{ color:C.muted, fontSize:".75rem", marginTop:4 }}>You're ready to receive leads. Billing runs every 2 weeks.</div>
                </div>
              ) : (
                <div style={{ background:"rgba(0,212,200,0.08)", border:"1px solid "+C.accent, borderRadius:8, padding:14, marginBottom:12 }}>
                  <div style={{ color:C.accent, fontWeight:700, fontSize:".88rem" }}>⚠️ No Payment Method</div>
                  <div style={{ color:C.muted, fontSize:".75rem", marginTop:4 }}>Add a card to start receiving leads from JunkPix.</div>
                </div>
              )}
              <button
                onClick={async () => {
                  try {
                    const res = await fetch("/api/setup-payment-method", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ operatorId: operator?.id, email: operator?.email }),
                    });
                    const data = await res.json();
                    if (data.url) {
                      window.location.href = data.url;
                    }
                  } catch (e) {
                    console.error(e);
                  }
                }}
                style={{ width:"100%", padding:"12px 0", borderRadius:8, border:"none", background:C.accent, color:"#000", fontWeight:700, cursor:"pointer", fontSize:".88rem" }}
              >
                {operator?.lead_payment_method_id ? "Update Payment Method →" : "Add Payment Method →"}
              </button>
            </div>

            <div style={{ fontSize:".82rem", color:C.muted, marginBottom:20 }}>Connect your Stripe account to collect deposits directly from customers. Money goes straight to you — JunkPix never touches it.</div>
            {connectStatus === "active" ? (
              <div style={{ background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.3)", borderRadius:8, padding:16, marginBottom:16 }}>
                <div style={{ color:C.green, fontWeight:700, fontSize:".88rem" }}>✅ Stripe Connected</div>
                <div style={{ color:C.muted, fontSize:".78rem", marginTop:4 }}>You're ready to collect deposits from customers.</div>
              </div>
            ) : (
              <button onClick={async () => {
                setConnectLoading(true);
                try {
                  const res = await fetch("/api/stripe-connect/onboard", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ operatorId: operator?.id, email: operator?.email }) });
                  const data = await res.json();
                  if (data.url) window.location.href = data.url;
                } catch { setConnectLoading(false); }
              }} disabled={connectLoading} style={{ width:"100%", padding:"13px 0", borderRadius:8, border:"none", background:connectLoading ? "rgba(217,123,79,0.3)" : C.accent, color:connectLoading ? "rgba(0,0,0,0.3)" : "#000", fontWeight:700, cursor:connectLoading ? "not-allowed" : "pointer", fontSize:".9rem", marginBottom:16 }}>
                {connectLoading ? "Connecting..." : "Connect Your Stripe Account →"}
              </button>
            )}
            <div style={{ borderTop:"1px solid "+C.border, paddingTop:16 }}>
              <div style={{ fontSize:".7rem", color:C.muted, fontFamily:"monospace", marginBottom:12 }}>DEPOSIT SETTINGS</div>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                <div>
                  <div style={{ fontSize:".86rem", color:C.text, fontWeight:600 }}>Require deposit at booking</div>
                  <div style={{ fontSize:".75rem", color:C.muted }}>Customer pays before job is confirmed</div>
                </div>
                <div onClick={() => setRequireDeposit(!requireDeposit)} style={{ width:44, height:24, borderRadius:12, background:requireDeposit ? C.accent : C.border, cursor:"pointer", position:"relative" as const, transition:"background .2s" }}>
                  <div style={{ width:20, height:20, borderRadius:"50%", background:"#fff", position:"absolute" as const, top:2, left:requireDeposit ? 22 : 2, transition:"left .2s" }} />
                </div>
              </div>
              <div style={{ fontSize:".7rem", color:C.muted, fontFamily:"monospace", marginBottom:6 }}>DEPOSIT AMOUNT ($)</div>
              <input type="number" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} style={inp} placeholder="50" />
              <button onClick={async () => {
                await supabase.from("operators").update({ stripe_connect_deposit_amount: parseInt(depositAmount), stripe_connect_require_deposit: requireDeposit }).eq("id", operator.id);
                setSaved(true); setTimeout(() => setSaved(false), 2000);
              }} style={{ width:"100%", padding:"11px 0", borderRadius:8, border:"none", background:C.accent, color:"#000", fontWeight:700, cursor:"pointer", fontSize:".88rem" }}>
                {saved ? "Saved ✓" : "Save Payment Settings"}
              </button>
            </div>
          </div>
        )}

        {/* Account */}
        {tab === "account" && (
          <div style={{ background:C.card, border:"1px solid "+C.border, borderRadius:12, padding:20 }}>
            <div style={{ marginBottom:16 }}>
              <div style={{ fontWeight:700, color:C.text, marginBottom:4 }}>Account</div>
              <div style={{ fontSize:".84rem", color:C.muted }}>{operator?.email}</div>
            </div>
            <button onClick={async () => { await supabase.auth.signOut(); router.push("/login"); }} style={{ width:"100%", padding:"12px 0", borderRadius:8, border:"1px solid rgba(239,68,68,0.3)", background:"transparent", color:C.red, fontWeight:600, cursor:"pointer", fontSize:".9rem" }}>
              Log Out
            </button>
          </div>
        )}

        {/* Support */}
        {tab === "support" && (
          <div style={{ display:"flex", flexDirection:"column" as const, gap:12 }}>
            {[
              { label:"📧 Email Support", desc:"We typically respond within a few hours.", href:"mailto:junkpixapp@gmail.com", btnLabel:"Email Us →", color:C.accent, bg:C.accent },
              { label:"💬 Feature Requests", desc:"Have an idea to make JunkPix better?", href:"mailto:junkpixapp@gmail.com?subject=Feature Request", btnLabel:"Send Idea →", color:C.text, bg:"transparent" },
              { label:"🐛 Report a Bug", desc:"Something not working right?", href:"mailto:junkpixapp@gmail.com?subject=Bug Report", btnLabel:"Report Bug →", color:C.red, bg:"transparent" },
            ].map(item => (
              <div key={item.label} style={{ background:C.card, border:"1px solid "+C.border, borderRadius:12, padding:20 }}>
                <div style={{ fontWeight:700, color:C.text, marginBottom:4 }}>{item.label}</div>
                <div style={{ fontSize:".84rem", color:C.muted, marginBottom:12 }}>{item.desc}</div>
                <a href={item.href} style={{ display:"inline-block", padding:"10px 20px", borderRadius:8, background:item.bg, border:"1px solid "+(item.color === C.accent ? C.accent : item.color === C.red ? "rgba(239,68,68,0.3)" : C.border), color:item.color === C.accent ? "#000" : item.color, fontWeight:700, fontSize:".88rem", textDecoration:"none" }}>{item.btnLabel}</a>
              </div>
            ))}
          </div>
        )}

        {/* Social Media */}
        {tab === "social" && (
          <div style={{ background:C.card, border:"1px solid "+C.border, borderRadius:12, padding:20 }}>
            <div style={{ fontWeight:700, color:C.text, marginBottom:4 }}>📱 Social Media</div>
            <div style={{ fontSize:".82rem", color:C.muted, marginBottom:20 }}>Connect your social accounts so JunkPix can auto-post before/after content via N8N.</div>

            <Field label="FACEBOOK PAGE ID" value={fbPageId} setter={setFbPageId} />
            <Field label="INSTAGRAM ACCOUNT ID" value={igAccountId} setter={setIgAccountId} />
            <Field label="GOOGLE BUSINESS ID" value={googleBizId} setter={setGoogleBizId} />
            <Field label="NEXTDOOR ID" value={nextdoorId} setter={setNextdoorId} />
            <Field label="TIKTOK ACCOUNT ID" value={tiktokId} setter={setTiktokId} />

            {extraSocials.map((s, i) => (
              <div key={i} style={{ display:"flex", gap:8, marginBottom:12 }}>
                <input value={s.label} onChange={e => setExtraSocials(prev => prev.map((x,j) => j===i ? {...x, label:e.target.value} : x))} placeholder="Platform name" style={{ ...inp, flex:1, marginBottom:0 }} />
                <input value={s.value} onChange={e => setExtraSocials(prev => prev.map((x,j) => j===i ? {...x, value:e.target.value} : x))} placeholder="ID or URL" style={{ ...inp, flex:2, marginBottom:0 }} />
                <button onClick={() => setExtraSocials(prev => prev.filter((_,j) => j!==i))} style={{ padding:"8px 12px", borderRadius:6, border:"1px solid rgba(239,68,68,0.3)", background:"transparent", color:C.red, cursor:"pointer", fontSize:".8rem" }}>✕</button>
              </div>
            ))}

            <button onClick={() => setExtraSocials(prev => [...prev, {label:"", value:""}])} style={{ width:"100%", padding:"10px", borderRadius:8, border:"1px dashed "+C.border, background:"transparent", color:C.muted, cursor:"pointer", fontSize:".84rem", marginBottom:16 }}>
              + Add More
            </button>

            <button onClick={async () => {
              await supabase.from("operators").update({
                fb_page_id: fbPageId,
                ig_account_id: igAccountId,
                google_biz_id: googleBizId,
                nextdoor_id: nextdoorId,
                tiktok_id: tiktokId,
                n8n_webhook_url: n8nWebhookUrl,
                extra_socials: extraSocials,
              }).eq("id", operator.id);
              setSocialSaved(true);
              setTimeout(() => setSocialSaved(false), 2000);
            }} style={{ width:"100%", padding:"13px 0", borderRadius:8, border:"none", background:socialSaved ? C.green : C.accent, color:"#000", fontWeight:700, cursor:"pointer", fontSize:".9rem" }}>
              {socialSaved ? "Saved ✓" : "Save Social Settings"}
            </button>
          </div>
        )}

        {/* Save button */}
        {(tab === "business" || tab === "pricing") && (
          <button onClick={save} disabled={saving} style={{ width:"100%", padding:"14px 0", borderRadius:8, border:"none", background:saved ? C.green : C.accent, color:"#000", fontWeight:700, cursor:"pointer", fontSize:".95rem", marginTop:16 }}>
            {saving ? "Saving..." : saved ? "Saved ✓" : "Save Settings"}
          </button>
        )}

      </div>
    </NavLayout>
  );
}
