"use client";
import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import NavLayout from "@/components/NavLayout";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const C = {
  bg:"#0A0A0A", card:"#111111", border:"#222222", text:"#F5F4F0",
  muted:"#666660", accent:"#D97B4F", surface:"#1a1a1a", green:"#22c55e",
};

const PLATFORMS = [
  { key:"facebook",  label:"Facebook",  icon:"📘", tip:"Best for local community groups" },
  { key:"instagram", label:"Instagram", icon:"📸", tip:"Use before/after photos" },
  { key:"nextdoor",  label:"Nextdoor",  icon:"🏘️", tip:"Great for neighborhood leads" },
  { key:"google",    label:"Google",    icon:"🔍", tip:"For your Google Business profile" },
];

export default function SocialPage() {
  const router = useRouter();
  const [operator, setOperator] = useState<any>(null);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  const [generating, setGenerating] = useState(false);
  const [posts, setPosts] = useState<any>(null);
  const [copied, setCopied] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data: op } = await supabase.from("operators").select("*").eq("id", user.id).single();
      if (op) setOperator(op);
      const { data: qs } = await supabase.from("quote_requests").select("*").eq("operator_id", user.id).in("status", ["completed","booked"]).order("created_at", { ascending: false });
      if (qs) setQuotes(qs);
    };
    load();
  }, []);

  const generate = async (quote: any) => {
    setSelectedQuote(quote);
    setGenerating(true);
    setPosts(null);
    setCopied("");
    try {
      const res = await fetch("/api/generate-social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quote, operator }),
      });
      const data = await res.json();
      if (data.posts) setPosts(data.posts);
    } catch { }
    setGenerating(false);
  };

  return (
    <NavLayout active="social" title="📱 Social Media">
      <div style={{ maxWidth: 700, margin: "0 auto", padding: 16 }}>

        {/* Quote selector */}
        <div style={{ background: C.card, border: "1px solid " + C.border, borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: ".65rem", color: C.muted, fontFamily: "monospace", marginBottom: 12 }}>SELECT A COMPLETED JOB</div>
          {quotes.length === 0 ? (
            <div style={{ color: C.muted, fontSize: ".84rem" }}>No completed jobs yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
              {quotes.map(q => (
                <div key={q.id}>
                  <button
                    onClick={() => generate(q)}
                    disabled={generating}
                    style={{ width: "100%", padding: "14px 16px", borderRadius: 8, border: "1px solid " + (selectedQuote?.id === q.id ? C.accent : C.border), background: selectedQuote?.id === q.id ? "rgba(217,123,79,0.15)" : C.surface, color: C.text, cursor: "pointer", textAlign: "left" as const, display: "flex", justifyContent: "space-between", alignItems: "center" }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: ".9rem" }}>{q.customer_name}</div>
                      <div style={{ fontSize: ".72rem", color: C.muted, marginTop: 2 }}>{q.ai_description?.slice(0,50)}...</div>
                    </div>
                    <div style={{ color: C.accent, fontWeight: 700, flexShrink: 0, marginLeft: 12 }}>${q.final_price || q.estimated_min}</div>
                  </button>

                  {selectedQuote?.id === q.id && generating && (
                    <div style={{ padding: "12px 16px", background: C.card, border: "1px solid " + C.border, borderTop: "none", borderRadius: "0 0 8px 8px", display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 16, height: 16, border: "2px solid " + C.border, borderTopColor: C.accent, borderRadius: "50%", animation: "spin .8s linear infinite", flexShrink: 0 }} />
                      <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
                      <span style={{ color: C.muted, fontSize: ".84rem" }}>Generating posts...</span>
                    </div>
                  )}

                  {selectedQuote?.id === q.id && posts && (
                    <div style={{ background: C.card, border: "1px solid " + C.border, borderTop: "none", borderRadius: "0 0 8px 8px", padding: 16 }}>
                      {PLATFORMS.map(p => (
                        <div key={p.key} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid " + C.border }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span>{p.icon}</span>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: ".88rem", color: C.text }}>{p.label}</div>
                                <div style={{ fontSize: ".68rem", color: C.muted }}>{p.tip}</div>
                              </div>
                            </div>
                            <button onClick={() => { navigator.clipboard.writeText(posts[p.key]); setCopied(p.key); setTimeout(() => setCopied(""), 2000); }} style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid " + C.border, background: "transparent", color: copied === p.key ? C.green : C.muted, cursor: "pointer", fontSize: ".75rem" }}>
                              {copied === p.key ? "Copied ✓" : "📋 Copy"}
                            </button>
                          </div>
                          <div style={{ fontSize: ".84rem", color: C.text, lineHeight: 1.6, background: C.surface, borderRadius: 8, padding: "12px 14px", whiteSpace: "pre-wrap" as const }}>{posts[p.key]}</div>
                        </div>
                      ))}
                      <button onClick={() => generate(selectedQuote)} style={{ padding: "10px 0", width: "100%", borderRadius: 8, border: "1px solid " + C.border, background: "transparent", color: C.muted, cursor: "pointer", fontSize: ".84rem" }}>↺ Regenerate</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </NavLayout>
  );
}
