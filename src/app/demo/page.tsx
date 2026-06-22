"use client";

import { useRouter } from "next/navigation";

const C = {
  bg: "#0A0A0A",
  card: "#111111",
  border: "#1E1E1E",
  accent: "#D97B4F",
  text: "#F0F0F0",
  muted: "#666666",
  red: "#ef4444",
  green: "#22c55e",
};

export default function HowItWorksPage() {
  const router = useRouter();

  const oldWay = [
    { icon: "🚛", pain: "Drive 45 minutes just to look at a pile of junk", sub: "Get there and they lowball you anyway." },
    { icon: "😤", pain: "You're the third guy they called", sub: "They already got two cheaper quotes before you showed up." },
    { icon: "💸", pain: "No idea if they'll actually pay", sub: "Some people just want a free estimate to feel better about their junk." },
    { icon: "🤷", pain: "Pricing feels like a guess every time", sub: "Too high and you lose it. Too low and you regret it." },
    { icon: "⛽", pain: "You burned $40 in gas on a job that ghosted you", sub: "That stings every time." },
  ];

  const newWay = [
    { icon: "📸", win: "They send photos before you ever start the truck", sub: "You know exactly what you're walking into." },
    { icon: "✅", win: "People who fill out the form are ready to book", sub: "The extra step filters out the window shoppers." },
    { icon: "🤖", win: "AI looks at the photos and tells you what it's worth", sub: "Based on your actual costs, not a gut feeling." },
    { icon: "💰", win: "Your pricing is already built in", sub: "Set it once. Never second-guess a quote again." },
    { icon: "🗺️", win: "Quote 10 jobs from your couch on a Sunday night", sub: "Book the week before it starts." },
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "system-ui, sans-serif" }}>

      {/* Nav */}
      <div style={{ borderBottom: `1px solid ${C.border}`, padding: "18px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: "1.1rem", fontWeight: 800, letterSpacing: ".06em", cursor: "pointer" }} onClick={() => router.push("/")}>
          JUNK<span style={{ color: C.accent }}>PIX</span>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <a href="/login" style={{ color: C.muted, textDecoration: "none", fontSize: ".88rem", padding: "8px 16px" }}>Log In</a>
          <a href="/signup" style={{ background: C.accent, color: "#000", textDecoration: "none", fontSize: ".88rem", fontWeight: 700, padding: "8px 20px", borderRadius: 8 }}>Start Free Trial</a>
        </div>
      </div>

      {/* Hero */}
      <div style={{ textAlign: "center" as const, padding: "80px 24px 60px" }}>
        <div style={{ fontSize: ".7rem", color: C.accent, letterSpacing: ".15em", fontFamily: "monospace", marginBottom: 16 }}>SOUND FAMILIAR?</div>
        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)", fontWeight: 900, lineHeight: 1.15, marginBottom: 20, maxWidth: 700, margin: "0 auto 20px" }}>
          You're tired of driving to jobs<br />
          <span style={{ color: C.accent }}>that were never real to begin with.</span>
        </h1>
        <p style={{ fontSize: "1rem", color: C.muted, maxWidth: 500, margin: "0 auto 48px", lineHeight: 1.7 }}>
          Every operator has wasted a tank of gas on a quote that went nowhere. JunkPix puts the photos first — so you know what you're getting into before you ever leave the driveway.
        </p>
      </div>

      {/* Comparison grid */}
      <div style={{ maxWidth: 1060, margin: "0 auto", padding: "0 24px 80px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

        {/* Old way */}
        <div style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 16, padding: "32px 28px" }}>
          <div style={{ fontSize: ".68rem", color: "#ef4444", letterSpacing: ".15em", fontFamily: "monospace", marginBottom: 28, display: "flex", alignItems: "center", gap: 8, fontWeight: 700 }}>
            ✗ THE OLD WAY
          </div>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 28 }}>
            {oldWay.map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                <span style={{ fontSize: "1.5rem", flexShrink: 0 }}>{item.icon}</span>
                <div>
                  <div style={{ fontSize: ".95rem", fontWeight: 700, color: "rgba(240,240,240,0.5)", marginBottom: 5, textDecoration: "line-through" }}>{item.pain}</div>
                  <div style={{ fontSize: ".82rem", color: "#ef4444", opacity: 0.85, lineHeight: 1.5 }}>{item.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* New way */}
        <div style={{ background: "rgba(217,123,79,0.05)", border: "1px solid rgba(217,123,79,0.25)", borderRadius: 16, padding: "32px 28px" }}>
          <div style={{ fontSize: ".68rem", color: C.accent, letterSpacing: ".15em", fontFamily: "monospace", marginBottom: 28, display: "flex", alignItems: "center", gap: 8, fontWeight: 700 }}>
            ✓ WITH JUNKPIX
          </div>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 28 }}>
            {newWay.map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                <span style={{ fontSize: "1.5rem", flexShrink: 0 }}>{item.icon}</span>
                <div>
                  <div style={{ fontSize: ".95rem", fontWeight: 700, color: C.text, marginBottom: 5 }}>{item.win}</div>
                  <div style={{ fontSize: ".82rem", color: C.muted, lineHeight: 1.5 }}>{item.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div style={{ textAlign: "center" as const, padding: "0 24px 100px" }}>
        <div style={{ background: "rgba(217,123,79,0.08)", border: "1px solid rgba(217,123,79,0.2)", borderRadius: 16, padding: "48px 32px", maxWidth: 520, margin: "0 auto" }}>
          <div style={{ fontSize: ".68rem", color: C.accent, letterSpacing: ".15em", fontFamily: "monospace", marginBottom: 16 }}>READY TO STOP WASTING TRIPS?</div>
          <h2 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: 12, lineHeight: 1.2 }}>
            30 days free.<br />No credit card.
          </h2>
          <p style={{ fontSize: ".9rem", color: C.muted, marginBottom: 32, lineHeight: 1.6 }}>
            Set up your quote page in 5 minutes. Share the link with customers. Start getting photo quotes today.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" as const, flexWrap: "wrap" as const }}>
            <a href="/signup" style={{ background: C.accent, color: "#000", textDecoration: "none", padding: "16px 36px", borderRadius: 8, fontWeight: 800, fontSize: "1rem", letterSpacing: ".04em" }}>
              Start Free Trial →
            </a>
            <a href="/" style={{ background: "transparent", color: C.muted, textDecoration: "none", padding: "16px 24px", borderRadius: 8, fontWeight: 600, fontSize: ".9rem", border: `1px solid ${C.border}` }}>
              Back to Home
            </a>
          </div>
          <div style={{ marginTop: 24, fontSize: ".75rem", color: C.muted }}>
            First 20 operators lock in $49/month forever. 18 spots left.
          </div>
        </div>
      </div>

    </div>
  );
}