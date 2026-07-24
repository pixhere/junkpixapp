"use client";
import React from "react";
import { useRouter } from "next/navigation";
import NavLayout from "@/components/NavLayout";

const C = {
  bg:"#0F172A", card:"#1E2937", border:"#2D3748", text:"#F5F4F0",
  muted:"#666660", accent:"#00D4C8", surface:"#1a1a1a",
};

const MENU = [
  { href: "/dashboard/sales/close",   icon: "🎯", label: "Close a Job",    desc: "Full closing playbook for a specific lead" },
  { href: "/dashboard/sales/daily",   icon: "⚡", label: "Daily Intel",     desc: "Today's sales lesson from the masters" },
  { href: "/dashboard/sales/academy", icon: "📚", label: "Sales Academy",   desc: "Books, curriculum, daily habits" },
  { href: "/dashboard/sales/ask",     icon: "💬", label: "Ask the Coach",   desc: "Ask anything about sales or business" },
  { href: "/dashboard/sales/notes",   icon: "📝", label: "My Notes",        desc: "Your saved scripts and lines" },
];

export default function SalesMenuPage() {
  const router = useRouter();

  return (
    <NavLayout active="sales" title="🎯 Sales Academy">
      <div style={{ padding: 24 }}>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: C.text, marginBottom: 4 }}>Sales Academy</div>
          <div style={{ fontSize: ".84rem", color: C.muted }}>Powered by 15 sales masters. Built for junk removal operators.</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" as const, gap: 12 }}>
          {MENU.map(item => (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              onMouseEnter={e => (e.currentTarget.style.background = "#1a1a1a")}
              onMouseLeave={e => (e.currentTarget.style.background = C.card)}
              style={{
                padding: "20px", borderRadius: 12,
                border: "1px solid " + C.border,
                background: C.card, color: C.text,
                cursor: "pointer", textAlign: "left" as const,
                display: "flex", alignItems: "center", gap: 16,
                width: "100%",
              }}
            >
              <span style={{ fontSize: "1.8rem", flexShrink: 0 }}>{item.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: ".78rem", color: C.muted }}>{item.desc}</div>
              </div>
              <span style={{ color: C.muted, fontSize: "1.2rem" }}>›</span>
            </button>
          ))}
        </div>

      </div>
    </NavLayout>
  );
}
