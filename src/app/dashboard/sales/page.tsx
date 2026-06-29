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

export default function SalesPage() {
  const router = useRouter();
  const [operator, setOperator] = useState<any>(null);
  const [quotes, setQuotes] = useState<any[]>([]);

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

    const [selectedQuote, setSelectedQuote] = useState<any>(null);
    const [activeTab, setActiveTab] = useState("close");
    const [loading, setLoading] = useState(false);
    const [content, setContent] = useState("");
    const [question, setQuestion] = useState("");
    const [notes, setNotes] = useState<any[]>([]);
    const [newNote, setNewNote] = useState("");
    const [savingNote, setSavingNote] = useState(false);
    const [notesLoaded, setNotesLoaded] = useState(false);
    useEffect(() => {
      if (activeTab === "notes" && !notesLoaded && operator) {
        const loadNotes = async () => {
          const { data } = await supabase
            .from("sales_notes")
            .select("*")
            .eq("operator_id", operator.id)
            .order("created_at", { ascending: false });
          if (data) setNotes(data);
          setNotesLoaded(true);
        };
        loadNotes();
      }
    }, [activeTab, operator, notesLoaded]);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [editingNote, setEditingNote] = useState<any>(null);
    const [editContent, setEditContent] = useState("");

    const NoteCard = ({ note }: { note: any }) => {
      const isCopied = copiedId === note.id;
      const isEditing = editingNote?.id === note.id;

      return (
        <div style={{ background:C.card, border:`1px solid ${isEditing ? C.accent : C.border}`, borderRadius:10, padding:16 }}>
          {isEditing ? (
            <div style={{ display:"flex", flexDirection:"column" as const, gap:10 }}>
              <textarea
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                rows={4}
                style={{ width:"100%", padding:"12px", borderRadius:8, border:`1px solid ${C.border}`, background:C.surface, color:C.text, fontSize:".84rem", fontFamily:"inherit", resize:"vertical" as const, boxSizing:"border-box" as const, outline:"none" }}
              />
              <div style={{ display:"flex", gap:8 }}>
                <button
                  onClick={async () => {
                    await supabase.from("sales_notes").update({ content: editContent }).eq("id", note.id);
                    setNotes(prev => prev.map(n => n.id === note.id ? { ...n, content: editContent } : n));
                    setEditingNote(null);
                  }}
                  style={{ flex:1, padding:"9px 0", borderRadius:8, border:"none", background:C.accent, color:"#000", fontWeight:700, cursor:"pointer", fontSize:".84rem" }}
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingNote(null)}
                  style={{ padding:"9px 16px", borderRadius:8, border:`1px solid ${C.border}`, background:"transparent", color:C.muted, cursor:"pointer", fontSize:".84rem" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12 }}>
              <div style={{ fontSize:".86rem", color:C.text, lineHeight:1.6, flex:1 }}>{note.content}</div>
              <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(note.content);
                    setCopiedId(note.id);
                    setTimeout(() => setCopiedId(null), 2000);
                  }}
                  style={{ padding:"5px 10px", borderRadius:6, border:`1px solid ${isCopied ? "rgba(34,197,94,0.4)" : C.border}`, background: isCopied ? "rgba(34,197,94,0.1)" : "transparent", color: isCopied ? C.green : C.muted, cursor:"pointer", fontSize:".72rem", transition:"all .2s" }}
                >
                  {isCopied ? "✓ Copied" : "📋"}
                </button>
                <button
                  onClick={() => { setEditingNote(note); setEditContent(note.content); }}
                  style={{ padding:"5px 10px", borderRadius:6, border:`1px solid ${C.border}`, background:"transparent", color:C.muted, cursor:"pointer", fontSize:".72rem" }}
                >
                  ✏️
                </button>
                <button
                  onClick={async () => {
                    await supabase.from("sales_notes").delete().eq("id", note.id);
                    setNotes(prev => prev.filter(n => n.id !== note.id));
                  }}
                  style={{ padding:"5px 10px", borderRadius:6, border:`1px solid rgba(239,68,68,0.3)`, background:"transparent", color:C.red, cursor:"pointer", fontSize:".72rem" }}
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>
      );
    };

    const generate = async (type: string, quote?: any) => {
      setLoading(true);
      setContent("");
      localStorage.removeItem(`sales_${type}`);
      try {
        const res = await fetch("/api/sales-coach", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, quote: quote || selectedQuote, operator, question }),
        });

        if (!res.ok) {
          setContent("Something went wrong. Try again.");
          return;
        }

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let full = "";
        setLoading(false);

       while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          full += chunk;
          setContent(full);
        }
        localStorage.setItem(`sales_${activeTab}`, full);
        localStorage.setItem(`sales_${activeTab}_date`, new Date().toDateString());
      } catch {
        setContent("Something went wrong. Try again.");
      } finally {
        setLoading(false);
      }
    };
