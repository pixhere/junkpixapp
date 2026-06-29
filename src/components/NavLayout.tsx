"use client";
import { useRouter, usePathname } from "next/navigation";
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
  { id: "analytics",  label: "Stats",    icon: "📊", href: "/dashboard/analytics" },
  { id: "settings",   label: "Settings", icon: "⚙️", href: "/dashboard/settings" },
];

export default function NavLayout({ children, active, title, backHref }: { 
  children: React.ReactNode, 
  active: string,
  title?: string,
  backHref?: string,
}) {
  const router = useRouter();

  return (
    <div style={{ display: "flex", background: C.bg, minHeight: "100vh", fontFamily: "system-ui,sans-serif", color: C.text }}>

      {/* Desktop left sidebar */}
      <div style={{ width: 200, borderRight: "1px solid " + C.border, padding: "24px 12px", display: "flex", flexDirection: "column" as const, gap: 4, position: "sticky" as const, top: 0, height: "100vh", flexShrink: 0 }} className="desktop-sidebar">
        <div style={{ fontWeight: 800, color: C.text, fontSize: "1.1rem", padding: "0 12px", marginBottom: 20 }}>🚛 JunkPix</div>
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => router.push(item.href)}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 14px", borderRadius: 8, border: "none",
              background: active === item.id ? "rgba(217,123,79,0.15)" : "transparent",
              color: active === item.id ? C.accent : C.muted,
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
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Top header */}
        {title && (
          <div style={{ position: "sticky" as const, top: 0, zIndex: 50, background: C.card, borderBottom: "1px solid " + C.border, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
            {backHref && (
              <button onClick={() => router.push(backHref)} style={{ background: "none", border: "1px solid " + C.border, borderRadius: 8, color: C.muted, cursor: "pointer", padding: "6px 14px", fontSize: ".84rem", whiteSpace: "nowrap" as const, flexShrink: 0 }}>←</button>
            )}
            <div style={{ fontWeight: 800, color: C.text, fontSize: "1rem", flex: 1 }}>{title}</div>
          </div>
        )}

        {/* Page content */}
        <div style={{ paddingBottom: 90 }}>
          {children}
        </div>
      </div>

      {/* Mobile bottom nav */}
      <div className="mobile-nav" style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: C.card, borderTop: "1px solid " + C.border,
        zIndex: 100, paddingTop: 6,
        paddingBottom: "max(env(safe-area-inset-bottom), 8px)",
      }}>
        <div style={{ display: "flex", overflowX: "auto" as const, scrollbarWidth: "none" as any, justifyContent: "space-around", padding: "0 4px" }}>
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => router.push(item.href)}
              style={{
                background: "none", border: "none",
                color: active === item.id ? C.accent : C.muted,
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

      <style>{`
        .desktop-sidebar { display: none; }
        .mobile-nav { display: block; }
        @media (min-width: 768px) {
          .desktop-sidebar { display: flex !important; }
          .mobile-nav { display: none !important; }
        }
      `}</style>
    </div>
  );
}
