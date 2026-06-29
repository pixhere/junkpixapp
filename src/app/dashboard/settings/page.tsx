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
  muted:"#666660", accent:"#D97B4F", surface:"#1a1a1a", green:"#22c55e", red:"#ef4444",
};

const inp = { width:"100%", padding:"11px 14px", borderRadius:8, border:"1px solid #222222", background:"#1a1a1a", color:"#F5F4F0", fontSize:".88rem", outline:"none", boxSizing:"border-box" as const, fontFamily:"inherit", marginBottom:12 };

export default function SettingsPage() {
  const router = useRouter();
  const [operator, setOperator] = useState<any>(null);
  const [tab, setTab] = useState("business");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Business fields
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [slug, setSlug] = useState("");
  const [reviewLink, setReviewLink] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookEnabled, setWebhookEnabled] = useState(false);

  // Pricing fields
  const [minJob, setMinJob] = useState("");
  const [dump, setDump] = useState("");
  const [dumpConstruction, setDumpConstruction] = useState("");
  const [dumpMinimum, setDumpMinimum] = useState("");
  const [milesToDump, setMilesToDump] = useState("");
  const [labor, setLabor] = useState("");
  const [crew, setCrew] = useState("");
  const [gas, setGas] = useState("");
  const [margin, setMargin] = useState("");
  const [priceMinMin, setPriceMinMin] = useState("");
  const [priceMinMax, setPriceMinMax] = useState("");
  const [priceQuarterMin, setPriceQuarterMin] = useState("");
  const [priceQuarterMax, setPriceQuarterMax] = useState("");
  const [priceHalfMin, setPriceHalfMin] = useState("");
  const [priceHalfMax, setPriceHalfMax] = useState("");
  const [priceFullMin, setPriceFullMin] = useState("");
  const [priceFullMax, setPriceFullMax] = useState("");

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
      }
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

  const TABS = ["business","pricing","subscription","quoteform","payments","account","support"];

  const Field = ({ label, value, setter, type="text", note="" }: any) => (
    <div style={{ marginBottom: 4 }}>
      <div style={{ fontSize: ".65rem", color: C.muted, fontFamily: "monospace", marginBottom: 4 }}>{label}</div>
      <input type={type} value={value} onChange={e => setter(e.target.value)} style={inp} />
      {note && <div style={{ fontSize: ".68rem", color: C.muted, marginTop: -8, marginBottom: 12, fontStyle: "italic" }}>{note}</div>}
    </div>
  );

  return (
    <NavLayout active="settings" title="⚙️ Settings">
      <div style={{ maxWidth: 700, margin: "0 auto", padding: 16 }}>

        {/* Tab nav */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, overflowX: "auto" as const }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 16px", borderRadius: 20, border: "1px solid " + (tab === t ? C.accent : C.border), background: tab === t ? "rgba(217,123,79,0.15)" : "transparent", color: tab === t ? C.accent : C.muted, cursor: "pointer", fontSize: ".82rem", fontWeight: tab === t ? 700 : 400, whiteSpace: "nowrap" as const, flexShrink: 0, textTransform: "capitalize" as const }}>
              {t}
            </button>
          ))}
        </div>

        {/* Business tab */}
        {tab === "business" && (
          <div style={{ background: C.card, border: "1px solid " + C.border, borderRadius: 12, padding: 20 }}>
            <Field label="BUSINESS NAME" value={businessName} setter={setBusinessName} />
            <Field label="PHONE" value={phone} setter={setPhone} type="tel" />
            <Field label="WEBSITE" value={website} setter={setWebsite} />
            <div style={{ fontSize: ".65rem", color: C.muted, fontFamily: "monospace", marginBottom: 4 }}>YOUR QUOTE PAGE URL</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{ color: C.muted, fontSize: ".84rem", whiteSpace: "nowrap" as const }}>junkpix.com/quote/</span>
              <input type="text" value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g,""))} style={{ ...inp, marginBottom: 0 }} placeholder="yourbusiness" />
            </div>
            <Field label="YOUR FIRST NAME" value={ownerName} setter={setOwnerName} note="Shown on quote page and emails" />
            <Field label="GOOGLE/YELP REVIEW LINK" value={reviewLink} setter={setReviewLink} />
            <div style={{ fontSize: ".65rem", color: C.muted, fontFamily: "monospace", marginBottom: 8 }}>WEBHOOK</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ fontSize: ".84rem", color: C.text }}>Enable Webhook</div>
              <div onClick={() => setWebhookEnabled(!webhookEnabled)} style={{ width: 44, height: 24, borderRadius: 12, background: webhookEnabled ? C.accent : C.border, cursor: "pointer", position: "relative" as const }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#fff", position: "absolute" as const, top: 2, left: webhookEnabled ? 22 : 2, transition: "left .2s" }} />
              </div>
            </div>
            <input type="url" placeholder="https://your-n8n.com/webhook/junkpix" value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} style={inp} />
          </div>
        )}

        {/* Pricing tab */}
        {tab === "pricing" && (
          <div style={{ background: C.card, border: "1px solid " + C.border, borderRadius: 12, padding: 20 }}>
            <div style={{ fontWeight: 700, color: C.text, marginBottom: 4 }}>Your Real Costs</div>
            <div style={{ fontSize: ".78rem", color: C.muted, marginBottom: 16 }}>AI uses these to calculate accurate prices for your market.</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="REGULAR DUMP $/TON" value={dump} setter={setDump} type="number" />
              <Field label="CONSTRUCTION DUMP $/TON" value={dumpConstruction} setter={setDumpConstruction} type="number" />
              <Field label="MIN DUMP FEE ($)" value={dumpMinimum} setter={setDumpMinimum} type="number" />
              <Field label="MILES TO DUMP" value={milesToDump} setter={setMilesToDump} type="number" />
              <Field label="LABOR $/HOUR" value={labor} setter={setLabor} type="number" />
              <Field label="CREW SIZE" value={crew} setter={setCrew} type="number" />
              <Field label="GAS PRICE ($)" value={gas} setter={setGas} type="number" />
              <Field label="MARGIN %" value={margin} setter={setMargin} type="number" />
            </div>
            <div style={{ fontWeight: 700, color: C.text, marginBottom: 4, marginTop: 8 }}>Load Tier Prices</div>
            <div style={{ fontSize: ".78rem", color: C.muted, marginBottom: 12 }}>Override AI pricing with fixed ranges.</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
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

        {/* Subscription tab */}
        {tab === "subscription" && (
          <div style={{ background: C.card, border: "1px solid " + C.border, borderRadius: 12, padding: 20 }}>
            <div style={{ fontWeight: 700, color: C.text, marginBottom: 4 }}>Subscription</div>
            <div style={{ fontSize: ".82rem", color: C.muted, marginBottom: 20 }}>
              {operator?.subscription_status === "active" ? "✅ Active subscription" :
               operator?.subscription_status === "past_due" ? "⚠️ Payment past due" :
               operator?.subscription_status === "cancelled" ? "❌ Subscription cancelled" :
               "🕐 Free trial — " + (operator?.trial_ends_at ? Math.max(0, Math.ceil((new Date(operator.trial_ends_at).getTime() - Date.now()) / 86400000)) : 30) + " days left"}
            </div>
            {operator?.subscription_status !== "active" && (
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>
                <div style={{ fontSize: ".72rem", color: C.muted, fontFamily: "monospace", letterSpacing: ".08em", marginBottom: 4 }}>CHOOSE YOUR PLAN</div>
                {[
                  { label: "Founding Operator", price: "$49/mo", priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_FOUNDING, badge: "🔥 19 spots left" },
                  { label: "Standard", price: "$99/mo", priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_STANDARD, badge: "" },
                  { label: "Agency / Team", price: "$199/mo", priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_AGENCY, badge: "" },
                ].map(plan => (
                  <button
                    key={plan.label}
                    onClick={async () => {
                      const res = await fetch("/api/create-checkout", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ priceId: plan.priceId, operatorId: operator?.id, email: operator?.email }),
                      });
                      const data = await res.json();
                      if (data.url) window.location.href = data.url;
                    }}
                    style={{ padding: "12px 16px", borderRadius: 8, border: "1px solid " + C.border, background: C.surface, color: C.text, fontWeight: 600, cursor: "pointer", fontSize: ".88rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                  >
                    <span>{plan.label} {plan.badge && <span style={{ fontSize: ".7rem", color: C.accent, marginLeft: 6 }}>{plan.badge}</span>}</span>
                    <span style={{ color: C.accent, fontWeight: 700 }}>{plan.price}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Quote Form tab */}
        {tab === "quoteform" && (
          <div style={{ background: C.card, border: "1px solid " + C.border, borderRadius: 12, padding: 20 }}>
            <div style={{ fontWeight: 700, color: C.text, marginBottom: 4 }}>Quote Form</div>
            <div style={{ fontSize: ".82rem", color: C.muted, marginBottom: 16 }}>Your customer-facing quote page settings.</div>
            <div style={{ fontSize: ".65rem", color: C.muted, fontFamily: "monospace", marginBottom: 8 }}>YOUR QUOTE LINK</div>
            <div style={{ background: C.surface, borderRadius: 8, padding: "12px 14px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: ".84rem", color: C.accent }}>junkpix.com/quote/{operator?.slug || "yourslug"}</span>
              <button onClick={() => navigator.clipboard.writeText("https://junkpix.com/quote/" + (operator?.slug || ""))} style={{ padding: "5px 10px", borderRadius: 6, border: "1px solid " + C.border, background: "transparent", color: C.muted, cursor: "pointer", fontSize: ".72rem" }}>Copy</button>
            </div>
            <div style={{ fontSize: ".65rem", color: C.muted, fontFamily: "monospace", marginBottom: 8 }}>SHARE WITH CUSTOMERS</div>
            <div style={{ fontSize: ".82rem", color: C.muted, lineHeight: 1.6 }}>Share your quote link on your website, Google Business profile, Facebook page, and anywhere customers can find you. They upload photos and get an instant AI estimate.</div>
          </div>
        )}

        {/* Payments tab */}
        {tab === "payments" && (
          <div style={{ background: C.card, border: "1px solid " + C.border, borderRadius: 12, padding: 20 }}>
            <div style={{ fontWeight: 700, color: C.text, marginBottom: 4 }}>Payments</div>
            <div style={{ fontSize: ".82rem", color: C.muted, marginBottom: 16 }}>Accept deposits and payments from customers.</div>
            {operator?.stripe_account_id ? (
              <div style={{ padding: "12px 14px", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 8, marginBottom: 16 }}>
                <div style={{ fontWeight: 700, color: C.green, fontSize: ".88rem" }}>✅ Stripe Connected</div>
                <div style={{ fontSize: ".78rem", color: C.muted, marginTop: 4 }}>You can accept deposits from customers.</div>
              </div>
            ) : (
              <div>
                <div style={{ padding: "12px 14px", background: C.surface, border: "1px solid " + C.border, borderRadius: 8, marginBottom: 16 }}>
                  <div style={{ fontWeight: 600, color: C.text, fontSize: ".88rem", marginBottom: 4 }}>Connect Stripe</div>
                  <div style={{ fontSize: ".78rem", color: C.muted }}>Connect your Stripe account to accept deposits when customers book a job.</div>
                </div>
                <button
                  onClick={async () => {
                    const res = await fetch("/api/stripe-connect/onboard", { method: "POST" });
                    const data = await res.json();
                    if (data.url) window.location.href = data.url;
                  }}
                  style={{ width: "100%", padding: "12px", borderRadius: 8, border: "none", background: C.accent, color: "#000", fontWeight: 700, cursor: "pointer", fontSize: ".9rem" }}
                >
                  Connect Stripe →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Account tab */}
        {tab === "account" && (
          <div style={{ background: C.card, border: "1px solid " + C.border, borderRadius: 12, padding: 20 }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, color: C.text, marginBottom: 4 }}>Account</div>
              <div style={{ fontSize: ".84rem", color: C.muted }}>{operator?.email}</div>
            </div>
            <button onClick={async () => { await supabase.auth.signOut(); router.push("/login"); }} style={{ width: "100%", padding: "12px 0", borderRadius: 8, border: "1px solid rgba(239,68,68,0.3)", background: "transparent", color: C.red, fontWeight: 600, cursor: "pointer", fontSize: ".9rem" }}>
              Log Out
            </button>
          </div>
        )}

        {/* Support tab */}
        {tab === "support" && (
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 12 }}>
            {[
              { label: "📧 Email Support", desc: "We typically respond within a few hours.", href: "mailto:junkpixapp@gmail.com", btnLabel: "Email Us →", color: C.accent },
              { label: "💬 Feature Requests", desc: "Have an idea to make JunkPix better?", href: "mailto:junkpixapp@gmail.com?subject=Feature Request", btnLabel: "Send Idea →", color: C.muted },
              { label: "🐛 Report a Bug", desc: "Something not working right?", href: "mailto:junkpixapp@gmail.com?subject=Bug Report", btnLabel: "Report Bug →", color: C.red },
            ].map(item => (
              <div key={item.label} style={{ background: C.card, border: "1px solid " + C.border, borderRadius: 12, padding: 20 }}>
                <div style={{ fontWeight: 700, color: C.text, marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: ".84rem", color: C.muted, marginBottom: 12 }}>{item.desc}</div>
                <a href={item.href} style={{ display: "inline-block", padding: "10px 20px", borderRadius: 8, background: "transparent", border: "1px solid " + C.border, color: item.color, fontWeight: 700, fontSize: ".88rem", textDecoration: "none" }}>{item.btnLabel}</a>
              </div>
            ))}
          </div>
        )}

        {/* Save button */}
        {(tab === "business" || tab === "pricing") && (
          <button onClick={save} disabled={saving} style={{ width: "100%", padding: "14px 0", borderRadius: 8, border: "none", background: saved ? C.green : C.accent, color: "#000", fontWeight: 700, cursor: "pointer", fontSize: ".95rem", marginTop: 16 }}>
            {saving ? "Saving..." : saved ? "Saved ✓" : "Save Settings"}
          </button>
        )}

      </div>
    </NavLayout>
  );
}
