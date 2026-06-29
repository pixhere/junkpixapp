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
  bg:"#0A0A0A", surface:"#111111", card:"#161616", border:"#222222",
  accent:"#D97B4F", accentDim:"rgba(217,123,79,0.1)", text:"#F0F0F0",
  muted:"#666666", green:"#22c55e", red:"#ef4444",
};

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
      const { data: qs } = await supabase.from("quote_requests").select("*").eq("operator_id", user.id).order("created_at", { ascending: false });
      if (qs) setQuotes(qs);
    };
    load();
  }, []);

  const completedQuotes = quotes.filter(q => q.status === "completed" || q.status === "booked");

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
      setPosts(data.posts);
    } catch {
      setPosts(null);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <NavLayout active="social" title="Social Media">
      <div style={{ display:"flex", flexDirection:"column" as const, gap:24, padding:24, maxWidth:800, margin:"0 auto" }}>

        <div>
          <div style={{ fontSize:"1.4rem", fontWeight:800, color:C.text }}>Social Media</div>
          <div style={{ fontSize:".84rem", color:C.muted, marginTop:4 }}>Turn completed jobs into content. AI writes the post — you copy and paste.</div>
        </div>

        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20 }}>
          <div style={{ fontSize:".7rem", color:C.muted, fontFamily:"monospace", letterSpacing:".1em", marginBottom:14 }}>SELECT A COMPLETED JOB</div>
          {completedQuotes.length === 0 ? (
            <div style={{ color:C.muted, fontSize:".88rem", textAlign:"center" as const, padding:"20px 0" }}>
              No completed or booked jobs yet. Mark a job as Booked or Completed to generate posts.
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column" as const, gap:8 }}>
              {completedQuotes.map(q => (
                <div key={q.id}>
                  <button
                    onClick={() => generate(q)}
                    disabled={generating}
                    style={{ width:"100%", padding:"14px 16px", borderRadius:8, border:`1px solid ${selectedQuote?.id === q.id ? C.accent : C.border}`, background:selectedQuote?.id === q.id ? C.accentDim : C.surface, color:C.text, cursor:"pointer", textAlign:"left" as const, display:"flex", justifyContent:"space-between", alignItems:"center" }}
                  >
                    <div>
                      <div style={{ fontWeight:600, fontSize:".9rem" }}>{q.customer_name}</div>
                      <div style={{ fontSize:".75rem", color:C.muted, marginTop:2 }}>{q.ai_description?.slice(0,60)}...</div>
                    </div>
                    <div style={{ fontSize:".78rem", color:C.accent, fontWeight:700, flexShrink:0, marginLeft:12 }}>
                      ${q.final_price || q.estimated_min}
                    </div>
                  </button>
                  {selectedQuote?.id === q.id && generating && (
                    <div style={{ padding:"16px", background:C.card, border:`1px solid ${C.border}`, borderTop:"none", borderRadius:"0 0 8px 8px", display:"flex", alignItems:"center", gap:10 }}>
                      <div style={{ width:18, height:18, border:`2px solid ${C.border}`, borderTopColor:C.accent, borderRadius:"50%", animation:"spin .8s linear infinite", flexShrink:0 }} />
                      <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
                      <span style={{ color:C.muted, fontSize:".84rem" }}>✨ Generating posts...</span>
                    </div>
                  )}
                  {selectedQuote?.id === q.id && posts && (
                    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderTop:"none", borderRadius:"0 0 8px 8px", padding:16 }}>
                      {Object.entries(posts).map(([platform, post]: any) => (
                        <div key={platform} style={{ marginBottom:16, paddingBottom:16, borderBottom:`1px solid ${C.border}` }}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                            <div style={{ fontSize:".7rem", color:C.accent, fontFamily:"monospace", fontWeight:700 }}>{platform.toUpperCase()}</div>
                            <button onClick={() => { navigator.clipboard.writeText(post); setCopied(platform); setTimeout(() => setCopied(""), 2000); }} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:6, color:C.muted, cursor:"pointer", fontSize:".72rem", padding:"4px 10px" }}>
                              {copied === platform ? "Copied ✓" : "📋 Copy"}
                            </button>
                          </div>
                          <div style={{ fontSize:".82rem", color:C.text, lineHeight:1.6, whiteSpace:"pre-wrap" as const }}>{post}</div>
                        </div>
                      ))}
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
