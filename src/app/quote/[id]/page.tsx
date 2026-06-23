"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { useParams } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const C = {
  bg: "#FAF6EF",
  bgSoft: "#F2EBDD",
  ink: "#3D2E26",
  inkSoft: "rgba(61,46,38,.65)",
  inkFaint: "rgba(61,46,38,.4)",
  clay: "#D97B4F",
  coral: "#C76B5C",
  sage: "#7A9B6E",
  card: "#FFFFFF",
  line: "rgba(61,46,38,.12)",
};

function compressImage(dataUrl: string, maxPx = 900, quality = 0.75): Promise<string> {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width  = Math.round(img.width  * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.src = dataUrl;
  });
}

const SYSTEM_PROMPT = `You are a junk removal estimator. Analyze the photos and describe the job in plain English for the operator who will review it.

Describe:
- What items or materials you can clearly see
- Approximate volume or quantity
- Any access concerns visible in the photo
- Anything unusual that affects pricing

Be specific and honest. If the photo is unclear say so. Do not invent items you cannot see.

Also decide pricing mode:
- "itemized" if you can clearly identify specific individual items
- "loadtier" if it's a debris pile, mixed load, or unclear

Return ONLY valid JSON:
{
  "plainDescription": "your plain English description",
  "pricingMode": "itemized"|"loadtier",
  "loadTier": "minimum"|"eighth"|"quarter"|"half"|"threeQ"|"full",
  "estimatedMin": <number>,
  "estimatedMax": <number>,
  "confidence": "high"|"medium"|"low",
  "visibleHazardFlag": false
}

For estimatedMin and estimatedMax use these ranges:
minimum: 150-200, eighth: 200-275, quarter: 300-400, half: 475-575, threeQ: 675-775, full: 875-975`;

export default function QuotePage() {
  const params  = useParams();
  const slug = decodeURIComponent(params?.id as string)?.replace(/,/g, '').trim();
console.log("cleaned slug:", slug);
const [opId, setOpId] = useState<string>("");
const [opName, setOpName] = useState<string>("");
const [opWebsite, setOpWebsite] = useState<string>("");
const [operatorData, setOperatorData] = useState<any>(null);

useEffect(() => {
  const loadOperator = async () => {
    const { data } = await supabase
      .from("operators")
      .select("id, business_name, website, price_minimum_min, price_minimum_max, price_eighth_min, price_eighth_max, price_quarter_min, price_quarter_max, price_half_min, price_half_max, price_threeq_min, price_threeq_max, price_full_min, price_full_max")
      .eq("slug", slug)
      .single();
    if (data) {
      setOpId(data.id);
      setOpName(data.business_name);
      setOpWebsite(data.website || "https://junkpix.com");
      setOperatorData(data);
    }
 };
  loadOperator();
}, [slug]);

  const [formConfig, setFormConfig] = useState<any[]>([]);
  const [step, setStep]           = useState(1);
  const [photos, setPhotos]       = useState<string[]>([]);
  const [lightbox, setLightbox]   = useState<string | null>(null);
  const [location, setLocation]   = useState<string | null>(null);
  const [locDetail, setLocDetail] = useState("");
  const [stairs, setStairs]       = useState(0);
  const [distance, setDistance]   = useState<string | null>(null);
  const [condition, setCondition] = useState<string | null>(null);
  const [condDetail, setCondDetail] = useState("");
  const [extras, setExtras]       = useState<string[]>([]);
  const [customer, setCustomer] = useState({ name:"", phone:"", email:"", address:"", city:"", state:"", zip:"", notes:"" });
  const canGo4 = customer.name.trim() && customer.phone.trim() && customer.email.trim() && customer.address.trim() && customer.city.trim() && customer.state.trim() && customer.zip.trim();
  const [loadMsg, setLoadMsg]     = useState("");
  const [result, setResult]       = useState<any>(null);
  const [error, setError]         = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const MAX = 10;

  const canGo2 = photos.length > 0;
  const canGo3 = location && (location !== "other" || locDetail.trim()) && distance && condition && (condition !== "other" || condDetail.trim());
  

  const onFiles = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, MAX - photos.length);
    if (!files.length) return;
    let loaded = 0;
    const next = [...photos];
    files.forEach(f => {
      const r = new FileReader();
      r.onload = ev => {
        next.push(ev.target!.result as string);
        if (++loaded === files.length) setPhotos([...next]);
      };
      r.readAsDataURL(f);
    });
    e.target.value = "";
  }, [photos]);

  const removePhoto = (i: number) => setPhotos(p => p.filter((_,idx) => idx !== i));
  const toggleExtra = (v: string) => setExtras(ex => ex.includes(v) ? ex.filter(x => x !== v) : [...ex, v]);

  const runEstimate = async () => {
    setStep(4);
    setLoadMsg("COMPRESSING PHOTOS...");
    console.log("opId value:", opId);
    try {
      const compressed = await Promise.all(photos.map(p => compressImage(p)));
      setLoadMsg("AI IS READING YOUR JOB...");

      const imageBlocks = compressed.map(d => ({
        type: "image",
        source: { type: "base64", media_type: "image/jpeg", data: d.split(",")[1] }
      }));

      const resp = await fetch("/api/analyze", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    images: compressed,
    prompt: "Describe this junk removal job.",
  }),
});

