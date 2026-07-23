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

const SYSTEM_PROMPT = `You are PixBrain — the world's most accurate junk removal estimator. You think like a 15-year veteran operator who never leaves money on the table but never overcharges.

Analyze ALL provided photos carefully. Be specific and honest. If a photo is unclear, say so. Never invent items you cannot see.

Return ONLY valid JSON in this exact format — no markdown, no backticks:
{
  "plainDescription": "2-3 sentence plain English summary of the job for the operator",
  "jobType": "Garage Cleanout|Basement Cleanout|Estate Cleanout|Backyard Cleanup|Construction Debris|Furniture Removal|Appliance Removal|Mixed Debris|Other",
  "itemList": [
    { "name": "item name", "quantity": 1, "estimatedWeightLbs": 50, "notes": "any special notes" }
  ],
  "volumeCubicYards": 3.5,
  "truckLoadPercent": 45,
  "pricingMode": "itemized|loadtier",
  "loadTier": "minimum|eighth|quarter|half|threeQ|full",
  "estimatedMin": 300,
  "estimatedMax": 400,
  "confidence": "high|medium|low",
  "confidenceScore": 85,
  "difficultyFactors": {
    "stairs": false,
    "narrowAccess": false,
    "heavyItems": false,
    "disassemblyRequired": false,
    "longCarry": false,
    "hazardousMaterials": false
  },
  "disposalCategory": "standard|construction|heavyMaterial|ewaste|mixed",
  "recommendedCrew": 2,
  "estimatedHours": 2.5,
  "riskFlag": false,
  "riskReason": "",
  "upsellSuggestions": [
    { "item": "upsell item", "addOnPrice": 50, "reason": "why this adds value" }
  ],
  "visibleHazardFlag": false,
  "bookingScore": 75,
  "suggestedCustomerMessage": "Hi [customer name], I reviewed your photos. [2-3 sentence description of what you see and what the job entails]. I can have a [crew size]-person crew there for $[price]. Does [day] or [day] work best for you?"
}

Pricing ranges by load tier:
minimum (1-10 units): $150-200
eighth (11-20 units): $200-275  
quarter (21-35 units): $300-400
half (36-55 units): $475-575
threeQ (56-75 units): $675-775
full (76-100 units): $875-975

bookingScore is 0-100 based on: photo clarity (clear photos = higher score), job size (bigger jobs = higher score), urgency signals in notes, completeness of information provided.

riskFlag is true if: job appears to have hidden hazards, access looks extremely difficult, items appear to require special disposal (asphalt, concrete, biohazard), or photos suggest job is significantly larger than it appears.

For suggestedCustomerMessage: write it as if YOU are the operator sending it. Use a professional but friendly tone. Keep it under 3 sentences. Do NOT include actual pricing unless estimatedMin is available.`;

