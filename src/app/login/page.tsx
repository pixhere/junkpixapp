"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(err.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 8,
    border: "1px solid #2D3748",
    background: "#1E2937",
    color: "#fff",
    fontSize: ".9rem",
    fontFamily: "inherit",
    marginBottom: 16,
    boxSizing: "border-box" as const,
  };

  const labelStyle = {
    fontSize: ".78rem",
    fontWeight: 600 as const,
    color: "rgba(255,255,255,0.3)",
    letterSpacing: ".06em",
    fontFamily: "monospace",
    marginBottom: 6,
    display: "block" as const,
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0F172A",
      color: "#fff",
      fontFamily: "system-ui, sans-serif",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
    }}>
      <div style={{
        background: "#141414",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16,
        padding: "40px 36px",
        width: "100%",
        maxWidth: 440,
      }}>
        {/* Logo */}
        <div style={{
          fontSize: ".85rem",
          fontWeight: 800,
          letterSpacing: ".15em",
          color: "#00D4C8",
          fontFamily: "monospace",
          marginBottom: 32,
        }}>
          JUNKPIX
        </div>

        <h1 style={{ fontSize: "1.6rem", fontWeight: 800, marginBottom: 8 }}>
          Welcome back.
        </h1>
        <p style={{
          fontSize: ".88rem",
          color: "rgba(255,255,255,0.6)",
          marginBottom: 32,
          lineHeight: 1.5,
        }}>
          Log in to see your quote requests and manage your business.
        </p>

        {error && (
          <div style={{
            background: "rgba(199,107,92,0.1)",
            border: "1px solid rgba(199,107,92,0.3)",
            borderRadius: 8,
            padding: "12px 14px",
            fontSize: ".84rem",
            color: "#C76B5C",
            marginBottom: 16,
          }}>
            {error}
          </div>
        )}

        <label style={labelStyle}>EMAIL ADDRESS</label>
        <input
          style={inputStyle}
          type="email"
          placeholder="you@yourbusiness.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleLogin()}
        />

        <label style={labelStyle}>PASSWORD</label>
        <input
          style={inputStyle}
          type="password"
          placeholder="Your password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleLogin()}
        />

        <button
          onClick={handleLogin}
          disabled={loading || !email || !password}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: 8,
            border: "none",
            background: loading || !email || !password
              ? "rgba(0,212,200,0.2)"
              : "#00D4C8",
            color: loading || !email || !password
              ? "rgba(255,255,255,0.4)"
              : "#fff",
            fontSize: ".95rem",
            fontWeight: 700,
            cursor: loading || !email || !password ? "not-allowed" : "pointer",
            letterSpacing: ".04em",
            marginTop: 8,
          }}
        >
          {loading ? "Logging in..." : "Log In →"}
        </button>

        <p style={{
          textAlign: "center",
          fontSize: ".82rem",
          color: "rgba(255,255,255,0.3)",
          marginTop: 20,
        }}>
          Don't have an account?{" "}
          <a href="/signup" style={{ color: "#00D4C8", textDecoration: "none" }}>
            Start free trial
          </a>
        </p>
      </div>
    </div>
  );
}