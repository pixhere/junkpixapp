export default function Home() {
  return (
    <main style={{
      minHeight: "100vh",
      background: "#0A0A0A",
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
      <div style={{
        background: "rgba(217,123,79,0.08)",
        border: "1px solid rgba(217,123,79,0.2)",
        borderRadius: 12,
        padding: "32px 40px",
        maxWidth: 400,
        width: "100%",
        marginBottom: 40
      }}>
        <div style={{ fontSize: ".7rem", letterSpacing: ".1em", color: "#D97B4F", fontFamily: "monospace", marginBottom: 16 }}>PRICING</div>
        <div style={{ fontSize: "2.5rem", fontWeight: 800, color: "#fff", marginBottom: 8 }}>$99<span style={{ fontSize: "1rem", fontWeight: 400, color: "rgba(255,255,255,0.4)" }}>/month</span></div>
        <div style={{ fontSize: ".88rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.6, marginBottom: 20 }}>
          Unlimited quote requests<br />
          Your own branded quote page<br />
          Email notifications<br />
          Lead management dashboard
        </div>
        <a href="/signup" style={{
          display: "block",
          background: "#D97B4F",
          color: "#fff",
          padding: "14px 24px",
          borderRadius: 8,
          fontWeight: 700,
          fontSize: ".95rem",
          textDecoration: "none",
          textAlign: "center"
        }}>
          Start 30-Day Free Trial
        </a>
      </div>

      {/* Footer */}
      <div style={{ fontSize: ".78rem", color: "rgba(255,255,255,0.25)" }}>
        © 2025 JunkPix · Built for junk removal operators
      </div>

    </main>
  );
}