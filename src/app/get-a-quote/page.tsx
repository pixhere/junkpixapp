"use client";

import { useState, useRef } from "react";

const C = {
  bg: "#0A0A0A",
  card: "#111111",
  border: "#222222",
  accent: "#D97B4F",
  accentDim: "rgba(217,123,79,0.1)",
  text: "#F0F0F0",
  muted: "#666666",
  green: "#22c55e",
  surface: "#161616",
};

const LEAD_SOURCES = [
  { key:"google_search",  label:"Google Search",        emoji:"🔍" },
  { key:"google_maps",    label:"Google Maps",          emoji:"📍" },
  { key:"facebook",       label:"Facebook",             emoji:"📘" },
  { key:"instagram",      label:"Instagram",            emoji:"📸" },
  { key:"referral",       label:"Referral",             emoji:"🤝" },
  { key:"other",          label:"Other",                emoji:"💬" },
];

function compressImage(dataUrl: string): Promise<string> {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 900 / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width  = Math.round(img.width  * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.75));
    };
    img.src = dataUrl;
  });
}

export default function GetAQuotePage() {
  const [step, setStep]               = useState(1);
  const [name, setName]               = useState("");
  const [phone, setPhone]             = useState("");
  const [email, setEmail]             = useState("");
  const [address, setAddress]         = useState("");
  const [zip, setZip]                 = useState("");
  const [city, setCity]               = useState("");
  const [state, setState]             = useState("");
  const [leadSource, setLeadSource]   = useState("");
  const [photos, setPhotos]           = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [loading, setLoading]         = useState(false);
  const [submitted, setSubmitted]     = useState(false);
  const [aiResult, setAiResult]       = useState<any>(null);
  const [analyzing, setAnalyzing]     = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = 5 - photos.length;
    const toProcess = files.slice(0, remaining);
    const results: string[] = [];
    for (const file of toProcess) {
      const reader = new FileReader();
      const dataUrl = await new Promise<string>(res => {
        reader.onload = ev => res(ev.target?.result as string);
        reader.readAsDataURL(file);
      });
      const compressed = await compressImage(dataUrl);
      results.push(compressed);
    }
    setPhotos(prev => [...prev, ...results].slice(0, 5));
    e.target.value = "";
  };

  const analyzePhotos = async () => {
    if (photos.length === 0) return;
    setAnalyzing(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: photos, operatorPrices: null }),
      });
      const data = await res.json();
      setAiResult(data);
    } catch {}
    setAnalyzing(false);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await fetch("/api/submit-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, phone, email, address, city, state, zip,
          leadSource, photos, description,
          estimatedMin: aiResult?.estimatedMin || null,
          estimatedMax: aiResult?.estimatedMax || null,
          aiDescription: aiResult?.plainDescription || null,
        }),
      });
      setSubmitted(true);
    } catch {}
    setLoading(false);
  };

  const inp: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 8,
    border: `1px solid ${C.border}`,
    background: C.surface,
    color: C.text,
    fontSize: ".92rem",
    outline: "none",
    boxSizing: "border-box",
  };

  const btn = (disabled = false): React.CSSProperties => ({
    width: "100%",
    padding: "14px",
    borderRadius: 8,
    border: "none",
    background: disabled ? "#333" : C.accent,
    color: disabled ? C.muted : "#000",
    fontWeight: 700,
    fontSize: ".95rem",
    cursor: disabled ? "not-allowed" : "pointer",
  });

  const label: React.CSSProperties = {
    fontSize: ".72rem",
    color: C.muted,
    fontFamily: "monospace",
    letterSpacing: ".1em",
    fontWeight: 700,
    display: "block",
    marginBottom: 6,
  };

  if (submitted) return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: "3rem", marginBottom: 16 }}>🎉</div>
        <div style={{ fontSize: "1.6rem", fontWeight: 800, color: C.text, marginBottom: 8 }}>Quote Request Received!</div>
        <div style={{ fontSize: ".92rem", color: C.muted, lineHeight: 1.7, marginBottom: 24 }}>
          A local junk removal professional in your area will review your request and reach out within 1 hour to confirm pricing and availability.
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
          <div style={{ fontSize: ".65rem", color: C.accent, fontFamily: "monospace", fontWeight: 700, marginBottom: 12 }}>WHAT HAPPENS NEXT</div>
          {["✅ Your photos & info are reviewed by a local pro","📞 They call or text you within 1 hour","💰 Final price confirmed before any payment","🚛 Job scheduled at your convenience"].map((s, i) => (
            <div key={i} style={{ fontSize: ".84rem", color: C.muted, padding: "6px 0", borderBottom: i < 3 ? `1px solid ${C.border}` : "none" }}>{s}</div>
          ))}
        </div>
        <div style={{ fontSize: ".78rem", color: C.muted }}>Powered by <span style={{ color: C.accent, fontWeight: 700 }}>JunkPix</span></div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "system-ui, sans-serif" }}>

      {/* Header */}
      <div style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: "1.1rem", fontWeight: 800, color: C.accent, fontFamily: "monospace", letterSpacing: ".1em" }}>JUNKPIX</div>
        <div style={{ fontSize: ".78rem", color: C.muted }}>Free Quote · No Commitment</div>
      </div>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "32px 20px" }}>

        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: "2rem", fontWeight: 800, color: C.text, marginBottom: 8 }}>Get a Free Junk Removal Quote</div>
          <div style={{ fontSize: ".92rem", color: C.muted, lineHeight: 1.6 }}>Upload photos of your junk and get an instant AI-powered price estimate. A local pro in your area will confirm within 1 hour.</div>
        </div>

        {/* Progress */}
        <div style={{ display: "flex", gap: 6, marginBottom: 32 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ flex: 1, height: 4, borderRadius: 4, background: i <= step ? C.accent : C.border }} />
          ))}
        </div>

        {/* Step 1 — Contact Info */}
        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: ".65rem", color: C.accent, fontFamily: "monospace", fontWeight: 700, marginBottom: 16 }}>YOUR INFORMATION</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div><label style={label}>FULL NAME</label><input style={inp} placeholder="John Smith" value={name} onChange={e => setName(e.target.value)} /></div>
                <div><label style={label}>PHONE NUMBER</label><input style={inp} type="tel" placeholder="(555) 000-0000" value={phone} onChange={e => setPhone(e.target.value)} /></div>
                <div><label style={label}>EMAIL</label><input style={inp} type="email" placeholder="john@email.com" value={email} onChange={e => setEmail(e.target.value)} /></div>
              </div>
            </div>

            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: ".65rem", color: C.accent, fontFamily: "monospace", fontWeight: 700, marginBottom: 16 }}>SERVICE ADDRESS</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div><label style={label}>STREET ADDRESS</label><input style={inp} placeholder="123 Main St" value={address} onChange={e => setAddress(e.target.value)} /></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 80px", gap: 10 }}>
                  <div><label style={label}>CITY</label><input style={inp} placeholder="Chicago" value={city} onChange={e => setCity(e.target.value)} /></div>
                  <div><label style={label}>STATE</label><input style={inp} placeholder="IL" maxLength={2} value={state} onChange={e => setState(e.target.value.toUpperCase())} /></div>
                </div>
                <div><label style={label}>ZIP CODE</label><input style={inp} placeholder="60601" maxLength={5} value={zip} onChange={e => setZip(e.target.value)} /></div>
              </div>
            </div>

            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: ".65rem", color: C.accent, fontFamily: "monospace", fontWeight: 700, marginBottom: 12 }}>HOW DID YOU FIND US? <span style={{ color: C.muted, fontFamily: "sans-serif" }}>(optional)</span></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {LEAD_SOURCES.map(src => (
                  <button key={src.key} onClick={() => setLeadSource(s => s === src.key ? "" : src.key)}
                    style={{ padding: "10px 12px", borderRadius: 8, border: `1px solid ${leadSource === src.key ? C.accent : C.border}`, background: leadSource === src.key ? C.accentDim : C.surface, color: leadSource === src.key ? C.accent : C.muted, cursor: "pointer", fontSize: ".82rem", fontWeight: 600, textAlign: "left" }}>
                    {src.emoji} {src.label}
                  </button>
                ))}
              </div>
            </div>

            <button style={btn(!(name && phone && address && zip))} disabled={!(name && phone && address && zip)} onClick={() => setStep(2)}>
              Next — Upload Photos →
            </button>
          </div>
        )}

        {/* Step 2 — Photos */}
        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: ".65rem", color: C.accent, fontFamily: "monospace", fontWeight: 700, marginBottom: 8 }}>📷 UPLOAD PHOTOS</div>
              <div style={{ fontSize: ".82rem", color: C.muted, marginBottom: 16, lineHeight: 1.6 }}>Take a wide shot first, then close-ups of specific items. More photos = more accurate quote. Up to 5 photos.</div>

              <input ref={fileRef} type="file" accept="image/*" multiple onChange={handlePhotos} style={{ display: "none" }} />

              {photos.length < 5 && (
                <button onClick={() => fileRef.current?.click()} style={{ width: "100%", padding: "24px", borderRadius: 8, border: `2px dashed ${C.border}`, background: "transparent", color: C.muted, cursor: "pointer", fontSize: ".88rem", marginBottom: photos.length > 0 ? 16 : 0 }}>
                  📷 {photos.length === 0 ? "Tap to Upload Photos" : "Add More Photos"}
                </button>
              )}

              {photos.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 8, marginBottom: 16 }}>
                  {photos.map((ph, i) => (
                    <div key={i} style={{ position: "relative" }}>
                      <img src={ph} alt="" style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 8, border: `1px solid ${C.border}` }} />
                      <button onClick={() => setPhotos(p => p.filter((_, j) => j !== i))} style={{ position: "absolute", top: 4, right: 4, background: "rgba(0,0,0,0.7)", border: "none", borderRadius: "50%", color: "#ef4444", cursor: "pointer", width: 22, height: 22, fontSize: ".7rem" }}>✕</button>
                    </div>
                  ))}
                </div>
              )}

              {photos.length > 0 && !aiResult && (
                <button onClick={analyzePhotos} disabled={analyzing} style={{ ...btn(analyzing), marginBottom: 0 }}>
                  {analyzing ? "🤖 Analyzing your photos..." : "🤖 Get AI Estimate"}
                </button>
              )}

              {aiResult && (
                <div style={{ background: C.accentDim, border: `1px solid ${C.accent}`, borderRadius: 8, padding: 16 }}>
                  <div style={{ fontSize: ".65rem", color: C.accent, fontFamily: "monospace", fontWeight: 700, marginBottom: 8 }}>✨ AI ESTIMATE</div>
                  {aiResult.siteVisitRequired ? (
                    <div style={{ fontSize: ".88rem", color: C.muted }}>This job requires an in-person assessment. A local pro will contact you to schedule a free site visit.</div>
                  ) : (
                    <>
                      <div style={{ fontSize: "1.6rem", fontWeight: 800, color: C.accent, marginBottom: 4 }}>${aiResult.estimatedMin} – ${aiResult.estimatedMax}</div>
                      <div style={{ fontSize: ".78rem", color: C.muted, lineHeight: 1.6 }}>{aiResult.plainDescription}</div>
                      {aiResult.heavyMaterialFlag && <div style={{ marginTop: 8, fontSize: ".75rem", color: "#ef4444", fontWeight: 600 }}>⚠️ Heavy materials detected — final price confirmed on arrival</div>}
                      {aiResult.tireFlag && <div style={{ marginTop: 4, fontSize: ".75rem", color: "#3b82f6", fontWeight: 600 }}>🔄 Tires detected — additional disposal fees apply</div>}
                    </>
                  )}
                </div>
              )}
            </div>

            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: ".65rem", color: C.accent, fontFamily: "monospace", fontWeight: 700, marginBottom: 8 }}>DESCRIBE YOUR ITEMS <span style={{ color: C.muted, fontFamily: "sans-serif", fontWeight: 400 }}>(optional)</span></div>
              <textarea style={{ ...inp, height: 100, resize: "none" }} placeholder="e.g. Old couch, dresser, boxes of clothes, broken appliances in the basement..." value={description} onChange={e => setDescription(e.target.value)} />
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setStep(1)} style={{ flex: 1, padding: "14px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, cursor: "pointer", fontWeight: 600 }}>← Back</button>
              <button onClick={() => setStep(3)} disabled={photos.length === 0 && !description} style={{ ...btn(photos.length === 0 && !description), flex: 2 }}>
                Review & Submit →
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Review & Submit */}
        {step === 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: ".65rem", color: C.accent, fontFamily: "monospace", fontWeight: 700, marginBottom: 16 }}>REVIEW YOUR REQUEST</div>
              {[
                ["Name", name],
                ["Phone", phone],
                ["Email", email],
                ["Address", `${address}, ${city}, ${state} ${zip}`],
                ["Photos", `${photos.length} photo${photos.length !== 1 ? "s" : ""} uploaded`],
                ...(aiResult && !aiResult.siteVisitRequired ? [["AI Estimate", `$${aiResult.estimatedMin} – $${aiResult.estimatedMax}`]] : []),
                ...(description ? [["Description", description]] : []),
              ].map(([k, v], i, arr) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : "none" }}>
                  <span style={{ fontSize: ".82rem", color: C.muted }}>{k}</span>
                  <span style={{ fontSize: ".82rem", color: k === "AI Estimate" ? C.accent : C.text, fontWeight: 600, textAlign: "right", maxWidth: "60%" }}>{v}</span>
                </div>
              ))}
            </div>

            <div style={{ background: C.accentDim, border: `1px solid ${C.accent}`, borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: ".82rem", color: C.muted, lineHeight: 1.6 }}>
                🔒 <strong style={{ color: C.text }}>No payment now.</strong> A local junk removal professional will review your request and contact you within 1 hour to confirm pricing before anything is scheduled.
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setStep(2)} style={{ flex: 1, padding: "14px", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, cursor: "pointer", fontWeight: 600 }}>← Back</button>
              <button onClick={handleSubmit} disabled={loading} style={{ ...btn(loading), flex: 2 }}>
                {loading ? "Submitting..." : "🚛 Submit Quote Request"}
              </button>
            </div>

            <div style={{ textAlign: "center", fontSize: ".72rem", color: C.muted }}>
              By submitting you agree to be contacted by a local junk removal professional.<br />
              <a href="/privacy" style={{ color: C.accent }}>Privacy Policy</a> · <a href="/terms" style={{ color: C.accent }}>Terms of Service</a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