const ai = await resp.json();
console.log("API response:", ai);
if (ai.error) throw new Error(ai.error);
setLoadMsg("UPLOADING PHOTOS...");

      // Upload photos to Supabase storage
      // Upload photos via API
      const uploadRes = await fetch("/api/upload-photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: compressed }),
      });
      const uploadData = await uploadRes.json();
      const photoUrls: string[] = uploadData.urls || [];
      console.log("Photo URLs:", photoUrls);

      setLoadMsg("SAVING YOUR REQUEST...");

     

      // Save to Supabase
      const { error: dbErr } = await supabase.from("quote_requests").insert({
        operator_id:       opId,
        customer_name:     customer.name,
        customer_phone:    customer.phone,
        customer_email:    customer.email,
        customer_address:  customer.address,
        customer_notes:    customer.notes,
        location_type:     location,
        location_detail:   locDetail,
        stairs,
        distance,
        condition,
        condition_detail:  condDetail,
        extras,
        photo_urls:         photoUrls,
        ai_description:    ai.plainDescription,
        ai_pricing_mode:   ai.pricingMode,
        ai_load_tier:      ai.loadTier,
        ai_confidence:     ai.confidence,
        ai_hazard_flag:    ai.visibleHazardFlag,
        estimated_min:     ai.estimatedMin,
        estimated_max:     ai.estimatedMax,
        status:            "new",
      });

      console.log("opId:", opId);
      console.log("DB error:", dbErr);

      // Send email via Resend
      await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operatorId:   opId,
          customer,
          aiDescription: ai.plainDescription,
          estimatedMin:  ai.estimatedMin,
          estimatedMax:  ai.estimatedMax,
          photoUrls,
        })
      });
      // Calculate price modifiers from form config
      let priceModifier = 0;
      const selectedLocation = formConfig.find(c => c.field_type === "location" && c.value === location);
      const selectedDistance = formConfig.find(c => c.field_type === "distance" && c.value === distance);
      const selectedCondition = formConfig.find(c => c.field_type === "condition" && c.value === condition);
      
      if (selectedLocation) priceModifier += selectedLocation.price_impact || 0;
      if (selectedDistance) priceModifier += selectedDistance.price_impact || 0;
      if (selectedCondition) priceModifier += selectedCondition.price_impact || 0;
      
      extras.forEach(extra => {
        const extraConfig = formConfig.find(c => c.field_type === "extra" && c.value === extra);
        if (extraConfig) priceModifier += extraConfig.price_impact || 0;
      });

      // Apply modifier to AI estimate
      if (priceModifier > 0) {
        ai.estimatedMin = (ai.estimatedMin || 0) + priceModifier;
        ai.estimatedMax = (ai.estimatedMax || 0) + priceModifier;
      }

      setResult(ai);
      setError("");
    } catch(err: any) {
      setError(err.message || "Something went wrong.");
    }
    setStep(5);
  };

  const s = {
    app:     { background: C.bg, minHeight: "100vh", maxWidth: 480, margin: "0 auto", fontFamily: "system-ui, sans-serif", color: C.ink } as React.CSSProperties,
    screen:  { padding: "28px 20px 110px" } as React.CSSProperties,
    eyebrow: { fontSize: ".62rem", letterSpacing: ".12em", color: C.clay, marginBottom: 8, fontFamily: "monospace" } as React.CSSProperties,
    title:   { fontSize: "1.85rem", fontWeight: 800, lineHeight: 1.1, margin: "0 0 10px", color: C.ink } as React.CSSProperties,
    sub:     { fontSize: ".86rem", color: C.inkSoft, lineHeight: 1.5, margin: "0 0 20px" } as React.CSSProperties,
    warning: { background: "rgba(199,107,92,.15)", border: `2px solid ${C.coral}`, borderRadius: 8, padding: "14px 16px", fontSize: ".86rem", fontWeight: 600, color: C.ink, lineHeight: 1.5, marginBottom: 18 } as React.CSSProperties,
    qlabel:  { fontWeight: 700, fontSize: ".92rem", marginBottom: 10, color: C.ink } as React.CSSProperties,
    qnote:   { fontWeight: 400, fontSize: ".75rem", color: C.inkFaint } as React.CSSProperties,
    chip:    (sel: boolean) => ({ padding: "9px 15px", borderRadius: 6, border: `1.5px solid ${sel ? C.clay : C.line}`, background: sel ? C.clay : C.card, color: sel ? "#fff" : C.ink, fontSize: ".84rem", fontWeight: sel ? 700 : 500, cursor: "pointer", userSelect: "none" as const }),
    input:   { width: "100%", padding: "12px 14px", borderRadius: 6, border: `1px solid ${C.line}`, background: C.card, color: C.ink, fontSize: ".86rem", fontFamily: "inherit", marginBottom: 12, boxSizing: "border-box" as const } as React.CSSProperties,
    btnBar:  { position: "fixed" as const, bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, padding: "16px 20px 28px", background: `linear-gradient(to top, ${C.bg} 65%, transparent)` },
    btnP:    (d: boolean) => ({ width: "100%", padding: "15px", borderRadius: 8, border: "none", background: d ? "rgba(217,123,79,.3)" : C.clay, color: d ? "rgba(61,46,38,.4)" : "#fff", fontSize: ".95rem", fontWeight: 700, cursor: d ? "not-allowed" : "pointer", letterSpacing: ".04em" }),
  };

  const ChipGroup = ({ label, note, opts, val, onChange, mb=24 }: any) => (
    <div style={{ marginBottom: mb }}>
      <div style={s.qlabel}>{label}{note && <span style={{ ...s.qnote, marginLeft: 6 }}>{note}</span>}</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {opts.map((o: any) => <div key={o.v} style={s.chip(val === o.v)} onClick={() => onChange(o.v)}>{o.l}</div>)}
      </div>
    </div>
  );

  const topbar = (showBack: boolean, stepLabel: string) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px 14px", borderBottom: `1px solid ${C.line}`, gap: 12 }}>
      {showBack
        ? <div style={{ width: 32, height: 32, borderRadius: "50%", border: `1px solid ${C.line}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }} onClick={() => setStep(s => s - 1)}>←</div>
        : <div style={{ width: 32 }} />}
      <div style={{ fontSize: "1.1rem", fontWeight: 800, letterSpacing: ".06em", color: C.ink }}>
        JUNK<span style={{ color: C.clay }}>PIX</span>
      </div>
      <div style={{ fontSize: ".65rem", color: C.inkFaint, fontFamily: "monospace" }}>{stepLabel}</div>
    </div>
  );

  // STEP 1 — Photos
  const sideColStyle = `
    @media (min-width: 900px) {
      .side-col { display: flex !important; flex-direction: column; }
    }
  `;

  if (step === 1) return (
    <div style={{ minHeight:"100vh", background:"#0A0A0A", display:"flex", justifyContent:"center", alignItems:"flex-start" }}>
      <style>{sideColStyle}</style>

      {/* Left column — How it works */}
      <div style={{ width:320, flexShrink:0, padding:"60px 32px", display:"none" }} className="side-col">
       <div style={{ color:"#D97B4F", fontSize:".85rem", letterSpacing:".15em", fontFamily:"monospace", marginBottom:24 }}>HOW IT WORKS</div>
        {[
          { step:"01", title:"Snap the junk", desc:"Take 1–5 photos from your phone. No app needed." },
          { step:"02", title:"AI reads the job", desc:"Our AI identifies items, estimates volume, and describes the job instantly." },
          { step:"03", title:"Get your quote", desc:"The operator reviews your photos and sends a price — usually within the hour." },
          { step:"04", title:"Book and done", desc:"Confirm the job. Crew shows up. Junk is gone." },
        ].map((item) => (
          <div key={item.step} style={{ marginBottom:28 }}>
            <div style={{ fontSize:".8rem", color:"#D97B4F", fontFamily:"monospace", marginBottom:6 }}>{item.step}</div>
            <div style={{ fontSize:"1.1rem", fontWeight:700, color:"#F0F0F0", marginBottom:6 }}>{item.title}</div>
            <div style={{ fontSize:".9rem", color:"#888", lineHeight:1.6 }}>{item.desc}</div>
          </div>
        ))}
      </div>

      {/* Form — middle */}
      <div style={s.app}>
        {topbar(false, "STEP 1 / 3")}
        <div style={s.screen}>
          <div style={s.eyebrow}>START HERE</div>
          <h1 style={s.title}>Snap the pile.</h1>
          <p style={s.sub}>Add 1–10 photos. Tap any photo to enlarge and double-check.</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 18 }}>
            {photos.map((url, i) => (
              <div key={i} style={{ position: "relative", aspectRatio: "1/1", borderRadius: 6, overflow: "hidden", border: `2px solid ${C.clay}` }}>
                <img src={url} alt={`Photo ${i+1}`} style={{ width: "100%", height: "100%", objectFit: "cover", cursor: "zoom-in" }} onClick={() => setLightbox(url)} />
                <div onClick={() => removePhoto(i)} style={{ position: "absolute", top: 4, right: 4, width: 22, height: 22, borderRadius: "50%", background: "rgba(28,27,25,.85)", color: "#FAF6EF", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: ".8rem" }}>✕</div>
                <div style={{ position: "absolute", bottom: 4, left: 4, background: "rgba(28,27,25,.85)", color: "#FAF6EF", fontSize: ".6rem", padding: "2px 6px", borderRadius: 3, fontFamily: "monospace" }}>{i+1}</div>
              </div>
            ))}
            {photos.length < MAX && (
              <div onClick={() => fileRef.current?.click()} style={{ aspectRatio: "1/1", borderRadius: 6, border: `2px dashed rgba(61,46,38,.25)`, background: C.bgSoft, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, cursor: "pointer" }}>
                <span style={{ fontSize: "1.4rem" }}>📷</span>
                <span style={{ fontSize: ".6rem", color: C.inkFaint, fontFamily: "monospace" }}>{photos.length === 0 ? "Add photo" : "Add another"}</span>
              </div>
            )}
          </div>

          <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={onFiles} />

          <div style={s.warning}>⚠️ Only photograph what's being hauled away. Anything in frame gets priced into the quote — snap just the junk.</div>
          
        {/* Mobile how it works */}
        <div style={{ marginTop:24, marginBottom:16 }}>
          <div style={{ fontSize:".65rem", color:C.clay, letterSpacing:".15em", fontFamily:"monospace", marginBottom:16 }}>HOW IT WORKS</div>
          {[
            { step:"01", title:"Snap the junk", desc:"Take 1–5 photos from your phone." },
            { step:"02", title:"AI reads the job", desc:"Identifies items and estimates the price instantly." },
            { step:"03", title:"Get your quote", desc:"Operator reviews and sends you a price — usually within the hour." },
            { step:"04", title:"Book and done", desc:"Confirm the job. Crew shows up. Junk is gone." },
          ].map((item) => (
            <div key={item.step} style={{ display:"flex", gap:14, marginBottom:18, alignItems:"flex-start" }}>
              <div style={{ fontSize:".65rem", color:C.clay, fontFamily:"monospace", fontWeight:700, marginTop:2, flexShrink:0, width:20 }}>{item.step}</div>
              <div>
                <div style={{ fontSize:".9rem", fontWeight:700, color:C.ink, marginBottom:2 }}>{item.title}</div>
                <div style={{ fontSize:".8rem", color:C.inkSoft, lineHeight:1.5 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>

        s

          <div style={s.btnBar}>
            <button style={s.btnP(!canGo2)} disabled={!canGo2} onClick={() => setStep(2)}>Continue</button>
          </div>
        </div>

        {lightbox && (
          <div onClick={() => setLightbox(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.92)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: 20 }}>
            <img src={lightbox} alt="Full size" style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 8, objectFit: "contain" }} />
            <div onClick={() => setLightbox(null)} style={{ position: "absolute", top: 20, right: 20, color: "#fff", fontSize: "1.5rem", cursor: "pointer", background: "rgba(0,0,0,.5)", width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</div>
          </div>
        )}
      </div>

      {/* Right column — Trust signals */}
      <div style={{ width:320, flexShrink:0, padding:"60px 32px", display:"none" }} className="side-col">
      <div style={{ color:"#D97B4F", fontSize:".85rem", letterSpacing:".15em", fontFamily:"monospace", marginBottom:24 }}>WHY JUNKPIX</div>
        {[
          { icon:"🔒", title:"No spam, no pressure", desc:"Your info is only shared with the operator." },
          { icon:"📸", title:"Photos stay private", desc:"Only the operator sees your photos." },
          { icon:"⚡", title:"Quote within the hour", desc:"Most operators respond same day." },
          { icon:"💬", title:"Operator contacts you", desc:"Real local business, not a call center." },
          { icon:"🚛", title:"Local & professional", desc:"Vetted junk removal operators in your area." },
          { icon:"🤖", title:"Powered by JunkPix AI", desc:"Smart quoting so you get a fair price fast." },
        ].map((item) => (
          <div key={item.icon} style={{ marginBottom:22, display:"flex", gap:12, alignItems:"flex-start" }}>
            <span style={{ fontSize:"1.1rem", flexShrink:0 }}>{item.icon}</span>
            <div>
              <div style={{ fontSize:"1.1rem", fontWeight:700, color:"#F0F0F0", marginBottom:6 }}>{item.title}</div>
              <div style={{ fontSize:".9rem", color:"#888", lineHeight:1.6 }}>{item.desc}</div>
            </div>
          </div>
        ))}
        <div style={{ marginTop:32, paddingTop:20, borderTop:"1px solid #222" }}>
          <div style={{ fontSize:".65rem", color:"#444", fontFamily:"monospace", textAlign:"center" as const }}>POWERED BY JUNKPIX</div>
        </div>
      </div>

    </div>
  );
  if (step === 2) return (
    <div style={s.app}>
      {topbar(true, "STEP 2 / 3")}
      <div style={s.screen}>
        <div style={s.eyebrow}>ACCESS & CONDITION</div>
        <h1 style={s.title}>A few quick taps.</h1>
        <p style={s.sub}>This is what changes the price — not just what's there, but how hard it is to get out.</p>

        <ChipGroup 
          label="Where is the junk?" 
          val={location} 
          onChange={setLocation} 
          opts={formConfig.filter(c => c.field_type === "location").length > 0
            ? formConfig.filter(c => c.field_type === "location").map(c => ({ v: c.value, l: c.label }))
            : [{v:"curbside",l:"Curbside / outside"},{v:"inside",l:"Inside the home"},{v:"basement",l:"Basement / multi-floor"},{v:"other",l:"Other"}]
          } 
        />
        {location === "other" && <input style={s.input} placeholder="e.g. backyard, garage, attic..." value={locDetail} onChange={e => setLocDetail(e.target.value)} />}

        <div style={{ marginBottom: 24 }}>
          <div style={s.qlabel}>Stairs? <span style={s.qnote}>flights to carry junk down</span></div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 6 }}>
            <div onClick={() => setStairs(n => Math.max(0, n-1))} style={{ width: 38, height: 38, borderRadius: "50%", border: `1.5px solid ${C.line}`, background: C.card, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "1.2rem" }}>−</div>
            <span style={{ fontSize: "1.4rem", fontWeight: 800, minWidth: 24, textAlign: "center" }}>{stairs}</span>
            <div onClick={() => setStairs(n => Math.min(5, n+1))} style={{ width: 38, height: 38, borderRadius: "50%", border: `1.5px solid ${C.line}`, background: C.card, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "1.2rem" }}>+</div>
            <span style={{ fontSize: ".82rem", color: C.inkFaint }}>flights</span>
          </div>
        </div>

       <ChipGroup 
          label="Distance from junk to truck" 
          val={distance} 
          onChange={setDistance} 
          opts={formConfig.filter(c => c.field_type === "distance").length > 0
            ? formConfig.filter(c => c.field_type === "distance").map(c => ({ v: c.value, l: c.label }))
            : [{v:"short",l:"Under 50ft"},{v:"medium",l:"50–150ft"},{v:"long",l:"150ft+"}]
          } 
        />
        <ChipGroup 
          label="Condition" 
          note="be honest, it changes the price" 
          val={condition} 
          onChange={(v: string) => { setCondition(v); setCondDetail(""); }} 
          opts={formConfig.filter(c => c.field_type === "condition").length > 0
            ? formConfig.filter(c => c.field_type === "condition").map(c => ({ v: c.value, l: c.label }))
            : [{v:"standard",l:"Standard"},{v:"hazard",l:"Hoarder / Odor"},{v:"other",l:"Other"}]
          } 
        />
        {condition === "other" && <input style={s.input} placeholder="e.g. wet, water damage, pest activity..." value={condDetail} onChange={e => setCondDetail(e.target.value)} />}

        <div style={{ marginBottom: 24 }}>
          <div style={s.qlabel}>Anything extra? <span style={s.qnote}>tap any that apply</span></div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {(formConfig.filter(c => c.field_type === "extra").length > 0
              ? formConfig.filter(c => c.field_type === "extra").map(c => ({ v: c.value, l: c.label }))
              : [{v:"heavy",l:"Heavy"},{v:"dusty",l:"Dusty"}]
            ).map(o => (
              <div key={o.v} style={s.chip(extras.includes(o.v))} onClick={() => toggleExtra(o.v)}>{o.l}</div>
            ))}
          </div>
        </div>

        <div style={s.btnBar}>
          <button style={s.btnP(!canGo3)} disabled={!canGo3} onClick={() => setStep(3)}>Continue</button>
        </div>
      </div>
    </div>
  );

  // STEP 3 — Customer info
  if (step === 3) return (
    <div style={s.app}>
      {topbar(true, "STEP 3 / 3")}
      <div style={s.screen}>
        <div style={s.eyebrow}>ALMOST THERE</div>
        <h1 style={s.title}>Your info.</h1>
        <p style={s.sub}>So we can send you the quote. We'll review your photos and get back to you fast.</p>

        {[
          { key: "name",    placeholder: "Full name",                                type: "text"  },
{ key: "phone",   placeholder: "Phone number",                             type: "tel"   },
{ key: "email",   placeholder: "Email address",                            type: "email" },
{ key: "address", placeholder: "Street address",                           type: "text"  },
{ key: "city",    placeholder: "City",                                     type: "text"  },
{ key: "state",   placeholder: "State (e.g. PA)",                          type: "text"  },
{ key: "zip",     placeholder: "Zip code",                                 type: "text"  },
{ key: "notes",   placeholder: "Anything else we should know? (optional)", type: "text"  },
        ].map(f => (
          <input
            key={f.key}
            type={f.type}
            placeholder={f.placeholder}
            value={customer[f.key as keyof typeof customer]}
            onChange={e => setCustomer(prev => ({ ...prev, [f.key]: e.target.value }))}
            style={s.input}
          />
        ))}

        <div style={s.btnBar}>
          <button style={s.btnP(!canGo4)} disabled={!canGo4} onClick={runEstimate}>Get My Quote →</button>
        </div>
      </div>
    </div>
  );

  // STEP 4 — Loading
  // STEP 4 — Loading
// STEP 4 — Loading
if (step === 4) return (
  <div style={{ background:C.bg, minHeight:"100vh", maxWidth:480, width:"100%", margin:"0 auto", fontFamily:"system-ui, sans-serif", color:C.ink }}>
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 20px 14px", borderBottom:`1px solid ${C.line}` }}>
      <div style={{ width:32 }} />
      <div style={{ fontSize:"1.1rem", fontWeight:800, letterSpacing:".06em", color:C.ink }}>JUNK<span style={{ color:C.clay }}>PIX</span></div>
      <div style={{ width:32 }} />
    </div>
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"80vh", gap:20 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width:48, height:48, border:`3px solid ${C.line}`, borderTopColor:C.clay, borderRadius:"50%", animation:"spin .9s linear infinite" }} />
      <div style={{ fontSize:".72rem", letterSpacing:".1em", color:C.inkFaint, fontFamily:"monospace", textAlign:"center" }}>{loadMsg}</div>
    </div>
  </div>
);

  // STEP 5 — Result
  return (
    <div style={s.app}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px 14px", borderBottom: `1px solid ${C.line}` }}>
        <div style={{ width: 32 }} />
        <div style={{ fontSize: "1.1rem", fontWeight: 800, letterSpacing: ".06em", color: C.ink }}>JUNK<span style={{ color: C.clay }}>PIX</span></div>
        <div style={{ width: 32 }} />
      </div>

      <div style={s.screen}>
        {error ? (
          <>
            <div style={s.eyebrow}>SOMETHING WENT WRONG</div>
            <h1 style={{ ...s.title, fontSize: "1.5rem" }}>Let's try again.</h1>
            <div style={{ background: C.bgSoft, borderRadius: 8, padding: 20, border: `1px solid ${C.line}` }}>
              <p style={{ fontSize: ".86rem", color: C.inkSoft, lineHeight: 1.5, margin: 0 }}>Something went wrong processing your request. Please call us directly at the number on our website.</p>
            </div>
          </>
        ) : (
          <>
            <div style={s.eyebrow}>REQUEST RECEIVED</div>
            <h1 style={s.title}>We've got it.</h1>

            <div style={{ background: C.ink, borderRadius: 12, padding: "28px 24px", marginBottom: 20, textAlign: "center" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>✅</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#fff", marginBottom: 8 }}>Your photos are with the owner.</div>
              <div style={{ fontSize: ".86rem", color: "rgba(255,255,255,.65)", lineHeight: 1.55 }}>
                We're reviewing your job and will reach out shortly with a price.
              </div>
            </div>

            {result?.estimatedMin && (
              <div style={{ background: C.bgSoft, borderRadius: 8, padding: 20, marginBottom: 16, border: `1px solid ${C.line}` }}>
                <div style={{ fontSize: ".62rem", letterSpacing: ".1em", color: C.inkFaint, fontFamily: "monospace", marginBottom: 8 }}>ESTIMATED RANGE</div>
                <div style={{ fontSize: "2rem", fontWeight: 800, color: C.clay }}>${result.estimatedMin} – ${result.estimatedMax}</div>
                <div style={{ fontSize: ".78rem", color: C.inkSoft, marginTop: 6, lineHeight: 1.4 }}>
                  This is a ballpark based on your photos. Your exact price comes from the owner after review.
                </div>
              </div>
            )}

            <div style={{ background: C.bgSoft, borderRadius: 8, padding: 20, border: `1px solid ${C.line}` }}>
              <div style={{ fontWeight: 700, fontSize: ".88rem", color: C.ink, marginBottom: 14 }}>What happens next</div>
              {[
                { icon: "📱", text: `We'll text you at ${customer.phone}` },
                { icon: "📧", text: `Confirmation to ${customer.email}` },
                { icon: "💬", text: "Owner reviews your photos and reaches out with a price — usually within the hour" },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: i < 2 ? 12 : 0 }}>
                  <span style={{ fontSize: "1.1rem", flexShrink: 0 }}>{item.icon}</span>
                  <span style={{ fontSize: ".84rem", color: C.inkSoft, lineHeight: 1.45 }}>{item.text}</span>
                </div>
              ))}
            </div>

            {result?.plainDescription && (
              <div style={{ background: C.bgSoft, borderRadius: 8, padding: 16, border: `1px solid ${C.line}`, marginTop: 16 }}>
                <div style={{ fontSize: ".62rem", letterSpacing: ".1em", color: C.inkFaint, fontFamily: "monospace", marginBottom: 8 }}>WHAT WE SAW</div>
                <div style={{ fontSize: ".84rem", color: C.inkSoft, lineHeight: 1.55 }}>{result.plainDescription}</div>
              </div>
            )}
            <div
  onClick={() => { console.log("Going to:", opWebsite); window.location.href = opWebsite; }}
  style={{ display:"flex", alignItems:"center", justifyContent:"center", marginTop:24, padding:"14px 0", borderRadius:8, border:`1px solid ${C.line}`, background:C.card, cursor:"pointer", fontSize:".9rem", fontWeight:600, color:C.ink, gap:8 }}
>
  🏠 Home
</div>
          </>
        )}
      </div>
    </div>
  );
}