useEffect(() => {
      const lastTab = localStorage.getItem("sales_last_tab");
      if (lastTab) setActiveTab(lastTab);
    }, []);

   useEffect(() => {
      localStorage.setItem("sales_last_tab", activeTab);
      const today = new Date().toDateString();
      const cachedDate = localStorage.getItem(`sales_${activeTab}_date`);
      const cached = localStorage.getItem(`sales_${activeTab}`);
      
      // For daily tab - expire cache every day
      if (activeTab === "daily" && cachedDate !== today) {
        localStorage.removeItem(`sales_daily`);
        localStorage.removeItem(`sales_daily_date`);
        setContent("");
      } else if (cached) {
        setContent(cached);
      } else {
        setContent("");
      }
    }, [activeTab]);
   const tabs = [
      { id: "close", label: "🎯 Close a Job", desc: "Full closing playbook for a specific lead" },
      { id: "daily", label: "⚡ Daily Intel", desc: "Today's sales lesson from the masters" },
      { id: "academy", label: "📚 Sales Academy", desc: "Books, curriculum, daily habits" },
      { id: "ask", label: "💬 Ask the Coach", desc: "Ask anything about sales or business" },
      { id: "notes", label: "📝 Notes", desc: "Save your favorite lines and scripts" },
    ];

    const activeQuotes = quotes.filter(q => q.status === "new" || q.status === "reviewed" || q.status === "quoted");

    return (
      <div style={{ display:"flex", flexDirection:"column" as const, gap:24 }}>
        <div>
          <div style={{ fontSize:"1.4rem", fontWeight:800, color:C.text }}>Sales Academy</div>
          <div style={{ fontSize:".84rem", color:C.muted, marginTop:4 }}>
            Powered by 15 of the greatest sales minds across 100 years. Grant Cardone · Alex Hormozi · Chris Voss · Mary Kay Ash · Estée Lauder · Napoleon Hill · and more.
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" as const }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); if (tab.id === "notes") setNotesLoaded(false); }}
              style={{
                padding:"10px 16px",
                borderRadius:10,
                border:`1px solid ${activeTab === tab.id ? C.accent : C.border}`,
                background: activeTab === tab.id ? C.accentDim : "transparent",
                color: activeTab === tab.id ? C.accent : C.muted,
                fontWeight: activeTab === tab.id ? 700 : 400,
                cursor:"pointer",
                fontSize:".84rem",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Close a Job */}
        {activeTab === "close" && (
          <div style={{ display:"flex", flexDirection:"column" as const, gap:16 }}>
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20 }}>
              <div style={{ fontSize:".7rem", color:C.muted, fontFamily:"monospace", letterSpacing:".1em", marginBottom:14 }}>SELECT A LEAD TO CLOSE</div>
              {activeQuotes.length === 0 ? (
                <div style={{ color:C.muted, fontSize:".84rem" }}>No active leads. New, reviewed, or quoted jobs will appear here.</div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column" as const, gap:8 }}>
                  {activeQuotes.map(q => (
                    <button
                      key={q.id}
                      onClick={() => setSelectedQuote(q)}
                      style={{
                        padding:"14px 16px",
                        borderRadius:8,
                        border:`1px solid ${selectedQuote?.id === q.id ? C.accent : C.border}`,
                        background: selectedQuote?.id === q.id ? C.accentDim : C.surface,
                        color:C.text,
                        cursor:"pointer",
                        textAlign:"left" as const,
                        display:"flex",
                        justifyContent:"space-between",
                        alignItems:"center",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight:600, fontSize:".9rem" }}>{q.customer_name}</div>
                        <div style={{ fontSize:".75rem", color:C.muted, marginTop:2 }}>{q.ai_description?.slice(0,60)}...</div>
                      </div>
                      <div style={{ textAlign:"right" as const, flexShrink:0, marginLeft:12 }}>
                        <div style={{ color:C.accent, fontWeight:700, fontSize:".9rem" }}>${q.estimated_min}-${q.estimated_max}</div>
                        <div style={{ fontSize:".65rem", color:C.muted }}>
                          {q.booking_score ? `🎯 ${q.booking_score}/100` : ""}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedQuote && (
              <button
                onClick={() => generate("close_job")}
                disabled={loading}
                style={{ padding:"14px 0", borderRadius:10, border:"none", background: loading ? "rgba(217,123,79,0.3)" : C.accent, color: loading ? "rgba(255,255,255,0.4)" : "#000", fontWeight:800, cursor: loading ? "not-allowed" : "pointer", fontSize:"1rem" }}
              >
                {loading ? "Generating your closing playbook..." : "🎯 Generate Closing Playbook"}
              </button>
            )}
          </div>
        )}

        {/* Daily Intel */}
        {activeTab === "daily" && (
          <button
            onClick={() => generate("daily_intel")}
            disabled={loading}
            style={{ padding:"14px 0", borderRadius:10, border:"none", background: loading ? "rgba(217,123,79,0.3)" : C.accent, color: loading ? "rgba(255,255,255,0.4)" : "#000", fontWeight:800, cursor: loading ? "not-allowed" : "pointer", fontSize:"1rem" }}
          >
            {loading ? "Pulling today's intel..." : "⚡ Get Today's Sales Intel"}
          </button>
        )}

        {/* Academy */}
        {activeTab === "academy" && (
          <button
            onClick={() => generate("academy")}
            disabled={loading}
            style={{ padding:"14px 0", borderRadius:10, border:"none", background: loading ? "rgba(217,123,79,0.3)" : C.accent, color: loading ? "rgba(255,255,255,0.4)" : "#000", fontWeight:800, cursor: loading ? "not-allowed" : "pointer", fontSize:"1rem" }}
          >
            {loading ? "Building your curriculum..." : "📚 Open Sales Academy"}
          </button>
        )}

        {/* Ask */}
        {activeTab === "ask" && (
          <div style={{ display:"flex", flexDirection:"column" as const, gap:12 }}>
            <textarea
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="Ask anything... 'How do I handle a customer who says they got a cheaper quote?' or 'How do I price a hoarder job?' or 'What's the best way to follow up after no response?'"
              rows={4}
              style={{ width:"100%", padding:"14px", borderRadius:10, border:`1px solid ${C.border}`, background:C.card, color:C.text, fontSize:".88rem", fontFamily:"inherit", resize:"vertical" as const, boxSizing:"border-box" as const, outline:"none" }}
            />
            <button
              onClick={() => question.trim() && generate("ask")}
              disabled={!question.trim() || loading}
              style={{ padding:"14px 0", borderRadius:10, border:"none", background: !question.trim() || loading ? "rgba(217,123,79,0.3)" : C.accent, color: !question.trim() || loading ? "rgba(255,255,255,0.4)" : "#000", fontWeight:800, cursor: !question.trim() || loading ? "not-allowed" : "pointer", fontSize:"1rem" }}
            >
              {loading ? "Thinking..." : "💬 Ask the Coach"}
            </button>
          </div>
        )}
        {/* Notes */}
        {activeTab === "notes" && (
          <div style={{ display:"flex", flexDirection:"column" as const, gap:16 }}>
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20 }}>
              <div style={{ fontSize:".7rem", color:C.muted, fontFamily:"monospace", letterSpacing:".1em", marginBottom:12 }}>ADD A NOTE</div>
              <textarea
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                placeholder="Save a line that works, a closing script, a book lesson, anything you want to remember..."
                rows={3}
                style={{ width:"100%", padding:"12px 14px", borderRadius:8, border:`1px solid ${C.border}`, background:C.surface, color:C.text, fontSize:".84rem", fontFamily:"inherit", resize:"vertical" as const, boxSizing:"border-box" as const, marginBottom:10, outline:"none" }}
              />
              <button
                onClick={async () => {
                  if (!newNote.trim() || !operator) return;
                  setSavingNote(true);
                  const { data } = await supabase.from("sales_notes").insert({
                    operator_id: operator.id,
                    content: newNote.trim(),
                  }).select().single();
                  if (data) setNotes(prev => [data, ...prev]);
                  setNewNote("");
                  setSavingNote(false);
                }}
                disabled={!newNote.trim() || savingNote}
                style={{ width:"100%", padding:"11px 0", borderRadius:8, border:"none", background: newNote.trim() ? C.accent : "rgba(217,123,79,0.3)", color: newNote.trim() ? "#000" : "rgba(255,255,255,0.3)", fontWeight:700, cursor: newNote.trim() ? "pointer" : "not-allowed", fontSize:".88rem" }}
              >
                {savingNote ? "Saving..." : "💾 Save Note"}
              </button>
            </div>

            {notes.length === 0 && notesLoaded ? (
              <div style={{ color:C.muted, fontSize:".84rem", textAlign:"center" as const, padding:24 }}>
                No notes yet. Save your favorite lines and scripts here.
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column" as const, gap:10 }}>
                <div style={{ fontSize:".7rem", color:C.muted, fontFamily:"monospace", letterSpacing:".1em" }}>SAVED NOTES ({notes.length})</div>
                {notes.map(note => (
                <NoteCard key={note.id} note={note} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign:"center" as const, padding:"32px 0", color:C.muted }}>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <div style={{ width:36, height:36, border:`2px solid ${C.border}`, borderTopColor:C.accent, borderRadius:"50%", animation:"spin .8s linear infinite", margin:"0 auto 16px" }} />
            <div style={{ fontSize:".84rem" }}>The masters are thinking...</div>
          </div>
        )}

        {/* Content */}
        {content && !loading && (
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:24 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <div style={{ fontSize:".7rem", color:C.accent, fontFamily:"monospace", fontWeight:700, letterSpacing:".1em" }}>
                ✨ FROM THE MASTERS
              </div>
              <button
                onClick={() => { navigator.clipboard.writeText(content); }}
                style={{ padding:"6px 12px", borderRadius:6, border:`1px solid ${C.border}`, background:"transparent", color:C.muted, cursor:"pointer", fontSize:".75rem" }}
              >
                📋 Copy
              </button>
            </div>
            <div style={{ fontSize:".88rem", color:C.text, lineHeight:1.8, whiteSpace:"pre-wrap" as const, maxHeight:"60vh", overflowY:"auto" as const }}>
              {content}
            </div>
          </div>
        )}
      </div>
    );
}
