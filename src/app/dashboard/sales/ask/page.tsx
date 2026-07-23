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

export default function AskCoachPage() {
  const [operator, setOperator] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState("");
  const [question, setQuestion] = useState("");
  const [copied, setCopied] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: op } = await supabase.from("operators").select("*").eq("id", user.id).single();
      if (op) setOperator(op);
    };
    load();
  }, []);

  const ask = async () => {
    if (!question.trim() || !operator) return;
    setLoading(true);
    setContent("");
    if (contentRef.current) contentRef.current.innerText = "";

    try {
      const res = await fetch("/api/sales-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "ask", operator, question }),
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
    }
    setLoading(false);
  };

  return (
    <NavLayout active="sales" title="💬 Ask the Coach" backHref="/dashboard/sales">
      <div style={{ padding: 24 }}>

        <div style={{ background: C.card, border: "1px solid " + C.border, borderRadius: 12, padding: 20, marginBottom: 16 }}>
          <div style={{ fontWeight: 700, color: C.text, marginBottom: 12 }}>💬 Ask Anything</div>
          <textarea
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder="Ask about pricing, objections, follow-ups, closing techniques..."
            rows={4}
            style={{ width: "100%", padding: "12px", borderRadius: 8, border: "1px solid " + C.border, background: C.surface, color: C.text, fontSize: ".9rem", fontFamily: "inherit", resize: "vertical" as const, boxSizing: "border-box" as const, outline: "none", marginBottom: 12 }}
          />
          <button
            onClick={ask}
            disabled={loading || !question.trim()}
            style={{ padding: "12px 24px", borderRadius: 8, border: "none", background: question.trim() ? C.accent : "rgba(217,123,79,0.3)", color: question.trim() ? "#000" : "rgba(255,255,255,0.3)", fontWeight: 700, cursor: question.trim() ? "pointer" : "not-allowed", fontSize: ".9rem" }}
          >
            {loading ? "Thinking..." : "💬 Ask the Coach"}
          </button>
        </div>

        {loading && !content && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 20, color: C.muted }}>
            <div style={{ width: 20, height: 20, border: "2px solid " + C.border, borderTopColor: C.accent, borderRadius: "50%", animation: "spin .8s linear infinite" }} />
            <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
            The masters are thinking...
          </div>
        )}

        {(loading || content) && (
          <div style={{ background: C.card, border: "1px solid " + C.border, borderRadius: 12, padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: ".7rem", color: C.accent, fontFamily: "monospace", fontWeight: 700 }}>✨ FROM THE MASTERS</div>
              {content && (
                <button onClick={() => { navigator.clipboard.writeText(content); setCopied(true); setTimeout(() => setCopied(false), 2000); }} style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid " + C.border, background: "transparent", color: copied ? C.green : C.muted, cursor: "pointer", fontSize: ".75rem" }}>
                  {copied ? "Copied ✓" : "📋 Copy"}
                </button>
              )}
            </div>
            <div ref={contentRef} style={{ fontSize: ".88rem", color: C.text, lineHeight: 1.8, whiteSpace: "pre-wrap" as const }}>
              {content}
            </div>
          </div>
        )}

      </div>
    </NavLayout>
  );
}
