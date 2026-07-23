"use client";
import { createClient } from "@supabase/supabase-js";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ADMIN_EMAIL = "junkpixapp@gmail.com";

const C = {
  bg: "#0F172A", card: "#1E2937", border: "#2D3748",
  accent: "#00D4C8", text: "#F1F5F9", muted: "#94A3B8",
};

export default function AdminLogin() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check if we have a session from OAuth redirect (hash fragment)
    const handleSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user?.email === ADMIN_EMAIL) {
        // Set the cookie and redirect
        await fetch("/api/admin-set-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: session.access_token }),
        });
        router.push("/admin");
        return;
      }
      
      // Check for error in URL
      const params = new URLSearchParams(window.location.search);
      const err = params.get("error");
      if (err) setError(decodeURIComponent(err));
      
      setChecking(false);
    };

    handleSession();
  }, []);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/admin/login`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  if (checking) return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", color:C.muted, fontFamily:"system-ui" }}>
      Checking session...
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"system-ui,sans-serif" }}>
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"40px 36px", width:"100%", maxWidth:400, textAlign:"center" }}>
        <div style={{ fontSize:"1.4rem", fontWeight:800, color:C.accent, fontFamily:"monospace", letterSpacing:".1em", marginBottom:8 }}>JUNKPIX</div>
        <div style={{ fontSize:".78rem", color:C.muted, marginBottom:32 }}>Admin Panel — Restricted Access</div>
        <div style={{ fontSize:"2rem", marginBottom:16 }}>🔐</div>
        <div style={{ fontSize:"1.1rem", fontWeight:700, color:C.text, marginBottom:8 }}>Admin Access Only</div>
        <div style={{ fontSize:".84rem", color:C.muted, marginBottom:32, lineHeight:1.6 }}>
          Sign in with your authorized Google account.
        </div>
        {error && (
          <div style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:8, padding:12, marginBottom:16, fontSize:".84rem", color:"#ef4444" }}>
            {error}
          </div>
        )}
        <button onClick={handleGoogleLogin} disabled={loading}
          style={{ width:"100%", padding:"14px", borderRadius:8, border:"none", background: loading ? "#2D3748" : C.accent, color: loading ? C.muted : "#000", fontWeight:700, cursor: loading ? "not-allowed" : "pointer", fontSize:".95rem", display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}>
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill={loading ? C.muted : "#000"} d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill={loading ? C.muted : "#000"} d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill={loading ? C.muted : "#000"} d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill={loading ? C.muted : "#000"} d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {loading ? "Signing in..." : "Sign in with Google"}
        </button>
        <div style={{ fontSize:".72rem", color:C.muted, marginTop:20 }}>
          Only authorized accounts can access this panel.
        </div>
      </div>
    </div>
  );
}
