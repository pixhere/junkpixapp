async function getOperatorCount() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/operators?select=id`, {
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
        Prefer: "count=exact",
      },
      next: { revalidate: 60 },
    });
    const count = res.headers.get("content-range");
    const total = count ? parseInt(count.split("/")[1]) : 1;
    return total;
  } catch {
    return 1;
  }
}

async function PricingSection() {
  const count = await getOperatorCount();
  const foundingLeft = Math.max(0, 20 - count);
  const isFounding = foundingLeft > 0;
  const month = new Date().getMonth() + 1;
  const isHighSeason = month >= 4 && month <= 10;
  const standardPrice = isHighSeason ? 99 : 49;
  const agencyPrice = isHighSeason ? 199 : 99;

  return (
    <div style={{ maxWidth: 860, width: "100%", marginBottom: 40, display: "grid", gridTemplateColumns: isFounding ? "1fr 1fr 1fr" : "1fr 1fr", gap: 16 }}>
      {isFounding && (
        <div style={{ background: "rgba(217,123,79,0.1)", border: "2px solid rgba(217,123,79,0.4)", borderRadius: 12, padding: "28px 24px", position: "relative" as const }}>
          <div style={{ position: "absolute" as const, top: -12, left: "50%", transform: "translateX(-50%)", background: "#D97B4F", color: "#000", fontSize: ".65rem", fontWeight: 800, letterSpacing: ".1em", padding: "4px 12px", borderRadius: 20, whiteSpace: "nowrap" as const }}>
            🔥 FOUNDING OPERATOR
          </div>
          <div style={{ fontSize: ".65rem", color: "#D97B4F", fontFamily: "monospace", letterSpacing: ".1em", marginBottom: 12, marginTop: 8 }}>LIMITED</div>
          <div style={{ fontSize: "2.2rem", fontWeight: 900, color: "#fff", marginBottom: 4 }}>$49<span style={{ fontSize: ".9rem", fontWeight: 400, color: "rgba(255,255,255,0.4)" }}>/mo</span></div>
          <div style={{ fontSize: ".75rem", color: "#D97B4F", fontWeight: 700, marginBottom: 16 }}>Locked forever · {foundingLeft} of 20 spots left</div>
          <div style={{ fontSize: ".82rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.7, marginBottom: 20 }}>
            Unlimited quotes<br />Your branded quote page<br />AI suggested replies<br />Email notifications<br />Dashboard + analytics
          </div>
          <a href="/signup" style={{ display: "block", background: "#D97B4F", color: "#000", padding: "13px 0", borderRadius: 8, fontWeight: 800, fontSize: ".9rem", textDecoration: "none", textAlign: "center" as const }}>
            Claim Your Spot →
          </a>
        </div>
      )}
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "28px 24px" }}>
        <div style={{ fontSize: ".65rem", color: "rgba(255,255,255,0.4)", fontFamily: "monospace", letterSpacing: ".1em", marginBottom: 12 }}>STANDARD</div>
        <div style={{ fontSize: "2.2rem", fontWeight: 900, color: "#fff", marginBottom: 4 }}>${standardPrice}<span style={{ fontSize: ".9rem", fontWeight: 400, color: "rgba(255,255,255,0.4)" }}>/mo</span></div>
        <div style={{ fontSize: ".75rem", color: isHighSeason ? "#444" : "#22c55e", fontWeight: 700, marginBottom: 8 }}>
          {isHighSeason ? "❄️ Nov–Mar: 50% off automatically" : "❄️ Winter discount active — 50% off (Nov–Mar)"}
        </div>
        <div style={{ fontSize: ".82rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.7, marginBottom: 20 }}>
          Everything in Founding<br />Priority support<br />New features first
        </div>
        <a href="/signup" style={{ display: "block", background: "transparent", color: "#fff", padding: "13px 0", borderRadius: 8, fontWeight: 700, fontSize: ".9rem", textDecoration: "none", textAlign: "center" as const, border: "1px solid rgba(255,255,255,0.2)" }}>
          Start Free Trial
        </a>
      </div>
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "28px 24px" }}>
        <div style={{ fontSize: ".65rem", color: "rgba(255,255,255,0.4)", fontFamily: "monospace", letterSpacing: ".1em", marginBottom: 12 }}>AGENCY / TEAM</div>
        <div style={{ fontSize: "2.2rem", fontWeight: 900, color: "#fff", marginBottom: 4 }}>${agencyPrice}<span style={{ fontSize: ".9rem", fontWeight: 400, color: "rgba(255,255,255,0.4)" }}>/mo</span></div>
        <div style={{ fontSize: ".75rem", color: isHighSeason ? "#444" : "#22c55e", fontWeight: 700, marginBottom: 8 }}>
          {isHighSeason ? "❄️ Nov–Mar: 50% off automatically" : "❄️ Winter discount active — 50% off (Nov–Mar)"}
        </div>
        <div style={{ fontSize: ".82rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.7, marginBottom: 20 }}>
          Multiple trucks / operators<br />Team dashboard<br />Everything in Standard
        </div>
        <a href="/signup" style={{ display: "block", background: "transparent", color: "#fff", padding: "13px 0", borderRadius: 8, fontWeight: 700, fontSize: ".9rem", textDecoration: "none", textAlign: "center" as const, border: "1px solid rgba(255,255,255,0.2)" }}>
          Start Free Trial
        </a>
      </div>
    </div>
  );
}
export default function Home() {
  return (
    <main style={{
      minHeight: "100vh",
      background: "#0D0B09",
      color: "#FFFFFF",
      fontFamily: "system-ui, sans-serif",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      textAlign: "center"
    }}>

      {/* Logo */}
      <div style={{
        fontSize: "1rem",
        fontWeight: 800,
        letterSpacing: ".15em",
        color: "#D97B4F",
        marginBottom: 40,
        fontFamily: "monospace"
      }}>
        JUNKPIX
      </div>

      {/* Headline */}
      <h1 style={{
        fontSize: "clamp(2rem, 8vw, 4rem)",
        fontWeight: 800,
        lineHeight: 1.1,
        margin: "0 0 24px",
        maxWidth: 700
      }}>
        Snap a photo.<br />
        Get a quote.<br />
        <span style={{ color: "#D97B4F" }}>Book the job.</span>
      </h1>

      {/* Subheadline */}
      <p style={{
        fontSize: "clamp(1rem, 3vw, 1.25rem)",
        color: "rgba(255,255,255,0.6)",
        lineHeight: 1.6,
        maxWidth: 500,
        margin: "0 0 48px"
      }}>
        AI-powered photo quoting for junk removal operators.
        Stop wasting trips. Start booking more jobs.
      </p>

      <div style={{ display:"flex", gap:12, flexWrap:"wrap" as const, justifyContent:"center" }}>
        <a href="/signup" style={{
          background: "#D97B4F",
          color: "#fff",
          padding: "16px 32px",
          borderRadius: 8,
          fontWeight: 700,
          fontSize: "1rem",
          textDecoration: "none",
          letterSpacing: ".04em"
        }}>
          Start Free Trial
        </a>
        <a href="/login" style={{
          background: "transparent",
          color: "rgba(255,255,255,0.7)",
          padding: "16px 24px",
          borderRadius: 8,
          fontWeight: 600,
          fontSize: "1rem",
          textDecoration: "none",
          border: "1.5px solid rgba(255,255,255,0.15)",
          letterSpacing: ".04em"
        }}>
          Log In
        </a>
        <a href="/demo" style={{
          background: "transparent",
          color: "#fff",
          padding: "16px 32px",
          borderRadius: 8,
          fontWeight: 700,
          fontSize: "1rem",
          textDecoration: "none",
          border: "1.5px solid rgba(255,255,255,0.2)",
          letterSpacing: ".04em"
        }}>
          See How It Works
        </a>
      </div>
          

      {/* How it works */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: 24,
        maxWidth: 800,
        width: "100%",
        marginTop: 48,
        marginBottom: 80
      }}>
        {[
          { icon: "📸", title: "Customer snaps photos", desc: "They photograph the junk from their phone. No app download needed." },
          { icon: "🤖", title: "AI reads the job", desc: "Identifies items, estimates volume, describes the job in plain English." },
          { icon: "📱", title: "You get notified", desc: "Text and email with photos, AI description, and customer contact info." },
          { icon: "💰", title: "You send the quote", desc: "Review the photos, set your price, reply to the customer. Job booked." },
        ].map((step, i) => (
          <div key={i} style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12,
            padding: 24,
            textAlign: "left"
          }}>
            <div style={{ fontSize: "1.8rem", marginBottom: 12 }}>{step.icon}</div>
            <div style={{ fontWeight: 700, fontSize: ".95rem", marginBottom: 8, color: "#fff" }}>{step.title}</div>
            <div style={{ fontSize: ".84rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>{step.desc}</div>
          </div>
        ))}
      </div>

      {/* Pricing teaser */}
      <PricingSection />

      {/* Footer */}
      <div style={{ fontSize: ".78rem", color: "rgba(255,255,255,0.25)" }}>
        © 2025 JunkPix · Built for junk removal operators
      </div>

    </main>
  );
}