export default function QuotePage() {
  const params  = useParams();
  const slug = decodeURIComponent(params?.id as string)?.replace(/,/g, '').trim();
const [opId, setOpId] = useState<string>("");
const [opName, setOpName] = useState<string>("");
const [opWebsite, setOpWebsite] = useState<string>("");
const [operatorData, setOperatorData] = useState<any>(null);
const [opPhone, setOpPhone] = useState<string>("");
const [opOwnerName, setOpOwnerName] = useState<string>("");
const [formConfig, setFormConfig] = useState<any[]>([]);
const formConfigRef = useRef<any[]>([]);

useEffect(() => {
  const loadOperator = async () => {
    const { data } = await supabase
      .from("operators")
      .select("id, business_name, website, phone, owner_name, price_minimum_min, price_minimum_max, price_eighth_min, price_eighth_max, price_quarter_min, price_quarter_max, price_half_min, price_half_max, price_threeq_min, price_threeq_max, price_full_min, price_full_max")
      .eq("slug", slug)
      .single();
    if (data) {
      setOpId(data.id);
      setOpName(data.business_name);
      setOpWebsite(data.website || "https://junkpix.com");
      setOperatorData(data);
      setOpPhone(data.phone || "");
      setOpOwnerName(data.owner_name || data.business_name || "the owner");

      const { data: config } = await supabase
        .from("quote_form_config")
        .select("*")
        .eq("operator_id", data.id)
        .eq("is_active", true)
        .order("sort_order");
      if (config) {
        setFormConfig(config);
        formConfigRef.current = config;
      }
    }
  };
  loadOperator();
}, [slug]);

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
    operatorPrices: operatorData,
    specialItemsConfig: formConfigRef.current.filter((c: any) => c.field_type === "special_item"),
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
const submitRes = await fetch("/api/submit-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
          photo_urls:        photoUrls,
          ai_description:    ai.plainDescription,
          ai_pricing_mode:   ai.pricingMode,
          ai_load_tier:      ai.loadTier,
          ai_confidence:     ai.confidence,
          ai_hazard_flag:    ai.visibleHazardFlag,
          estimated_min:     ai.estimatedMin,
          estimated_max:     ai.estimatedMax,
          heavy_material_flag: ai.heavyMaterialFlag || false,
          heavy_materials:   ai.heavyMaterials || [],
          yard_waste_flag:   ai.yardWasteFlag || false,
          tire_flag:         ai.tireFlag || false,
          tire_count:        ai.tireCount || 0,
          job_type:          ai.jobType || null,
          item_list:         ai.itemList || [],
          volume_cubic_yards: ai.volumeCubicYards || null,
          truck_load_percent: ai.truckLoadPercent || null,
          confidence_score:  ai.confidenceScore || null,
          difficulty_factors: ai.difficultyFactors || null,
          disposal_category: ai.disposalCategory || null,
          recommended_crew:  ai.recommendedCrew || null,
          estimated_hours:   ai.estimatedHours || null,
          risk_flag:         ai.riskFlag || false,
          risk_reason:       ai.riskReason || null,
          upsell_suggestions: ai.upsellSuggestions || [],
          booking_score:     ai.bookingScore || null,
          suggested_customer_message: ai.suggestedCustomerMessage || null,
          status:            "new",
        }),
      });
      const submitData = await submitRes.json();
      const insertedQuote = submitData.quote;
      const dbErr = submitData.error;

      console.log("opId:", opId);
      console.log("DB error:", dbErr);


      console.log("formConfig:", formConfig);
      console.log("location:", location, "distance:", distance, "condition:", condition, "extras:", extras);
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

      if (insertedQuote?.id) {
        ai.statusUrl = `/status/${insertedQuote.id}`;
      }

      // Send email AFTER price modifiers applied
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

      setResult(ai);
      setError("");
      if (insertedQuote?.id) {
        ai.statusUrl = `/status/${insertedQuote.id}`;
      }
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
          { step:"01", title:"Snap the junk", desc:"Take 1–10 photos from your phone. No app needed." },
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
            { step:"01", title:"Snap the junk", desc:"Take 1–10 photos from your phone." },
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
              <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#fff", marginBottom: 8 }}>Your photos are with {opOwnerName}.</div>
              <div style={{ fontSize: ".86rem", color: "rgba(255,255,255,.65)", lineHeight: 1.55 }}>
                We're reviewing your job and will reach out shortly with a price.
              </div>
            </div>

            {result?.siteVisitRequired && (
              <div style={{ background: "rgba(217,123,79,0.1)", border: "1px solid rgba(217,123,79,0.4)", borderRadius: 8, padding: 20, marginBottom: 16, textAlign: "center" as const }}>
                <div style={{ fontSize: "1.5rem", marginBottom: 8 }}>📞</div>
                <div style={{ fontWeight: 800, color: "#D97B4F", fontSize: "1rem", marginBottom: 8 }}>This Job Needs a Custom Quote</div>
                <div style={{ fontSize: ".84rem", color: "#666", lineHeight: 1.6, marginBottom: 16 }}>
                  Based on your photos, this job requires an on-site visit to give you an accurate price. Please call or text us directly.
                </div>
                {opPhone && (
                  <a href={`tel:${opPhone}`} style={{ display: "inline-block", background: "#D97B4F", color: "#fff", padding: "12px 28px", borderRadius: 8, fontWeight: 800, fontSize: ".95rem", textDecoration: "none" }}>
                    📞 Call for a Free Quote
                  </a>
                )}
              </div>
            )}
            {false && result?.estimatedMin && !result?.siteVisitRequired && (
              <div style={{ background: C.bgSoft, borderRadius: 8, padding: 20, marginBottom: 16, border: `1px solid ${C.line}` }}>
                <div style={{ fontSize: ".62rem", letterSpacing: ".1em", color: C.inkFaint, fontFamily: "monospace", marginBottom: 8 }}>ESTIMATED RANGE</div>
                <div style={{ fontSize: "2rem", fontWeight: 800, color: C.clay }}>${result.estimatedMin} – ${result.estimatedMax}</div>
                <div style={{ fontSize: ".78rem", color: C.inkSoft, marginTop: 6, lineHeight: 1.4 }}>
                  This is a ballpark based on your photos. Your exact price comes from the owner after review.
                </div>
              </div>
            )}
            {result?.yardWasteFlag && (
              <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 8, padding: 16, marginBottom: 16 }}>
                <div style={{ fontWeight: 700, color: "#16a34a", fontSize: ".88rem", marginBottom: 4 }}>🌿 Yard Waste Detected</div>
                <div style={{ fontSize: ".78rem", color: "#666", lineHeight: 1.5 }}>
                  Yard waste requires separate disposal. Additional fees may apply. The owner will confirm your final price.
                </div>
              </div>
            )}
            {result?.tireFlag && (
              <div style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: 8, padding: 16, marginBottom: 16 }}>
                <div style={{ fontWeight: 700, color: "#2563eb", fontSize: ".88rem", marginBottom: 4 }}>🔄 Tires Detected</div>
                <div style={{ fontSize: ".78rem", color: "#666", lineHeight: 1.5 }}>
                  Tire disposal fees apply ($25 per car/SUV tire, $35 per truck tire). Final price includes tire count.
                </div>
              </div>
            )}
            {result?.heavyMaterialFlag && (
              <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: 16, marginBottom: 16 }}>
                <div style={{ fontWeight: 700, color: "#ef4444", fontSize: ".88rem", marginBottom: 4 }}>⚠️ Heavy Materials Detected</div>
                <div style={{ fontSize: ".78rem", color: C.inkSoft, lineHeight: 1.5 }}>
                  This job contains heavy or construction materials ({result.heavyMaterials?.join(", ")}). The owner will review and confirm your final price before booking.
                </div>
              </div>
            )}
            {result?.specialItemsFlag && result?.specialItems?.length > 0 && (
              <div style={{ background: "rgba(217,123,79,0.08)", border: "1px solid rgba(217,123,79,0.3)", borderRadius: 8, padding: 16, marginBottom: 16 }}>
                <div style={{ fontWeight: 700, color: "#D97B4F", fontSize: ".88rem", marginBottom: 8 }}>🎹 Special Items Detected</div>
                {result.specialItems.map((item: any, i: number) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: ".82rem", color: C.inkSoft, padding: "4px 0" }}>
                    <span>{item.name}</span>
                    <span style={{ fontWeight: 700, color: "#D97B4F" }}>+${item.fee}</span>
                  </div>
                ))}
                <div style={{ fontSize: ".74rem", color: C.inkFaint, marginTop: 8, lineHeight: 1.4 }}>
                  These items require special handling and are added to your final price.
                </div>
              </div>
            )}
                {/* Instant booking incentive */}
            <div style={{ background: "#D97B4F", borderRadius: 12, padding: 20, marginBottom: 16 }}>
              <div style={{ fontSize: "1.4rem", marginBottom: 8 }}>🔥</div>
              <div style={{ fontSize: "1rem", fontWeight: 800, color: "#fff", marginBottom: 6 }}>Book Today — Save $25</div>
              <div style={{ fontSize: ".82rem", color: "rgba(255,255,255,.85)", lineHeight: 1.5, marginBottom: 16 }}>
                Call or text right now and mention <strong style={{ color:"#fff" }}>"same-day deal"</strong> to lock in your discount. Offer expires tonight at midnight.
              </div>
              <a href={`tel:${opPhone}`} style={{ display:"inline-block", background:"#fff", color:"#D97B4F", padding:"12px 28px", borderRadius:8, fontWeight:800, fontSize:".95rem", textDecoration:"none", marginBottom:8 }}>
                📞 {opPhone ? `Call ${opPhone}` : "Call to Book Now"}
              </a>
              <div style={{ fontSize:".72rem", color:"rgba(255,255,255,.65)", marginTop:8 }}>
                ⏰ Same-day availability — spots fill fast
              </div>
            </div>

            {/* Status link */}
            {result?.statusUrl && (
              <div style={{ background:C.card, border:`1px solid ${C.line}`, borderRadius:8, padding:16, marginTop:16, textAlign:"center" as const }}>
                <div style={{ fontSize:".72rem", color:"#888", fontFamily:"monospace", letterSpacing:".1em", marginBottom:8 }}>TRACK YOUR QUOTE</div>
                <a
                  href={result.statusUrl}
                  style={{ color:C.clay, fontWeight:700, fontSize:".88rem", textDecoration:"none" }}
                >
                  Check quote status →
                </a>
                <div style={{ fontSize:".72rem", color:"#aaa", marginTop:6 }}>Bookmark this link to check back anytime</div>
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