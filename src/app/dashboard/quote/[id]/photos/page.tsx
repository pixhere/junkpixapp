"use client";
import React, { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter, useParams } from "next/navigation";
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

export default function PhotosPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [quote, setQuote] = useState<any>(null);
  const [operator, setOperator] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [afterPhotos, setAfterPhotos] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [posts, setPosts] = useState<any>(null);
  const [copied, setCopied] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data: op } = await supabase.from("operators").select("*").eq("id", user.id).single();
      if (op) setOperator(op);
      const { data: q } = await supabase.from("quote_requests").select("*").eq("id", id).single();
      if (q) {
        setQuote(q);
        setAfterPhotos(q.after_photo_urls || []);
      }
    };
    load();
  }, [id]);

  const uploadAfterPhotos = async (files: FileList) => {
    setUploading(true);
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const path = `after/${id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("quote-photos").upload(path, file);
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from("quote-photos").getPublicUrl(path);
        urls.push(publicUrl);
      }
    }
    const newPhotos = [...afterPhotos, ...urls];
    await supabase.from("quote_requests").update({ after_photo_urls: newPhotos }).eq("id", id);
    setAfterPhotos(newPhotos);
    setUploading(false);
  };

  const deleteAfterPhoto = async (url: string) => {
    const newPhotos = afterPhotos.filter(p => p !== url);
    await supabase.from("quote_requests").update({ after_photo_urls: newPhotos }).eq("id", id);
    setAfterPhotos(newPhotos);
  };

  const generateSocial = async () => {
    setGenerating(true);
    setPosts(null);
    try {
      const res = await fetch("/api/generate-social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quote: { ...quote, after_photo_urls: afterPhotos }, operator, includeAfterPhotos: true }),
      });
      const data = await res.json();
      setPosts(data.posts);
    } catch { }
    setGenerating(false);
  };

  if (!quote) return <NavLayout active="quotes"><div style={{ padding:24, color:"#666666" }}>Loading...</div></NavLayout>;

  return (
    <NavLayout active="quotes" title="📸 Before & After" backHref={`/dashboard/quote/${id}`}>
      <div style={{ padding:24, display:"flex", flexDirection:"column" as const, gap:24 }}>

        <div>
          <div style={{ fontSize:"1.4rem", fontWeight:800, color:C.text }}>{quote.customer_name}</div>
          <div style={{ fontSize:".84rem", color:C.muted, marginTop:4 }}>{quote.customer_address}</div>
        </div>

        {/* Before & After grid */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>

          {/* Before photos */}
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20 }}>
            <div style={{ fontSize:".65rem", color:C.muted, fontFamily:"monospace", letterSpacing:".1em", marginBottom:12 }}>📷 BEFORE — CUSTOMER PHOTOS</div>
            {(quote.photo_urls || []).length === 0 ? (
              <div style={{ color:C.muted, fontSize:".84rem" }}>No before photos.</div>
            ) : (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(120px, 1fr))", gap:8 }}>
                {(quote.photo_urls || []).map((url: string, i: number) => (
                  <img key={i} src={url} alt="" style={{ width:"100%", aspectRatio:"1", objectFit:"cover", borderRadius:8, border:`1px solid ${C.border}` }} />
                ))}
              </div>
            )}
          </div>

          {/* After photos */}
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20 }}>
            <div style={{ fontSize:".65rem", color:C.muted, fontFamily:"monospace", letterSpacing:".1em", marginBottom:12 }}>✅ AFTER — YOUR PHOTOS</div>
            {afterPhotos.length === 0 ? (
              <div style={{ color:C.muted, fontSize:".84rem", marginBottom:12 }}>No after photos yet.</div>
            ) : (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(120px, 1fr))", gap:8, marginBottom:12 }}>
                {afterPhotos.map((url, i) => (
                  <div key={i} style={{ position:"relative" as const }}>
                    <img src={url} alt="" style={{ width:"100%", aspectRatio:"1", objectFit:"cover", borderRadius:8, border:`1px solid ${C.border}` }} />
                    <button onClick={() => deleteAfterPhoto(url)} style={{ position:"absolute" as const, top:4, right:4, background:"rgba(0,0,0,0.7)", border:"none", borderRadius:"50%", color:C.red, cursor:"pointer", width:22, height:22, fontSize:".7rem", display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
                  </div>
                ))}
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" multiple onChange={e => e.target.files && uploadAfterPhotos(e.target.files)} style={{ display:"none" }} />
            <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{ width:"100%", padding:"10px", borderRadius:8, border:`1px dashed ${C.border}`, background:"transparent", color:C.muted, cursor:"pointer", fontSize:".84rem" }}>
              {uploading ? "Uploading..." : "📷 Upload After Photos"}
            </button>
          </div>
        </div>

        {/* Generate social post */}
        {afterPhotos.length > 0 && (
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20 }}>
            <div style={{ fontWeight:700, color:C.text, marginBottom:4 }}>🚀 Generate Social Content</div>
            <div style={{ fontSize:".84rem", color:C.muted, marginBottom:16 }}>AI writes posts using the before/after context for Google, Instagram and Facebook.</div>
            <button onClick={generateSocial} disabled={generating} style={{ padding:"12px 24px", borderRadius:8, border:"none", background:C.accent, color:"#000", fontWeight:700, cursor:generating ? "not-allowed" : "pointer", fontSize:".9rem" }}>
              {generating ? "Generating..." : "✨ Generate Posts"}
            </button>
          </div>
        )}

        {/* Generated posts */}
        {posts && (
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20 }}>
            <div style={{ fontSize:".65rem", color:C.accent, fontFamily:"monospace", fontWeight:700, marginBottom:16 }}>✨ AI GENERATED POSTS</div>
            {Object.entries(posts).map(([platform, post]: any) => (
              <div key={platform} style={{ marginBottom:16, paddingBottom:16, borderBottom:`1px solid ${C.border}` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                  <div style={{ fontSize:".7rem", color:C.accent, fontFamily:"monospace", fontWeight:700 }}>{platform.toUpperCase()}</div>
                  <button onClick={() => { navigator.clipboard.writeText(post); setCopied(platform); setTimeout(() => setCopied(""), 2000); }} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:6, color:copied === platform ? C.green : C.muted, cursor:"pointer", fontSize:".72rem", padding:"4px 10px" }}>
                    {copied === platform ? "Copied ✓" : "📋 Copy"}
                  </button>
                </div>
                <div style={{ fontSize:".82rem", color:C.text, lineHeight:1.6, whiteSpace:"pre-wrap" as const }}>{post}</div>
              </div>
            ))}
          </div>
        )}

        {/* Nav to costs page */}
        <button onClick={() => router.push(`/dashboard/quote/${id}/costs`)} style={{ padding:"13px", borderRadius:8, border:`1px solid ${C.border}`, background:"transparent", color:C.muted, fontWeight:600, cursor:"pointer", fontSize:".88rem" }}>
          💰 View Job Cost Tracking →
        </button>

      </div>
    </NavLayout>
  );
}
