"use client";
import React, { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import NavLayout from "@/components/NavLayout";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const C = {
  bg:"#0F172A", card:"#0F172A", border:"#2D3748", text:"#F5F4F0",
  muted:"#666660", accent:"#00D4C8", surface:"#1a1a1a", green:"#22c55e",
};

export default function CloseJobPage() {
  const [operator, setOperator] = useState<any>(null);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState("");
  const [copied, setCopied] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: op } = await supabase.from("operators").select("*").eq("id", user.id).single();
      if (op) setOperator(op);
      const { data: qs } = await supabase.from("quote_requests").select("*").eq("operator_id", user.id).in("status", ["new","reviewed","quoted","booked"]).order("created_at", { ascending: false });
      if (qs) setQuotes(qs);
    };
    load();
  }, []);

  const generate = async (quote: any) => {
    if (!operator) return;
    setLoading(true);
    setContent("");
    if (contentRef.current) contentRef.current.innerText = "";
    try {
      const res = await fetch("/api/sales-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "close_job", operator, quote }),
      });
      if (!res.ok) { setContent("Something went wrong. Try again."); setLoading(false); return; }
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let full = "";
      setLoading(false);
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        full += chunk;
        if (contentRef.current) contentRef.current.innerText = full;
      }
      setContent(full);
    } catch {
      setContent("Something went wrong. Try again.");
      setLoading(false);
    }
  };

  return (
    <NavLayout active="sales" title="🎯 Close a Job" backHref="/dashboard/sales">
      <div style={{ padding: 16 }}>

        <div style={{ fontSize: ".65rem", color: C.muted, fontFamily: "monospace", letterSpacing: ".1em", marginBottom: 12 }}>SELECT A LEAD</div>

        {quotes.length === 0 && (
          <div style={{ color: C.muted, fontSize: ".84rem", padding: 20 }}>No active leads found.</div>
        )}

        <div style={{ display: "flex", flexDirection: "column" as const, gap: 8, marginBottom: 16 }}>
          {quotes.map(q => (
            <div key={q.id}>
              <button
                onClick={() => { setSelectedQuote(q); setContent(""); if (contentRef.current) contentRef.current.innerText = ""; }}
                style={{ width: "100%", padding: "14px 16px", borderRadius: selectedQuote?.id === q.id ? "8px 8px 0 0" : 8, border: "1px solid " + (selectedQuote?.id === q.id ? C.accent : C.border), background: selectedQuote?.id === q.id ? "rgba(0,212,200,0.15)" : C.card, color: C.text, cursor: "pointer", textAlign: "left" as const, display: "flex", justifyContent: "space-between", alignItems: "center" }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: ".9rem" }}>{q.customer_name}</div>
                  <div style={{ fontSize: ".75rem", color: C.muted, marginTop: 2 }}>${q.final_price || q.estimated_min} · {q.customer_address} · <span style={{ textTransform: "capitalize" as const }}>{q.status}</span></div>
                </div>
                <span style={{ color: selectedQuote?.id === q.id ? C.accent : C.muted }}>›</span>
              </button>

              {/* Generate button appears right below selected quote */}
              {selectedQuote?.id === q.id && (
                <div style={{ border: "1px solid " + C.accent, borderTop: "none", borderRadius: "0 0 8px 8px", overflow: "hidden" }}>
                  <button
                    onClick={() => generate(q)}
                    disabled={loading}
                    style={{ width: "100%", padding: "12px", border: "none", background: C.accent, color: "#000", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontSize: ".9rem" }}
                  >
                    {loading ? "Generating..." : "🎯 Generate Closing Playbook"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {loading && !content && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 20, color: C.muted }}>
            <div style={{ width: 20, height: 20, border: "2px solid " + C.border, borderTopColor: C.accent, borderRadius: "50%", animation: "spin .8s linear infinite" }} />
            <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
            Building your playbook...
          </div>
        )}

        {(loading || content) && (
          <div style={{ background: C.card, border: "1px solid " + C.border, borderRadius: 12, padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: ".7rem", color: C.accent, fontFamily: "monospace", fontWeight: 700 }}>✨ YOUR CLOSING PLAYBOOK</div>
              {content && (
                <button onClick={() => { navigator.clipboard.writeText(content); setCopied(true); setTimeout(() => setCopied(false), 2000); }} style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid " + C.border, background: "transparent", color: copied ? C.green : C.muted, cursor: "pointer", fontSize: ".75rem" }}>
                  {copied ? "Copied ✓" : "📋 Copy"}
                </button>
              )}
            </div>
            <div ref={contentRef} style={{ fontSize: ".88rem", color: C.text, lineHeight: 1.8, whiteSpace: "pre-wrap" as const }}>{content}</div>
          </div>
        )}

      </div>
    </NavLayout>
  );
}
