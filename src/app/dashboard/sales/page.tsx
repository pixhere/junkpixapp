"use client";
import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const C = {
  bg:"#0A0A0A", card:"#111111", border:"#222222", text:"#F5F4F0",
  muted:"#666660", accent:"#D97B4F", accentDim:"rgba(217,123,79,0.15)",
  green:"#22c55e", red:"#ef4444", surface:"#1a1a1a",
};

const TABS = [
  { id: "close",   label: "🎯 Close a Job" },
  { id: "daily",   label: "⚡ Daily Intel" },
  { id: "academy", label: "📚 Sales Academy" },
  { id: "ask",     label: "💬 Ask the Coach" },
  { id: "notes",   label: "📝 Notes" },
];

export default function SalesPage() {
  const router = useRouter();
  const [operator, setOperator] = useState<any>(null);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("close");
  const [loading, setLoading] = useState(false);
  const [contents, setContents] = useState<Record<string, string>>({});
  const [question, setQuestion] = useState("");
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [notesLoaded, setNotesLoaded] = useState(false);
  const [copied, setCopied] = useState("");
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

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

  useEffect(() => {
    if (activeTab === "notes" && !notesLoaded && operator) {
      const loadNotes = async () => {
        const { data } = await supabase.from("sales_notes").select("*").eq("operator_id", operator.id).order("created_at", { ascending: false });
        if (data) setNotes(data);
        setNotesLoaded(true);
      };
      loadNotes();
    }
    // Load daily cache only for daily tab
    if (activeTab === "daily") {
      const today = new Date().toDateString();
      const cachedDate = localStorage.getItem("sales_daily_intel_date");
      const cached = localStorage.getItem("sales_daily_intel");
      if (cachedDate === today && cached) {
        setContents(prev => ({ ...prev, daily: cached }));
      }
    }
  }, [activeTab, operator, notesLoaded]);

  const generate = async (type: string, apiType: string) => {
    if (!operator) return;
    setLoading(true);
    setContents(prev => ({ ...prev, [type]: "" }));
    try {
      const res = await fetch("/api/sales-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: apiType, quote: selectedQuote, operator, question, dateSeed: new Date().toDateString() }),
      });
      if (!res.ok) { setContents(prev => ({ ...prev, [type]: "Something went wrong. Try again." })); setLoading(false); return; }
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let full = "";
      setLoading(false);
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        full += chunk;
        setContents(prev => ({ ...prev, [type]: full }));
      }
      if (type === "daily") {
        localStorage.setItem("sales_daily_intel", full);
        localStorage.setItem("sales_daily_intel_date", new Date().toDateString());
      }
    } catch {
      setContents(prev => ({ ...prev, [type]: "Something went wrong. Try again." }));
    }
    setLoading(false);
  };

  const completedQuotes = quotes.filter(q => q.status === "completed" || q.status === "booked");
  const currentContent = contents[activeTab] || "";

  const ContentDisplay = ({ tabKey }: { tabKey: string }) => {
    const c = contents[tabKey] || "";
    if (!c && !loading) return null;
    return (
      <div style={{ marginTop:16, background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:24 }}>
        {loading && !c && (
          <div style={{ display:"flex", alignItems:"center", gap:10, color:C.muted }}>
            <div style={{ width:20, height:20, border:`2px solid ${C.border}`, borderTopColor:C.accent, borderRadius:"50%", animation:"spin .8s linear infinite" }} />
            <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
            Thinking...
          </div>
        )}
        {c && (
          <>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <div style={{ fontSize:".7rem", color:C.accent, fontFamily:"monospace", fontWeight:700 }}>✨ FROM THE MASTERS</div>
              <button onClick={() => { navigator.clipboard.writeText(c); setCopied(tabKey); setTimeout(() => setCopied(""), 2000); }} style={{ padding:"6px 12px", borderRadius:6, border:`1px solid ${C.border}`, background:"transparent", color:copied === tabKey ? C.green : C.muted, cursor:"pointer", fontSize:".75rem" }}>
                {copied === tabKey ? "Copied ✓" : "📋 Copy"}
              </button>
            </div>
            <div style={{ fontSize:".88rem", color:C.text, lineHeight:1.8, whiteSpace:"pre-wrap" as const }}>
              {c}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div style={{ background:C.bg, minHeight:"100vh", fontFamily:"system-ui,sans-serif", color:C.text }}>
      <div style={{ borderBottom:`1px solid ${C.border}`, padding:"16px 24px", display:"flex", alignItems:"center", gap:16 }}>
        <button onClick={() => router.push("/dashboard")} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:8, color:C.muted, cursor:"pointer", padding:"8px 14px", fontSize:".84rem" }}>
          ← Dashboard
        </button>
        <div style={{ fontWeight:800, color:C.text, fontSize:"1.1rem" }}>🎯 Sales Academy</div>
      </div>

      <div style={{ maxWidth:800, margin:"0 auto", padding:24 }}>
        <div style={{ display:"flex", gap:8, marginBottom:24, flexWrap:"wrap" as const }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id); setLoading(false); }} style={{ padding:"10px 16px", borderRadius:8, border:`1px solid ${activeTab === tab.id ? C.accent : C.border}`, background:activeTab === tab.id ? C.accentDim : "transparent", color:activeTab === tab.id ? C.accent : C.muted, cursor:"pointer", fontWeight:activeTab === tab.id ? 700 : 400, fontSize:".84rem" }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Close a Job */}
        {activeTab === "close" && (
          <div style={{ display:"flex", flexDirection:"column" as const, gap:16 }}>
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20 }}>
              <div style={{ fontSize:".65rem", color:C.muted, fontFamily:"monospace", letterSpacing:".1em", marginBottom:12 }}>SELECT A LEAD</div>
              {completedQuotes.length === 0 ? (
                <div style={{ color:C.muted, fontSize:".84rem" }}>No booked or completed jobs yet.</div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column" as const, gap:8 }}>
                  {completedQuotes.slice(0,5).map(q => (
                    <button key={q.id} onClick={() => setSelectedQuote(q)} style={{ padding:"12px 14px", borderRadius:8, border:`1px solid ${selectedQuote?.id === q.id ? C.accent : C.border}`, background:selectedQuote?.id === q.id ? C.accentDim : C.surface, color:C.text, cursor:"pointer", textAlign:"left" as const, width:"100%" }}>
                      <div style={{ fontWeight:600, fontSize:".88rem" }}>{q.customer_name}</div>
                      <div style={{ fontSize:".75rem", color:C.muted }}>${q.final_price || q.estimated_min} · {q.customer_address}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedQuote && (
              <button onClick={() => generate("close", "close_job")} disabled={loading} style={{ padding:"14px", borderRadius:8, border:"none", background:C.accent, color:"#000", fontWeight:700, cursor:loading ? "not-allowed" : "pointer", fontSize:".9rem" }}>
                {loading ? "Generating..." : "🎯 Generate Closing Playbook"}
              </button>
            )}
            <ContentDisplay tabKey="close" />
          </div>
        )}

        {/* Daily Intel */}
        {activeTab === "daily" && (
          <div style={{ display:"flex", flexDirection:"column" as const, gap:16 }}>
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20 }}>
              <div style={{ fontWeight:700, color:C.text, marginBottom:4 }}>⚡ Daily Sales Intel</div>
              <div style={{ fontSize:".84rem", color:C.muted, marginBottom:16 }}>Fresh lesson from the masters. Changes every day.</div>
              <button onClick={() => generate("daily", "daily_intel")} disabled={loading} style={{ padding:"12px 20px", borderRadius:8, border:"none", background:C.accent, color:"#000", fontWeight:700, cursor:loading ? "not-allowed" : "pointer", fontSize:".88rem" }}>
                {loading ? "Loading..." : contents["daily"] ? "🔄 Refresh" : "⚡ Get Today's Intel"}
              </button>
            </div>
            <ContentDisplay tabKey="daily" />
          </div>
        )}

        {/* Sales Academy */}
        {activeTab === "academy" && (
          <div style={{ display:"flex", flexDirection:"column" as const, gap:16 }}>
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20 }}>
              <div style={{ fontWeight:700, color:C.text, marginBottom:4 }}>📚 Sales Academy</div>
              <div style={{ fontSize:".84rem", color:C.muted, marginBottom:16 }}>Books, curriculum, and daily habits from the masters.</div>
              <button onClick={() => generate("academy", "academy")} disabled={loading} style={{ padding:"12px 20px", borderRadius:8, border:"none", background:C.accent, color:"#000", fontWeight:700, cursor:loading ? "not-allowed" : "pointer", fontSize:".88rem" }}>
                {loading ? "Loading..." : "📚 Generate Curriculum"}
              </button>
            </div>
            <ContentDisplay tabKey="academy" />
          </div>
        )}

        {/* Ask the Coach */}
        {activeTab === "ask" && (
          <div style={{ display:"flex", flexDirection:"column" as const, gap:16 }}>
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20 }}>
              <div style={{ fontWeight:700, color:C.text, marginBottom:12 }}>💬 Ask the Coach</div>
              <textarea value={question} onChange={e => setQuestion(e.target.value)} placeholder="Ask anything about sales, pricing, handling objections..." rows={3} style={{ width:"100%", padding:"12px", borderRadius:8, border:`1px solid ${C.border}`, background:C.surface, color:C.text, fontSize:".84rem", fontFamily:"inherit", resize:"vertical" as const, boxSizing:"border-box" as const, outline:"none", marginBottom:12 }} />
              <button onClick={() => generate("ask", "ask")} disabled={loading || !question.trim()} style={{ padding:"12px 20px", borderRadius:8, border:"none", background:question.trim() ? C.accent : "rgba(217,123,79,0.3)", color:question.trim() ? "#000" : "rgba(255,255,255,0.3)", fontWeight:700, cursor:question.trim() ? "pointer" : "not-allowed", fontSize:".88rem" }}>
                {loading ? "Thinking..." : "💬 Ask"}
              </button>
            </div>
            <ContentDisplay tabKey="ask" />
          </div>
        )}

        {/* Notes */}
        {activeTab === "notes" && (
          <div style={{ display:"flex", flexDirection:"column" as const, gap:12 }}>
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20 }}>
              <textarea value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Save a line, script, or idea..." rows={3} style={{ width:"100%", padding:"12px", borderRadius:8, border:`1px solid ${C.border}`, background:C.surface, color:C.text, fontSize:".84rem", fontFamily:"inherit", resize:"vertical" as const, boxSizing:"border-box" as const, outline:"none", marginBottom:12 }} />
              <button onClick={async () => {
                if (!newNote.trim() || !operator) return;
                setSavingNote(true);
                const { data } = await supabase.from("sales_notes").insert({ operator_id: operator.id, content: newNote }).select().single();
                if (data) setNotes(prev => [data, ...prev]);
                setNewNote("");
                setSavingNote(false);
              }} disabled={savingNote || !newNote.trim()} style={{ padding:"10px 20px", borderRadius:8, border:"none", background:newNote.trim() ? C.accent : "rgba(217,123,79,0.3)", color:newNote.trim() ? "#000" : "rgba(255,255,255,0.3)", fontWeight:700, cursor:"pointer", fontSize:".84rem" }}>
                {savingNote ? "Saving..." : "Save Note"}
              </button>
            </div>
            {notes.map(note => (
              <div key={note.id} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:8, padding:16 }}>
                {editingNote === note.id ? (
                  <div>
                    <textarea value={editText} onChange={e => setEditText(e.target.value)} rows={3} style={{ width:"100%", padding:"10px", borderRadius:6, border:`1px solid ${C.border}`, background:C.surface, color:C.text, fontSize:".84rem", fontFamily:"inherit", resize:"vertical" as const, boxSizing:"border-box" as const, outline:"none", marginBottom:8 }} />
                    <div style={{ display:"flex", gap:8 }}>
                      <button onClick={async () => {
                        await supabase.from("sales_notes").update({ content: editText }).eq("id", note.id);
                        setNotes(prev => prev.map(n => n.id === note.id ? { ...n, content: editText } : n));
                        setEditingNote(null);
                      }} style={{ padding:"6px 14px", borderRadius:6, border:"none", background:C.accent, color:"#000", fontWeight:700, cursor:"pointer", fontSize:".78rem" }}>Save</button>
                      <button onClick={() => setEditingNote(null)} style={{ padding:"6px 14px", borderRadius:6, border:`1px solid ${C.border}`, background:"transparent", color:C.muted, cursor:"pointer", fontSize:".78rem" }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize:".84rem", color:C.text, lineHeight:1.6, marginBottom:10 }}>{note.content}</div>
                    <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                      <div style={{ fontSize:".7rem", color:C.muted, flex:1 }}>{new Date(note.created_at).toLocaleDateString()}</div>
                      <button onClick={() => { navigator.clipboard.writeText(note.content); setCopied(note.id); setTimeout(() => setCopied(""), 2000); }} style={{ padding:"4px 10px", borderRadius:6, border:`1px solid ${C.border}`, background:"transparent", color:copied === note.id ? C.green : C.muted, cursor:"pointer", fontSize:".72rem" }}>
                        {copied === note.id ? "Copied ✓" : "📋 Copy"}
                      </button>
                      <button onClick={() => { setEditingNote(note.id); setEditText(note.content); }} style={{ padding:"4px 10px", borderRadius:6, border:`1px solid ${C.border}`, background:"transparent", color:C.muted, cursor:"pointer", fontSize:".72rem" }}>✏️ Edit</button>
                      <button onClick={async () => {
                        await supabase.from("sales_notes").delete().eq("id", note.id);
                        setNotes(prev => prev.filter(n => n.id !== note.id));
                      }} style={{ padding:"4px 10px", borderRadius:6, border:"1px solid rgba(239,68,68,0.3)", background:"transparent", color:C.red, cursor:"pointer", fontSize:".72rem" }}>🗑️</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
