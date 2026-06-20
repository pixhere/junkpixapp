"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const C = {
  bg: "#0A0A0A",
  card: "#141414",
  ink: "#FFFFFF",
  inkSoft: "rgba(255,255,255,0.6)",
  inkFaint: "rgba(255,255,255,0.3)",
  clay: "#D97B4F",
  line: "rgba(255,255,255,0.08)",
};

export default function SignupPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [website, setWebsite] = useState("");
  const [minimumJob, setMinimumJob] = useState("150");
  const [dumpFee, setDumpFee] = useState("85");
  const [laborRate, setLaborRate] = useState("25");
  const [crewSize, setCrewSize] = useState("2");
  const [margin, setMargin] = useState("35");
  const [gasPrice, setGasPrice] = useState("3.50");

  const handleSignup = async () => {
    setLoading(true);
    setError("");
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error("No user created");

      const { error: operatorError } = await supabase
        .from("operators")
        .insert({
          id: authData.user.id,
          email,
          business_name: businessName,
          owner_name: ownerName,
          phone,
          city,
          state,
          zip,
          website,
          minimum_job: parseInt(minimumJob),
          dump_fee_per_ton: parseFloat(dumpFee),
          labor_rate_per_hour: parseFloat(laborRate),
          crew_size: parseInt(crewSize),
          margin_percent: parseInt(margin),
          gas_price: parseFloat(gasPrice),
        });
      if (operatorError) throw operatorError;
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
    <div style={{ minHeight:"100vh", background:"#0A0A0A", color:"#fff", fontFamily:"system-ui,sans-serif", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:"#141414", border:"1px solid rgba(255,255,255,0.08)", borderRadius:16, padding:"40px 36px", width:"100%", maxWidth:480, textAlign:"center" }}>
        <div style={{ fontSize:"3rem", marginBottom:20 }}>🎉</div>
        <div style={{ fontSize:".85rem", fontWeight:800, letterSpacing:".15em", color:"#D97B4F", fontFamily:"monospace", marginBottom:24 }}>JUNKPIX</div>
        <h1 style={{ fontSize:"1.4rem", fontWeight:800, marginBottom:8 }}>You're in.</h1>
        <p style={{ fontSize:".88rem", color:"rgba(255,255,255,0.6)", lineHeight:1.5, marginBottom:24 }}>
          Check your email at <strong>{email}</strong> to confirm your account. Once confirmed you can log in and start receiving quote requests.
        </p>
        <a href="/login" style={{ display:"block", background:"#D97B4F", color:"#fff", padding:"14px 24px", borderRadius:8, fontWeight:700, fontSize:".95rem", textDecoration:"none", textAlign:"center" }}>
          Go to Login
        </a>
      </div>
    </div>
  );

  const inputStyle = { width:"100%", padding:"12px 14px", borderRadius:8, border:"1px solid rgba(255,255,255,0.08)", background:"rgba(255,255,255,0.04)", color:"#fff", fontSize:".9rem", fontFamily:"inherit", marginBottom:16, boxSizing:"border-box" as const };
  const labelStyle = { fontSize:".78rem", fontWeight:600 as const, color:"rgba(255,255,255,0.3)", letterSpacing:".06em", fontFamily:"monospace", marginBottom:6, display:"block" as const };
  const btnStyle = { width:"100%", padding:"14px", borderRadius:8, border:"none", background:"#D97B4F", color:"#fff", fontSize:".95rem", fontWeight:700 as const, cursor:"pointer", letterSpacing:".04em", marginTop:8 };
  const btnDisabled = { ...btnStyle, background:"rgba(217,123,79,0.3)", color:"rgba(255,255,255,0.4)", cursor:"not-allowed" as const };

  return (
    <div style={{ minHeight:"100vh", background:"#0A0A0A", color:"#fff", fontFamily:"system-ui,sans-serif", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:"#141414", border:"1px solid rgba(255,255,255,0.08)", borderRadius:16, padding:"40px 36px", width:"100%", maxWidth:480 }}>

        <div style={{ fontSize:".85rem", fontWeight:800, letterSpacing:".15em", color:"#D97B4F", fontFamily:"monospace", marginBottom:32 }}>JUNKPIX</div>

        {/* Progress bar */}
        <div style={{ display:"flex", gap:8, marginBottom:32 }}>
          {[1,2,3].map(n => (
            <div key={n} style={{ height:4, flex:1, borderRadius:2, background: step >= n ? "#D97B4F" : "rgba(255,255,255,0.1)" }} />
          ))}
        </div>

        {error && (
          <div style={{ background:"rgba(199,107,92,0.1)", border:"1px solid rgba(199,107,92,0.3)", borderRadius:8, padding:"12px 14px", fontSize:".84rem", color:"#C76B5C", marginBottom:16 }}>
            {error}
          </div>
        )}

        {/* STEP 1 */}
        {step === 1 && (
          <>
            <h1 style={{ fontSize:"1.6rem", fontWeight:800, marginBottom:8 }}>Create your account</h1>
            <p style={{ fontSize:".88rem", color:"rgba(255,255,255,0.6)", marginBottom:32, lineHeight:1.5 }}>Start your 30-day free trial. No credit card needed.</p>

            <label style={labelStyle}>EMAIL ADDRESS</label>
            <input style={inputStyle} type="email" placeholder="you@yourbusiness.com" value={email} onChange={e => setEmail(e.target.value)} />

            <label style={labelStyle}>PASSWORD</label>
            <input style={inputStyle} type="password" placeholder="At least 8 characters" value={password} onChange={e => setPassword(e.target.value)} />

            <label style={labelStyle}>CONFIRM PASSWORD</label>
            <input style={inputStyle} type="password" placeholder="Same password again" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />

            <button
              style={email && password && password === confirmPassword && password.length >= 8 ? btnStyle : btnDisabled}
              disabled={!email || !password || password !== confirmPassword || password.length < 8}
              onClick={() => { if (password !== confirmPassword) { setError("Passwords don't match"); return; } setError(""); setStep(2); }}
            >
              Continue →
            </button>

            <p style={{ textAlign:"center", fontSize:".82rem", color:"rgba(255,255,255,0.3)", marginTop:20 }}>
              Already have an account? <a href="/login" style={{ color:"#D97B4F", textDecoration:"none" }}>Log in</a>
            </p>
          </>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <>
            <h1 style={{ fontSize:"1.6rem", fontWeight:800, marginBottom:8 }}>Your business</h1>
            <p style={{ fontSize:".88rem", color:"rgba(255,255,255,0.6)", marginBottom:32, lineHeight:1.5 }}>This is how you'll appear to customers on your quote page.</p>

            <label style={labelStyle}>BUSINESS NAME</label>
            <input style={inputStyle} placeholder="e.g. The GO TO Junk Removal LLC" value={businessName} onChange={e => setBusinessName(e.target.value)} />

            <label style={labelStyle}>YOUR NAME</label>
            <input style={inputStyle} placeholder="Owner's full name" value={ownerName} onChange={e => setOwnerName(e.target.value)} />

            <label style={labelStyle}>PHONE NUMBER</label>
            <input style={inputStyle} type="tel" placeholder="Your cell — quote notifications go here" value={phone} onChange={e => setPhone(e.target.value)} />

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <div>
                <label style={labelStyle}>CITY</label>
                <input style={inputStyle} placeholder="Harrisburg" value={city} onChange={e => setCity(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>STATE</label>
                <input style={inputStyle} placeholder="PA" value={state} onChange={e => setState(e.target.value)} />
              </div>
            </div>

            <label style={labelStyle}>ZIP CODE</label>
            <input style={inputStyle} placeholder="17101" value={zip} onChange={e => setZip(e.target.value)} />
    

            <label style={labelStyle}>WEBSITE</label>
            <input style={inputStyle} placeholder="https://yourbusiness.com" value={website} onChange={e => setWebsite(e.target.value)} />

            <div style={{ display:"flex", gap:12, marginTop:8 }}>
              <button onClick={() => setStep(1)} style={{ ...btnStyle, background:"transparent", border:"1px solid rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.6)", flex:1 }}>← Back</button>
              <button
                style={businessName && ownerName && phone && city && state ? { ...btnStyle, flex:2 } : { ...btnDisabled, flex:2 }}
                disabled={!businessName || !ownerName || !phone || !city || !state}
                onClick={() => setStep(3)}
              >Continue →</button>
            </div>
          </>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <>
            <h1 style={{ fontSize:"1.6rem", fontWeight:800, marginBottom:8 }}>Your pricing</h1>
            <p style={{ fontSize:".88rem", color:"rgba(255,255,255,0.6)", marginBottom:32, lineHeight:1.5 }}>
              These power your quotes. Update anytime from your dashboard — gas price and crew size change all the time.
            </p>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <div>
                <label style={labelStyle}>MINIMUM JOB ($)</label>
                <input style={inputStyle} type="number" value={minimumJob} onChange={e => setMinimumJob(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>DUMP FEE / TON ($)</label>
                <input style={inputStyle} type="number" value={dumpFee} onChange={e => setDumpFee(e.target.value)} />
              </div>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <div>
                <label style={labelStyle}>LABOR / HOUR ($)</label>
                <input style={inputStyle} type="number" value={laborRate} onChange={e => setLaborRate(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>CREW SIZE</label>
                <input style={inputStyle} type="number" value={crewSize} onChange={e => setCrewSize(e.target.value)} />
              </div>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <div>
                <label style={labelStyle}>YOUR MARGIN (%)</label>
                <input style={inputStyle} type="number" value={margin} onChange={e => setMargin(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>GAS PRICE ($)</label>
                <input style={inputStyle} type="number" step="0.01" value={gasPrice} onChange={e => setGasPrice(e.target.value)} />
              </div>
            </div>

            <p style={{ fontSize:".75rem", color:"rgba(255,255,255,0.3)", lineHeight:1.5, marginBottom:16 }}>
              💡 Update gas price and crew size daily from your dashboard.
            </p>

            <div style={{ display:"flex", gap:12, marginTop:8 }}>
              <button onClick={() => setStep(2)} style={{ ...btnStyle, background:"transparent", border:"1px solid rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.6)", flex:1 }}>← Back</button>
              <button
                style={loading ? { ...btnDisabled, flex:2 } : { ...btnStyle, flex:2 }}
                disabled={loading}
                onClick={handleSignup}
              >
                {loading ? "Creating account..." : "Launch JunkPix →"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}