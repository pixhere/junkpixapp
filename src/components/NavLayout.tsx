"use client";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

const NAV_ITEMS = [
  { id: "overview",   label: "Home",       icon: "▦",  href: "/dashboard" },
  { id: "quotes",     label: "Quotes",     icon: "📋", href: "/dashboard/quotes" },
  { id: "calendar",   label: "Calendar",   icon: "📅", href: "/dashboard/calendar" },
  { id: "sales",      label: "Sales",      icon: "🎯", href: "/dashboard/sales" },
  { id: "social",     label: "Social",     icon: "📱", href: "/dashboard/social" },
  { id: "analytics",  label: "Analytics",  icon: "📊", href: "/dashboard/analytics" },
  { id: "leads",      label: "Lead Network", icon: "🌐", href: "/dashboard/leads" },
  { id: "my-leads",   label: "My Leads",   icon: "📬", href: "/dashboard/my-leads" },
  { id: "tax",        label: "Tax Est.",   icon: "🧾", href: "/dashboard/tax" },
  { id: "settings",   label: "Settings",   icon: "⚙️", href: "/dashboard/settings" },
];

export default function NavLayout({ children, active, title, backHref }: {
  children: React.ReactNode,
  active: string,
  title?: string,
  backHref?: string,
}) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const navigate = (href: string) => {
    setDrawerOpen(false);
    router.push(href);
  };

  const activeItem = NAV_ITEMS.find(i => i.id === active);

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:"#0F172A", fontFamily:"system-ui,sans-serif", color:"#F1F5F9" }}>
      <style>{`
        .jp-sidebar { display: none; }
        .jp-content { flex: 1; min-width: 0; }
        @media (min-width: 900px) {
          .jp-sidebar { display: flex !important; }
          .jp-hamburger-header { display: none !important; }
        }
        @media (max-width: 899px) {
          .jp-hamburger-header { display: flex !important; }
        }
      `}</style>

      {/* Desktop left sidebar */}
      <div className="jp-sidebar" style={{
        width: 200, flexShrink: 0,
        borderRight: "1px solid #2D3748",
        padding: "24px 12px",
        flexDirection: "column",
        gap: 4,
        position: "sticky" as const,
        top: 0,
        height: "100vh",
        overflowY: "auto" as const,
      }}>
        <div style={{ padding:"0 12px", marginBottom:20 }}>
          <div style={{ fontSize:"1.2rem", fontWeight:800 }}>
            <span style={{ color:"#00D4C8" }}>Junk</span><span style={{ color:"#F1F5F9" }}>Pix</span>
          </div>
          <div style={{ fontSize:".72rem", color:"#94A3B8", fontWeight:400, marginTop:2 }}>Operator Dashboard</div>
        </div>
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => navigate(item.href)}
            style={{
              display:"flex", alignItems:"center", gap:10,
              padding:"10px 14px", borderRadius:8, border:"none",
              background: active === item.id ? "rgba(0,212,200,0.1)" : "transparent",
              color: active === item.id ? "#00D4C8" : "#94A3B8",
              cursor:"pointer", fontWeight: active === item.id ? 700 : 400,
              fontSize:".88rem", textAlign:"left" as const, width:"100%",
              transition:"all .15s",
            }}
          >
            <span style={{ fontSize:"1rem" }}>{item.icon}</span>
            <span>{item.label}</span>
            {active === item.id && <div style={{ marginLeft:"auto", width:3, height:16, background:"#00D4C8", borderRadius:2 }} />}
          </button>
        ))}
      </div>

      {/* Mobile hamburger overlay */}
      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{
            position:"fixed", inset:0, background:"rgba(0,0,0,0.7)",
            zIndex:200, backdropFilter:"blur(4px)",
          }}
        />
      )}

      {/* Mobile drawer */}
      <div style={{
        position:"fixed", top:0, left:0, bottom:0,
        width:280, background:"#0F172A",
        borderRight:"1px solid #2D3748",
        zIndex:300,
        transform: drawerOpen ? "translateX(0)" : "translateX(-100%)",
        transition:"transform .25s cubic-bezier(.4,0,.2,1)",
        display:"flex", flexDirection:"column" as const,
        padding:"0 12px 24px",
        overflowY:"auto" as const,
      }}>
        {/* Drawer header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"20px 12px 24px" }}>
          <div>
  <div style={{ fontSize:"1.2rem", fontWeight:800 }}>
              <span style={{ color:"#00D4C8" }}>Junk</span>
              <span style={{ color:"#F1F5F9" }}>Pix</span>
            </div>
            <div style={{ fontSize:".72rem", color:"#94A3B8", marginTop:2 }}>Operator Dashboard</div>
          </div>
          <button onClick={() => setDrawerOpen(false)} style={{ background:"none", border:"1px solid #222", borderRadius:8, color:"#666", cursor:"pointer", padding:"8px 12px", fontSize:"1rem" }}>✕</button>
        </div>

        {/* Nav items */}
        <div style={{ display:"flex", flexDirection:"column" as const, gap:4 }}>
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => navigate(item.href)}
              style={{
                display:"flex", alignItems:"center", gap:14,
                padding:"14px 16px", borderRadius:10, border:"none",
                background: active === item.id ? "rgba(0,212,200,0.12)" : "transparent",
                color: active === item.id ? "#00D4C8" : "#888888",
                cursor:"pointer", fontWeight: active === item.id ? 700 : 400,
                fontSize:".92rem", textAlign:"left" as const, width:"100%",
                transition:"all .15s",
              }}
            >
              <span style={{ fontSize:"1.2rem", width:28, textAlign:"center" as const }}>{item.icon}</span>
              <span>{item.label}</span>
              {active === item.id && <div style={{ marginLeft:"auto", width:3, height:20, background:"#00D4C8", borderRadius:2 }} />}
            </button>
          ))}
        </div>

        {/* Drawer footer */}
        <div style={{ marginTop:"auto", paddingTop:24, borderTop:"1px solid #222", padding:"16px" }}>
          <div style={{ fontSize:".72rem", color:"#444", textAlign:"center" as const }}>JunkPix · Powered by AI</div>
        </div>
      </div>

      {/* Main content */}
      <div className="jp-content">

        {/* Mobile hamburger header — always visible on mobile */}
        <div className="jp-hamburger-header" style={{
          display:"none",
          position:"sticky" as const, top:0, zIndex:100,
          background:"#0F172A", borderBottom:"1px solid #2D3748",
          padding:"12px 16px",
          alignItems:"center", gap:12,
        }}>
          <button
            onClick={() => setDrawerOpen(true)}
            style={{ background:"none", border:"1px solid #222", borderRadius:8, color:"#F1F5F9", cursor:"pointer", padding:"8px 12px", fontSize:"1.1rem", flexShrink:0 }}
          >
            ☰
          </button>
          {backHref && (
            <button onClick={() => router.push(backHref)} style={{ background:"none", border:"1px solid #2D3748", borderRadius:8, color:"#94A3B8", cursor:"pointer", padding:"8px 14px", fontSize:".84rem", flexShrink:0 }}>←</button>
          )}
          <div style={{ fontWeight:700, color:"#F1F5F9", fontSize:".95rem", flex:1 }}>
            {title || (activeItem ? `${activeItem.icon} ${activeItem.label}` : "Dashboard")}
          </div>
        </div>

        {/* Desktop top header (only when back/title needed) */}
        {(title || backHref) && (
          <div style={{ position:"sticky" as const, top:0, zIndex:50, background:"#1E2937", borderBottom:"1px solid #2D3748", padding:"12px 16px", display:"flex", alignItems:"center", gap:12 }} className="jp-sidebar">
            {backHref && (
              <button onClick={() => router.push(backHref)} style={{ background:"none", border:"1px solid #2D3748", borderRadius:8, color:"#94A3B8", cursor:"pointer", padding:"6px 14px", fontSize:".84rem", flexShrink:0 }}>←</button>
            )}
            {title && <div style={{ fontWeight:800, color:"#F1F5F9", fontSize:"1rem", flex:1 }}>{title}</div>}
          </div>
        )}

        {children}
      </div>
    </div>
  );
}
