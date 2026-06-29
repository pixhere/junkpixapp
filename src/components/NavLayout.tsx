"use client";
import { useRouter } from "next/navigation";
import React from "react";

const C = {
  bg: "#0A0A0A", card: "#111111", border: "#222222", text: "#F5F4F0",
  muted: "#666660", accent: "#D97B4F",
};

const NAV_ITEMS = [
  { id: "overview",   label: "Home",     icon: "▦",  href: "/dashboard" },
  { id: "quotes",     label: "Quotes",   icon: "📋", href: "/dashboard/quotes" },
  { id: "calendar",   label: "Calendar", icon: "📅", href: "/dashboard/calendar" },
  { id: "sales",      label: "Sales",    icon: "🎯", href: "/dashboard/sales" },
  { id: "social",     label: "Social",   icon: "📱", href: "/dashboard/social" },
  { id: "analytics",  label: "Analytics", icon: "📊", href: "/dashboard/analytics" },
];

export default function NavLayout({ children, active, title, backHref }: { 
  children: React.ReactNode, 
  active: string,
  title?: string,
  backHref?: string,
}) {
  const router = useRouter();

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "system-ui,sans-serif", color: C.text }}>
      <style>{`
        .jp-sidebar { display: none; }
        .jp-mobile-nav { display: block; }
        .jp-main { padding-bottom: 90px; }
        @media (min-width: 900px) {
          .jp-sidebar { 
            display: flex !important; 
            flex-direction: column;
            width: 200px; 
            border-right: 1px solid #222222; 
            padding: 24px 12px; 
            gap: 4px;
            position: fixed;
            top: 0;
            left: 0;
            height: 100vh;
            background: #111111;
            z-index: 50;
            overflow-y: auto;
          }
          .jp-mobile-nav { display: none !important; }
          .jp-main { margin-left: 200px; padding-bottom: 0; }
        }
      `}</style>

      {/* Desktop left sidebar */}
      <div className="jp-sidebar">
        <div style={{ fontWeight: 800, color: "#F5F4F0", fontSize: "1rem", padding: "0 12px", marginBottom: 20 }}>🚛 JunkPix</div>
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => router.push(item.href)}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 14px", borderRadius: 8, border: "none",
              background: active === item.id ? "rgba(217,123,79,0.15)" : "transparent",
              color: active === item.id ? "#D97B4F" : "#666660",
              cursor: "pointer", fontWeight: active === item.id ? 700 : 400,
              fontSize: ".88rem", textAlign: "left" as const, width: "100%",
            }}
          >
            <span style={{ fontSize: "1.1rem" }}>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Main content */}
      <div className="jp-main">
        {/* Top header */}
        {title && (
          <div style={{ position: "sticky" as const, top: 0, zIndex: 40, background: "#111111", borderBottom: "1px solid #222222", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
            {backHref && (
              <button 
                onClick={() => router.push(backHref)} 
                style={{ background: "none", border: "1px solid #222222", borderRadius: 8, color: "#666660", cursor: "pointer", padding: "6px 14px", fontSize: ".84rem", whiteSpace: "nowrap" as const, flexShrink: 0 }}
              >←</button>
            )}
            <div style={{ fontWeight: 800, color: "#F5F4F0", fontSize: "1rem", flex: 1 }}>{title}</div>
          </div>
        )}
        {children}
      </div>

      {/* Mobile bottom nav */}
      <div className="jp-mobile-nav" style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "#111111", borderTop: "1px solid #222222",
        zIndex: 100, paddingTop: 6,
        paddingBottom: "max(env(safe-area-inset-bottom), 10px)",
      }}>
        <div style={{ display: "flex", overflowX: "auto" as const, scrollbarWidth: "none" as any, justifyContent: "space-around", padding: "0 4px" }}>
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => router.push(item.href)}
              style={{
                background: "none", border: "none",
                color: active === item.id ? "#D97B4F" : "#666660",
                cursor: "pointer", display: "flex", flexDirection: "column" as const,
                alignItems: "center", gap: 2, padding: "4px 8px",
                minWidth: 48, flexShrink: 0,
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <span style={{ fontSize: "1.2rem", lineHeight: 1 }}>{item.icon}</span>
              <span style={{ fontSize: ".5rem", fontWeight: active === item.id ? 700 : 400, whiteSpace: "nowrap" as const }}>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
