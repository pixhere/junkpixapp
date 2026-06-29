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
  muted:"#666666", green:"#22c55e", red:"#ef4444", blue:"#3b82f6",
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
  const [posts, setPosts] = useState<Record<string, string> | null>(null);
  const [copied, setCopied] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [posting, setPosting] = useState<Record<string, boolean>>({});
  const [posted, setPosted] = useState<Record<string, boolean>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data: op } = await supabase.from("operators").select("*").eq("id", user.id).single();
      if (op) setOperator(op);
      const { data: q } = await supabase.from("quote_requests").select("*").eq("id", id).single();
      if (q) { setQuote(q); setAfterPhotos(q.after_photo_urls || []); }
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

  const sendForgot = async () => {
    setForgotLoading(true);
    await fetch("/api/request-after-photos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quoteId: id }),
    });
    setForgotSent(true);
    setForgotLoading(false);
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
    } catch {}
    setGenerating(false);
  };

  const removePost = (platform: string) => {
    if (!posts) return;
    const updated = { ...posts };
    delete updated[platform];
    setPosts(Object.keys(updated).length ? updated : null);
  };

  const postToN8N = async (platform: string) => {
    if (!posts) return;
    setPosting(p => ({ ...p, [platform]: true }));
    try {
      await fetch(operator?.n8n_webhook_url || "", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          post: posts[platform],
          before_photos: quote?.photo_urls || [],
          after_photos: afterPhotos,
          operator: {
            business_name: operator?.business_name,
            website: operator?.website,
            phone: operator?.phone,
            location: operator?.city,
          },
        }),
      });
      setPosted(p => ({ ...p, [platform]: true }));
    } catch {}
    setPosting(p => ({ ...p, [platform]: false }));
  };

  if (!quote) return <NavLayout active="quotes"><div style={{ padding:24, color:C.muted }}>Loading...</div></NavLayout>;

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
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" as const }}>
              <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{ flex:1, padding:"10px", borderRadius:8, border:`1px dashed ${C.border}`, background:"transparent", color:C.muted, cursor:"pointer", fontSize:".84rem" }}>
                {uploading ? "Uploading..." : "📷 Upload After Photos"}
              </button>
              {afterPhotos.length === 0 && (
                <button onClick={sendForgot} disabled={forgotLoading || forgotSent} style={{ flex:1, padding:"10px", borderRadius:8, border:`1px solid ${C.accent}`, background:"transparent", color:forgotSent ? C.green : C.accent, cursor: forgotSent ? "default" : "pointer", fontSize:".84rem", fontWeight:600 }}>
                  {forgotSent ? "✓ On It" : forgotLoading ? "..." : "📩 Forgot?"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Generate social */}
        {afterPhotos.length > 0 && (
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20 }}>
            <div style={{ fontWeight:700, color:C.text, marginBottom:4 }}>🚀 Generate Social Content</div>
            <div style={{ fontSize:".84rem", color:C.muted, marginBottom:16 }}>AI writes posts using before/after context for Google, Instagram and Facebook.</div>
            <button onClick={generateSocial} disabled={generating} style={{ padding:"12px 24px", borderRadius:8, border:"none", background:C.accent, color:"#000", fontWeight:700, cursor:generating ? "not-allowed" : "pointer", fontSize:".9rem" }}>
              {generating ? "Generating..." : "✨ Generate Posts"}
            </button>
          </div>
        )}

        {/* Generated posts */}
        {posts && (
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20 }}>
            <div style={{ fontSize:".65rem", color:C.accent, fontFamily:"monospace", fontWeight:700, marginBottom:16 }}>✨ AI GENERATED POSTS</div>
            {Object.entries(posts).map(([platform, post]) => (
              <div key={platform} style={{ marginBottom:16, paddingBottom:16, borderBottom:`1px solid ${C.border}` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                  <div style={{ fontSize:".7rem", color:C.accent, fontFamily:"monospace", fontWeight:700 }}>{platform.toUpperCase()}</div>
                  <div style={{ display:"flex", gap:8 }}>
                    <button onClick={() => { navigator.clipboard.writeText(post); setCopied(platform); setTimeout(() => setCopied(""), 2000); }} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:6, color:copied === platform ? C.green : C.muted, cursor:"pointer", fontSize:".72rem", padding:"4px 10px" }}>
                      {copied === platform ? "Copied ✓" : "📋 Copy"}
                    </button>
                    <button onClick={() => postToN8N(platform)} disabled={posting[platform] || posted[platform]} style={{ background:"none", border:`1px solid ${C.blue}`, borderRadius:6, color:posted[platform] ? C.green : C.blue, cursor: posted[platform] ? "default" : "pointer", fontSize:".72rem", padding:"4px 10px" }}>
                      {posted[platform] ? "Posted ✓" : posting[platform] ? "Posting..." : "🚀 POST"}
                    </button>
                    <button onClick={() => removePost(platform)} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:6, color:C.red, cursor:"pointer", fontSize:".72rem", padding:"4px 10px" }}>
                      ✕ Remove
                    </button>
                  </div>
                </div>
                <div style={{ fontSize:".82rem", color:C.text, lineHeight:1.6, whiteSpace:"pre-wrap" as const }}>{post}</div>
              </div>
            ))}
          </div>
        )}

        <button onClick={() => router.push(`/dashboard/quote/${id}/costs`)} style={{ padding:"13px", borderRadius:8, border:`1px solid ${C.border}`, background:"transparent", color:C.muted, fontWeight:600, cursor:"pointer", fontSize:".88rem" }}>
          💰 View Job Cost Tracking →
        </button>

      </div>
    </NavLayout>
  );
}
