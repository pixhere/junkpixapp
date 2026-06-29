"use client";
import { useRouter } from "next/navigation";
import React from "react";

const C = {
  bg: "#0A0A0A", card: "#111111", border: "#222222", text: "#F5F4F0",
  muted: "#666660", accent: "#D97B4F",
};

const NAV_ITEMS = [
  { id: "overview",   label: "Home",      icon: "▦",  href: "/dashboard" },
  { id: "quotes",     label: "Quotes",    icon: "📋", href: "/dashboard/quotes" },
  { id: "calendar",   label: "Calendar",  icon: "📅", href: "/dashboard/calendar" },
  { id: "sales",      label: "Sales",     icon: "🎯", href: "/dashboard/sales" },
  { id: "social",     label: "Social",    icon: "📱", href: "/dashboard/social" },
  { id: "analytics",  label: "Analytics", icon: "📊", href: "/dashboard/analytics" },
  { id: "settings",   label: "Settings",  icon: "⚙️", href: "/dashboard/settings" },
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
      
      {/* Top header */}
      {title && (
        <div style={{
          position: "sticky", top: 0, zIndex: 50,
          background: C.card, borderBottom: "1px solid " + C.border,
          padding: "12px 16px", display: "flex", alignItems: "center", gap: 12,
        }}>
          {backHref && (
            <button
              onClick={() => router.push(backHref)}
              style={{ background: "none", border: "1px solid " + C.border, borderRadius: 8, color: C.muted, cursor: "pointer", padding: "6px 14px", fontSize: ".84rem", whiteSpace: "nowrap" as const, flexShrink: 0 }}
            >
              ←
            </button>
          )}
          <div style={{ fontWeight: 800, color: C.text, fontSize: "1rem", flex: 1 }}>{title}</div>
        </div>
      )}

      {/* Main content */}
      <div style={{ paddingBottom: 90 }}>
        {children}
      </div>

      {/* Bottom nav - fixed, always visible, scrollable on mobile */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: C.card, borderTop: "1px solid " + C.border,
        zIndex: 100,
        paddingTop: 6,
        paddingBottom: "max(env(safe-area-inset-bottom), 8px)",
      }}>
        <div style={{
          display: "flex",
          overflowX: "auto" as const,
          WebkitOverflowScrolling: "touch" as any,
          scrollbarWidth: "none" as any,
          msOverflowStyle: "none" as any,
          justifyContent: "space-around",
          minWidth: "100%",
          padding: "0 4px",
        }}>
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => router.push(item.href)}
              style={{
                background: "none", border: "none",
                color: active === item.id ? C.accent : C.muted,
                cursor: "pointer",
                display: "flex", flexDirection: "column" as const,
                alignItems: "center", gap: 2,
                padding: "4px 10px",
                minWidth: 52, flexShrink: 0,
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <span style={{ fontSize: "1.3rem", lineHeight: 1 }}>{item.icon}</span>
              <span style={{ fontSize: ".52rem", fontWeight: active === item.id ? 700 : 400, whiteSpace: "nowrap" as const }}>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
