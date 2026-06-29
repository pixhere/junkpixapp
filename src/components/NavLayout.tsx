"use client";
import { useRouter } from "next/navigation";
import React from "react";

const NAV_ITEMS = [
  { id: "overview",   label: "Home",     icon: "▦",  href: "/dashboard" },
  { id: "quotes",     label: "Quotes",   icon: "📋", href: "/dashboard/quotes" },
  { id: "calendar",   label: "Calendar", icon: "📅", href: "/dashboard/calendar" },
  { id: "sales",      label: "Sales",    icon: "🎯", href: "/dashboard/sales" },
  { id: "social",     label: "Social",   icon: "📱", href: "/dashboard/social" },
  { id: "analytics",  label: "Analytics",icon: "📊", href: "/dashboard/analytics" },
];

export default function NavLayout({ children, active, title, backHref }: { 
  children: React.ReactNode, 
  active: string,
  title?: string,
  backHref?: string,
}) {
  const router = useRouter();

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"#0A0A0A", fontFamily:"system-ui,sans-serif", color:"#F0F0F0" }}>
      <style>{`
        .jp-sidebar { display: none; }
        .jp-mobile-nav { display: flex; }
        .jp-content { padding-bottom: 80px; flex: 1; min-width: 0; }
        @media (min-width: 900px) {
          .jp-sidebar { display: flex !important; }
          .jp-mobile-nav { display: none !important; }
          .jp-content { padding-bottom: 0; }
        }
      `}</style>

      {/* Desktop left sidebar */}
      <div className="jp-sidebar" style={{
        width: 180, flexShrink: 0,
        borderRight: "1px solid #222222",
        padding: "24px 12px",
        flexDirection: "column",
        gap: 4,
        position: "sticky" as const,
        top: 0,
        height: "100vh",
        overflowY: "auto" as const,
      }}>
        <div style={{ fontWeight:800, color:"#F0F0F0", fontSize:"1rem", padding:"0 12px", marginBottom:20 }}>
          <div>🚛 JunkPix</div>
          <div style={{ fontSize:".7rem", color:"#666666", fontWeight:400, marginTop:2 }}>Operator Dashboard</div>
        </div>
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => router.push(item.href)}
            style={{
              display:"flex", alignItems:"center", gap:10,
              padding:"10px 14px", borderRadius:8, border:"none",
              background: active === item.id ? "rgba(217,123,79,0.1)" : "transparent",
              color: active === item.id ? "#D97B4F" : "#666666",
              cursor:"pointer", fontWeight: active === item.id ? 700 : 400,
              fontSize:".88rem", textAlign:"left" as const, width:"100%",
            }}
          >
            <span style={{ fontSize:"1.1rem" }}>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Main content */}
      <div className="jp-content">
        {/* Top header */}
        {(title || backHref) && (
          <div style={{ position:"sticky" as const, top:0, zIndex:50, background:"#161616", borderBottom:"1px solid #222222", padding:"12px 16px", display:"flex", alignItems:"center", gap:12 }}>
            {backHref && (
              <button onClick={() => router.push(backHref)} style={{ background:"none", border:"1px solid #222222", borderRadius:8, color:"#666666", cursor:"pointer", padding:"6px 14px", fontSize:".84rem", whiteSpace:"nowrap" as const, flexShrink:0 }}>←</button>
            )}
            {title && <div style={{ fontWeight:800, color:"#F0F0F0", fontSize:"1rem", flex:1 }}>{title}</div>}
          </div>
        )}
        {children}
      </div>

      {/* Mobile bottom nav only */}
      <div className="jp-mobile-nav" style={{
        position:"fixed", bottom:0, left:0, right:0,
        background:"#161616", borderTop:"1px solid #222222",
        zIndex:100, paddingTop:6,
        paddingBottom:"max(env(safe-area-inset-bottom), 10px)",
        justifyContent:"space-around",
      }}>
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => router.push(item.href)}
            style={{
              background:"none", border:"none",
              color: active === item.id ? "#D97B4F" : "#666666",
              cursor:"pointer", display:"flex", flexDirection:"column" as const,
              alignItems:"center", gap:2, padding:"4px 8px",
              minWidth:44, flexShrink:0,
              WebkitTapHighlightColor:"transparent",
            }}
          >
            <span style={{ fontSize:"1.2rem", lineHeight:1 }}>{item.icon}</span>
            <span style={{ fontSize:".5rem", fontWeight:active === item.id ? 700 : 400, whiteSpace:"nowrap" as const }}>{item.label}</span>
          </button>
        ))}
      </div>

    </div>
  );
}
