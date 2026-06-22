import { DM_Sans } from "next/font/google";

const dm = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800", "900"] });

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
    <div style={{ maxWidth: 900, width: "100%", margin: "0 auto", display: "grid", gridTemplateColumns: isFounding ? "1fr 1fr 1fr" : "1fr 1fr", gap: 20, padding: "0 24px" }}>
      {isFounding && (
        <div style={{ background: "#fff", border: "2px solid #D97B4F", borderRadius: 16, padding: "32px 28px", position: "relative" as const, boxShadow: "0 4px 24px rgba(217,123,79,0.12)" }}>
          <div style={{ position: "absolute" as const, top: -14, left: "50%", transform: "translateX(-50%)", background: "#D97B4F", color: "#fff", fontSize: ".65rem", fontWeight: 800, letterSpacing: ".1em", padding: "5px 14px", borderRadius: 20, whiteSpace: "nowrap" as const }}>
            🔥 FOUNDING OPERATOR
          </div>
          <div style={{ fontSize: ".65rem", color: "#D97B4F", letterSpacing: ".1em", marginBottom: 12, marginTop: 8, fontWeight: 700 }}>LIMITED</div>
          <div style={{ fontSize: "2.4rem", fontWeight: 900, color: "#1A1A1A", marginBottom: 4 }}>$49<span style={{ fontSize: ".9rem", fontWeight: 400, color: "#999" }}>/mo</span></div>
          <div style={{ fontSize: ".78rem", color: "#D97B4F", fontWeight: 700, marginBottom: 20 }}>Locked forever · {foundingLeft} of 20 spots left</div>
          <div style={{ fontSize: ".85rem", color: "#555", lineHeight: 1.8, marginBottom: 24 }}>
            Unlimited quotes<br />Your branded quote page<br />AI suggested replies<br />Email notifications<br />Dashboard + analytics
          </div>
          <a href="/signup" style={{ display: "block", background: "#D97B4F", color: "#fff", padding: "14px 0", borderRadius: 10, fontWeight: 800, fontSize: ".95rem", textDecoration: "none", textAlign: "center" as const }}>
            Claim Your Spot →
          </a>
        </div>
      )}
      <div style={{ background: "#fff", border: "1px solid #E8E8E8", borderRadius: 16, padding: "32px 28px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize: ".65rem", color: "#999", letterSpacing: ".1em", marginBottom: 12, fontWeight: 700 }}>STANDARD</div>
        <div style={{ fontSize: "2.4rem", fontWeight: 900, color: "#1A1A1A", marginBottom: 4 }}>${standardPrice}<span style={{ fontSize: ".9rem", fontWeight: 400, color: "#999" }}>/mo</span></div>
        {!isHighSeason && <div style={{ fontSize: ".75rem", color: "#22c55e", fontWeight: 700, marginBottom: 8 }}>❄️ Winter discount — 50% off (Nov–Mar)</div>}
        {isHighSeason && <div style={{ fontSize: ".75rem", color: "#aaa", marginBottom: 8 }}>❄️ Nov–Mar: 50% off automatically</div>}
        <div style={{ fontSize: ".85rem", color: "#555", lineHeight: 1.8, marginBottom: 24 }}>
          Everything in Founding<br />Priority support<br />New features first
        </div>
        <a href="/signup" style={{ display: "block", background: "#1A1A1A", color: "#fff", padding: "14px 0", borderRadius: 10, fontWeight: 700, fontSize: ".95rem", textDecoration: "none", textAlign: "center" as const }}>
          Start Free Trial
        </a>
      </div>
      <div style={{ background: "#fff", border: "1px solid #E8E8E8", borderRadius: 16, padding: "32px 28px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
        <div style={{ fontSize: ".65rem", color: "#999", letterSpacing: ".1em", marginBottom: 12, fontWeight: 700 }}>AGENCY / TEAM</div>
        <div style={{ fontSize: "2.4rem", fontWeight: 900, color: "#1A1A1A", marginBottom: 4 }}>${agencyPrice}<span style={{ fontSize: ".9rem", fontWeight: 400, color: "#999" }}>/mo</span></div>
        {!isHighSeason && <div style={{ fontSize: ".75rem", color: "#22c55e", fontWeight: 700, marginBottom: 8 }}>❄️ Winter discount — 50% off (Nov–Mar)</div>}
        {isHighSeason && <div style={{ fontSize: ".75rem", color: "#aaa", marginBottom: 8 }}>❄️ Nov–Mar: 50% off automatically</div>}
        <div style={{ fontSize: ".85rem", color: "#555", lineHeight: 1.8, marginBottom: 24 }}>
          Multiple trucks / operators<br />Team dashboard<br />Everything in Standard
        </div>
        <a href="/signup" style={{ display: "block", background: "#1A1A1A", color: "#fff", padding: "14px 0", borderRadius: 10, fontWeight: 700, fontSize: ".95rem", textDecoration: "none", textAlign: "center" as const }}>
          Start Free Trial
        </a>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className={dm.className} style={{ minHeight: "100vh", background: "#F5F4F0", color: "#1A1A1A", fontFamily: "inherit" }}>

      {/* Nav */}
      <nav style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: "1.1rem", fontWeight: 900, letterSpacing: ".04em" }}>
          Junk<span style={{ color: "#D97B4F" }}>Pix</span>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <a href="/login" style={{ color: "#666", textDecoration: "none", fontSize: ".88rem", fontWeight: 500, padding: "8px 16px" }}>Log In</a>
          <a href="/signup" style={{ background: "#D97B4F", color: "#fff", textDecoration: "none", fontSize: ".88rem", fontWeight: 700, padding: "10px 22px", borderRadius: 8 }}>Start Free Trial</a>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "80px 32px 60px", textAlign: "center" as const }}>
        <div style={{ display: "inline-block", background: "rgba(217,123,79,0.1)", color: "#D97B4F", fontSize: ".72rem", fontWeight: 700, letterSpacing: ".12em", padding: "6px 16px", borderRadius: 20, marginBottom: 32 }}>
          AI-POWERED PHOTO QUOTING
        </div>
        <h1 style={{ fontSize: "clamp(2.8rem, 7vw, 5rem)", fontWeight: 900, lineHeight: 1.05, marginBottom: 24, letterSpacing: "-.02em", color: "#111" }}>
          Snap a photo.<br />
          Get a quote.<br />
          <span style={{ color: "#D97B4F" }}>Book the job.</span>
        </h1>
        <p style={{ fontSize: "1.15rem", color: "#666", lineHeight: 1.7, maxWidth: 520, margin: "0 auto 48px", fontWeight: 400 }}>
          Stop wasting trips. Customers send photos, AI reads the job, and you quote from your phone — before you ever leave the driveway.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" as const, flexWrap: "wrap" as const }}>
          <a href="/signup" style={{ background: "#D97B4F", color: "#fff", padding: "16px 36px", borderRadius: 10, fontWeight: 800, fontSize: "1rem", textDecoration: "none", letterSpacing: ".02em", boxShadow: "0 4px 20px rgba(217,123,79,0.35)" }}>
            Start Free Trial
          </a>
          <a href="/login" style={{ background: "#fff", color: "#333", padding: "16px 28px", borderRadius: 10, fontWeight: 600, fontSize: "1rem", textDecoration: "none", border: "1.5px solid #E0E0E0" }}>
            Log In
          </a>
          <a href="/demo" style={{ background: "transparent", color: "#666", padding: "16px 28px", borderRadius: 10, fontWeight: 600, fontSize: "1rem", textDecoration: "none", border: "1.5px solid #D0D0D0" }}>
            See How It Works
          </a>
        </div>
      </section>

      {/* How it works */}
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "0 32px 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20 }}>
          {[
            { icon: "📸", title: "Customer snaps photos", desc: "They photograph the junk from their phone. No app needed." },
            { icon: "🤖", title: "AI reads the job", desc: "Identifies items, estimates volume, describes the job in plain English." },
            { icon: "📱", title: "You get notified", desc: "Email with photos, AI description, and customer contact info." },
            { icon: "💰", title: "You send the quote", desc: "Review, set your price, reply. Job booked." },
          ].map((step, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: 14, padding: "28px 24px", border: "1px solid #EBEBEB", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <div style={{ fontSize: "1.8rem", marginBottom: 14 }}>{step.icon}</div>
              <div style={{ fontWeight: 700, fontSize: ".95rem", marginBottom: 8, color: "#111" }}>{step.title}</div>
              <div style={{ fontSize: ".84rem", color: "#777", lineHeight: 1.6 }}>{step.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section style={{ padding: "0 0 80px" }}>
        <div style={{ textAlign: "center" as const, marginBottom: 48 }}>
          <div style={{ fontSize: ".72rem", color: "#D97B4F", fontWeight: 700, letterSpacing: ".12em", marginBottom: 12 }}>PRICING</div>
          <h2 style={{ fontSize: "2.2rem", fontWeight: 900, color: "#111", marginBottom: 12, letterSpacing: "-.02em" }}>Simple, honest pricing.</h2>
          <p style={{ fontSize: ".95rem", color: "#777", maxWidth: 400, margin: "0 auto" }}>30-day free trial. No credit card needed. Cancel anytime.</p>
        </div>
        <PricingSection />
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid #E8E8E8", padding: "32px", textAlign: "center" as const }}>
        <div style={{ fontSize: "1rem", fontWeight: 900, marginBottom: 8, letterSpacing: ".04em" }}>
          Junk<span style={{ color: "#D97B4F" }}>Pix</span>
        </div>
        <div style={{ fontSize: ".78rem", color: "#aaa" }}>© 2025 JunkPix · Built for junk removal operators</div>
      </footer>

    </main>
  );
}