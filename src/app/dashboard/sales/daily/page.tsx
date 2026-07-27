"use client";
import React, { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import NavLayout from "@/components/NavLayout";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const C = {
  bg:"#0F172A", card:"#1E2937", border:"#2D3748", text:"#F5F4F0",
  muted:"#94A3B8", accent:"#00D4C8", surface:"#162032", green:"#22c55e",
};

function Skeleton() {
  return (
    <div style={{ display:"flex", flexDirection:"column" as const, gap:12 }}>
      {[100, 80, 90, 60, 85, 70].map((w, i) => (
        <div key={i} style={{ height:14, borderRadius:6, background:"rgba(255,255,255,0.06)", width:`${w}%`, animation:"pulse 1.5s ease-in-out infinite" }} />
      ))}
      <style>{"@keyframes pulse{0%,100%{opacity:.4}50%{opacity:.8}}"}</style>
    </div>
  );
}

export default function DailyIntelPage() {
  const [operator, setOperator] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const streamRef = useRef("");

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: op } = await supabase.from("operators").select("*").eq("id", user.id).single();
      if (op) setOperator(op);
    };
    load();

    // Load cached daily content
    const today = new Date().toDateString();
    const cachedDate = localStorage.getItem("daily_intel_date");
    const cached = localStorage.getItem("daily_intel_content");
    if (cachedDate === today && cached) {
      setContent(cached);
    }
  }, []);

  const generate = async () => {
    setLoading(true);
    setStreaming(false);
    setContent("");
    setError("");
    streamRef.current = "";

    try {
      const res = await fetch("/api/sales-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "daily_intel",
          operator,
          dateSeed: new Date().toDateString(),
        }),
      });

      if (!res.ok) {
        setError("Something went wrong. Try again.");
        setLoading(false);
        return;
      }

      setLoading(false);
      setStreaming(true);

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      // Batch updates every 100ms for smooth rendering
      let lastUpdate = Date.now();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        streamRef.current += decoder.decode(value, { stream: true });
        const now = Date.now();
        if (now - lastUpdate > 100) {
          setContent(streamRef.current);
          lastUpdate = now;
        }
      }

      // Final update
      setContent(streamRef.current);
      setStreaming(false);

      localStorage.setItem("daily_intel_content", streamRef.current);
      localStorage.setItem("daily_intel_date", new Date().toDateString());

    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
      setStreaming(false);
    }
  };

  const isGenerating = loading || streaming;

  return (
    <NavLayout active="sales" title="⚡ Daily Intel" backHref="/dashboard/sales">
      <div style={{ padding:24, maxWidth:680 }}>

        {/* Header card */}
        <div style={{ background:C.card, border:"1px solid "+C.border, borderRadius:12, padding:20, marginBottom:16 }}>
          <div style={{ fontWeight:700, color:C.text, marginBottom:4 }}>⚡ Daily Sales Intel</div>
          <div style={{ fontSize:".84rem", color:C.muted, marginBottom:16 }}>
            Fresh lesson from the masters. Changes every day. Cached so you can come back anytime.
          </div>
          <button
            onClick={generate}
            disabled={isGenerating}
            style={{ padding:"12px 24px", borderRadius:8, border:"none", background: isGenerating ? "rgba(0,212,200,0.4)" : C.accent, color:"#000", fontWeight:700, cursor: isGenerating ? "not-allowed" : "pointer", fontSize:".9rem" }}
          >
            {loading ? "Connecting to the masters..." : streaming ? "⚡ Generating..." : content ? "🔄 Refresh" : "⚡ Get Today's Intel"}
          </button>
        </div>

        {/* Content card */}
        <div style={{ background:C.card, border:"1px solid "+C.border, borderRadius:12, padding:24, minHeight:200 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <div style={{ fontSize:".7rem", color:C.accent, fontFamily:"monospace", fontWeight:700 }}>✨ FROM THE MASTERS</div>
            {content && !isGenerating && (
              <button
                onClick={() => { navigator.clipboard.writeText(content); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                style={{ padding:"6px 12px", borderRadius:6, border:"1px solid "+C.border, background:"transparent", color: copied ? C.green : C.muted, cursor:"pointer", fontSize:".75rem" }}
              >
                {copied ? "Copied ✓" : "📋 Copy"}
              </button>
            )}
          </div>

          {/* States */}
          {!isGenerating && !content && !error && (
            <div style={{ color:C.muted, fontSize:".88rem", textAlign:"center" as const, padding:"40px 0" }}>
              Press the button to get today's sales intelligence.
            </div>
          )}

          {loading && <Skeleton />}

          {error && (
            <div style={{ color:"#ef4444", fontSize:".88rem", padding:"20px 0" }}>
              {error} <button onClick={generate} style={{ color:C.accent, background:"none", border:"none", cursor:"pointer", textDecoration:"underline" }}>Try again</button>
            </div>
          )}

          {(streaming || content) && (
            <div style={{ fontSize:".88rem", color:C.text, lineHeight:1.9, whiteSpace:"pre-wrap" as const }}>
              {content}
              {streaming && <span style={{ display:"inline-block", width:2, height:14, background:C.accent, marginLeft:2, animation:"blink .7s step-end infinite", verticalAlign:"middle" }} />}
              <style>{"@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}"}</style>
            </div>
          )}
        </div>

      </div>
    </NavLayout>
  );
}
