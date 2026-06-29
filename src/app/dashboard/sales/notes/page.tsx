"use client";
import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import NavLayout from "@/components/NavLayout";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const C = {
  bg:"#0A0A0A", card:"#111111", border:"#222222", text:"#F5F4F0",
  muted:"#666660", accent:"#D97B4F", surface:"#1a1a1a", green:"#22c55e", red:"#ef4444",
};

export default function NotesPage() {
  const [operator, setOperator] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [copied, setCopied] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: op } = await supabase.from("operators").select("*").eq("id", user.id).single();
      if (op) {
        setOperator(op);
        const { data: n } = await supabase.from("sales_notes").select("*").eq("operator_id", op.id).order("created_at", { ascending: false });
        if (n) setNotes(n);
      }
    };
    load();
  }, []);

  const saveNote = async () => {
    if (!newNote.trim() || !operator) return;
    setSaving(true);
    const { data } = await supabase.from("sales_notes").insert({ operator_id: operator.id, content: newNote }).select().single();
    if (data) setNotes(prev => [data, ...prev]);
    setNewNote("");
    setSaving(false);
  };

  const updateNote = async (id: string) => {
    await supabase.from("sales_notes").update({ content: editText }).eq("id", id);
    setNotes(prev => prev.map(n => n.id === id ? { ...n, content: editText } : n));
    setEditingId(null);
  };

  const deleteNote = async (id: string) => {
    await supabase.from("sales_notes").delete().eq("id", id);
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  return (
    <NavLayout active="sales" title="📝 Notes" backHref="/dashboard/sales">
      <div style={{ padding: 24 }}>

        {/* Add note */}
        <div style={{ background: C.card, border: "1px solid " + C.border, borderRadius: 12, padding: 20, marginBottom: 16 }}>
          <div style={{ fontWeight: 700, color: C.text, marginBottom: 12 }}>📝 Save a Note</div>
          <textarea
            value={newNote}
            onChange={e => setNewNote(e.target.value)}
            placeholder="Save a great line, script, closing technique..."
            rows={3}
            style={{ width: "100%", padding: "12px", borderRadius: 8, border: "1px solid " + C.border, background: C.surface, color: C.text, fontSize: ".9rem", fontFamily: "inherit", resize: "vertical" as const, boxSizing: "border-box" as const, outline: "none", marginBottom: 12 }}
          />
          <button
            onClick={saveNote}
            disabled={saving || !newNote.trim()}
            style={{ padding: "11px 24px", borderRadius: 8, border: "none", background: newNote.trim() ? C.accent : "rgba(217,123,79,0.3)", color: newNote.trim() ? "#000" : "rgba(255,255,255,0.3)", fontWeight: 700, cursor: newNote.trim() ? "pointer" : "not-allowed", fontSize: ".9rem" }}
          >
            {saving ? "Saving..." : "Save Note"}
          </button>
        </div>

        {/* Notes list */}
        {notes.length === 0 && (
          <div style={{ textAlign: "center" as const, color: C.muted, padding: 40, fontSize: ".88rem" }}>
            No notes yet. Save your best lines here.
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column" as const, gap: 12 }}>
          {notes.map(note => (
            <div key={note.id} style={{ background: C.card, border: "1px solid " + C.border, borderRadius: 12, padding: 16 }}>
              {editingId === note.id ? (
                <div>
                  <textarea
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    rows={3}
                    style={{ width: "100%", padding: "10px", borderRadius: 8, border: "1px solid " + C.border, background: C.surface, color: C.text, fontSize: ".88rem", fontFamily: "inherit", resize: "vertical" as const, boxSizing: "border-box" as const, outline: "none", marginBottom: 10 }}
                  />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => updateNote(note.id)} style={{ padding: "8px 16px", borderRadius: 6, border: "none", background: C.accent, color: "#000", fontWeight: 700, cursor: "pointer", fontSize: ".84rem" }}>Save</button>
                    <button onClick={() => setEditingId(null)} style={{ padding: "8px 16px", borderRadius: 6, border: "1px solid " + C.border, background: "transparent", color: C.muted, cursor: "pointer", fontSize: ".84rem" }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: ".88rem", color: C.text, lineHeight: 1.7, marginBottom: 12 }}>{note.content}</div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <div style={{ fontSize: ".7rem", color: C.muted, flex: 1 }}>{new Date(note.created_at).toLocaleDateString()}</div>
                    <button
                      onClick={() => { navigator.clipboard.writeText(note.content); setCopied(note.id); setTimeout(() => setCopied(""), 2000); }}
                      style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid " + C.border, background: "transparent", color: copied === note.id ? C.green : C.muted, cursor: "pointer", fontSize: ".75rem" }}
                    >
                      {copied === note.id ? "Copied ✓" : "📋 Copy"}
                    </button>
                    <button
                      onClick={() => { setEditingId(note.id); setEditText(note.content); }}
                      style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid " + C.border, background: "transparent", color: C.muted, cursor: "pointer", fontSize: ".75rem" }}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => deleteNote(note.id)}
                      style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid rgba(239,68,68,0.3)", background: "transparent", color: C.red, cursor: "pointer", fontSize: ".75rem" }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

      </div>
    </NavLayout>
  );
}
