import { useState, useEffect } from "react";

const COLORS = {
  bg: "#0a0a0a",
  surface: "#111111",
  card: "#161616",
  border: "#222222",
  accent: "#f5a623",
  accentDim: "#f5a62322",
  text: "#f0f0f0",
  muted: "#666666",
  green: "#22c55e",
  red: "#ef4444",
  blue: "#3b82f6",
};

const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: "▦" },
  { id: "jobs", label: "Jobs", icon: "⊟" },
  { id: "schedule", label: "Schedule", icon: "◫" },
  { id: "customers", label: "Customers", icon: "◎" },
  { id: "team", label: "Team", icon: "⊕" },
  { id: "settings", label: "Settings", icon: "⊙" },
];

const MOCK_JOBS = [
  { id: 1, customer: "Marcus T.", address: "412 Pine St", type: "Full Cleanout", status: "scheduled", date: "Today 9:00 AM", amount: 380 },
  { id: 2, customer: "Sandra L.", address: "88 Elm Ave", type: "Appliance Pickup", status: "in_progress", date: "Today 11:30 AM", amount: 145 },
  { id: 3, customer: "Derek W.", address: "291 Oak Blvd", type: "Furniture Removal", status: "completed", date: "Yesterday", amount: 210 },
  { id: 4, customer: "Priya N.", address: "55 Walnut Ln", type: "Yard Debris", status: "completed", date: "Yesterday", amount: 175 },
  { id: 5, customer: "Tom B.", address: "770 Cedar Rd", type: "Estate Cleanout", status: "pending", date: "Tomorrow 8:00 AM", amount: 650 },
  { id: 6, customer: "Lisa K.", address: "33 Maple Dr", type: "Hot Tub Removal", status: "pending", date: "Jun 22", amount: 425 },
];

const STATUS_STYLES = {
  scheduled: { label: "Scheduled", color: COLORS.blue, bg: "#3b82f622" },
  in_progress: { label: "In Progress", color: COLORS.accent, bg: "#f5a62322" },
  completed: { label: "Completed", color: COLORS.green, bg: "#22c55e22" },
  pending: { label: "Pending", color: COLORS.muted, bg: "#66666622" },
};

function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{
      background: COLORS.card,
      border: `1px solid ${COLORS.border}`,
      borderRadius: 12,
      padding: "24px 20px",
      display: "flex",
      flexDirection: "column",
      gap: 6,
    }}>
      <span style={{ fontSize: 12, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</span>
      <span style={{ fontSize: 32, fontWeight: 700, color: accent || COLORS.text, fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1 }}>{value}</span>
      {sub && <span style={{ fontSize: 12, color: COLORS.muted }}>{sub}</span>}
    </div>
  );
}

function JobRow({ job, onView }) {
  const s = STATUS_STYLES[job.status];
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr 140px 120px 80px 90px",
      alignItems: "center",
      padding: "14px 20px",
      borderBottom: `1px solid ${COLORS.border}`,
      gap: 12,
      cursor: "pointer",
      transition: "background 0.15s",
    }}
      onMouseEnter={e => e.currentTarget.style.background = "#1a1a1a"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
      onClick={() => onView(job)}
    >
      <span style={{ color: COLORS.text, fontWeight: 500 }}>{job.customer}</span>
      <span style={{ color: COLORS.muted, fontSize: 13 }}>{job.address}</span>
      <span style={{ color: COLORS.muted, fontSize: 13 }}>{job.type}</span>
      <span style={{ color: COLORS.muted, fontSize: 13 }}>{job.date}</span>
      <span style={{
        fontSize: 11, fontWeight: 600, color: s.color, background: s.bg,
        padding: "4px 10px", borderRadius: 20, textAlign: "center", whiteSpace: "nowrap"
      }}>{s.label}</span>
      <span style={{ color: COLORS.accent, fontWeight: 700, textAlign: "right" }}>${job.amount}</span>
    </div>
  );
}

function JobModal({ job, onClose }) {
  if (!job) return null;
  const s = STATUS_STYLES[job.status];
  return (
    <div style={{
      position: "fixed", inset: 0, background: "#000000bb", zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center"
    }} onClick={onClose}>
      <div style={{
        background: COLORS.card, border: `1px solid ${COLORS.border}`,
        borderRadius: 16, padding: 32, width: 440, position: "relative"
      }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{
          position: "absolute", top: 16, right: 16,
          background: "none", border: "none", color: COLORS.muted,
          fontSize: 20, cursor: "pointer"
        }}>✕</button>
        <div style={{ fontSize: 11, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Job Details</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.text, marginBottom: 4 }}>{job.customer}</div>
        <div style={{ fontSize: 13, color: COLORS.muted, marginBottom: 20 }}>{job.address}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            ["Service Type", job.type],
            ["Date & Time", job.date],
            ["Status", <span style={{ color: s.color }}>{s.label}</span>],
            ["Amount", <span style={{ color: COLORS.accent, fontWeight: 700 }}>${job.amount}</span>],
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${COLORS.border}`, paddingBottom: 12 }}>
              <span style={{ fontSize: 13, color: COLORS.muted }}>{k}</span>
              <span style={{ fontSize: 14, color: COLORS.text }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <button style={{
            flex: 1, padding: "12px 0", background: COLORS.accent, color: "#000",
            border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 14
          }}>Mark Complete</button>
          <button style={{
            flex: 1, padding: "12px 0", background: COLORS.border, color: COLORS.text,
            border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 14
          }}>Send Update</button>
        </div>
      </div>
    </div>
  );
}

function Overview() {
  const todayJobs = MOCK_JOBS.filter(j => j.date.includes("Today"));
  const completedJobs = MOCK_JOBS.filter(j => j.status === "completed");
  const revenue = MOCK_JOBS.filter(j => j.status === "completed").reduce((s, j) => s + j.amount, 0);
  const [selected, setSelected] = useState(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.text, marginBottom: 4 }}>Good morning, Operator 👋</div>
        <div style={{ fontSize: 14, color: COLORS.muted }}>Here's what's happening today.</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        <StatCard label="Today's Jobs" value={todayJobs.length} sub="2 active routes" accent={COLORS.accent} />
        <StatCard label="Week Revenue" value={`$${revenue}`} sub="↑ 12% vs last week" />
        <StatCard label="Completed" value={completedJobs.length} sub="This week" accent={COLORS.green} />
        <StatCard label="Pending" value={MOCK_JOBS.filter(j => j.status === "pending").length} sub="Needs scheduling" />
      </div>

      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "18px 20px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontWeight: 600, color: COLORS.text }}>Today's Jobs</span>
          <span style={{ fontSize: 12, color: COLORS.muted }}>{todayJobs.length} jobs</span>
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 140px 120px 80px 90px",
          padding: "10px 20px",
          borderBottom: `1px solid ${COLORS.border}`,
          gap: 12
        }}>
          {["Customer", "Address", "Type", "Time", "Status", "Amount"].map(h => (
            <span key={h} style={{ fontSize: 11, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</span>
          ))}
        </div>
        {todayJobs.map(job => <JobRow key={job.id} job={job} onView={setSelected} />)}
      </div>

      {selected && <JobModal job={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function Jobs() {
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const filters = ["all", "scheduled", "in_progress", "completed", "pending"];
  const filtered = filter === "all" ? MOCK_JOBS : MOCK_JOBS.filter(j => j.status === filter);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.text }}>All Jobs</div>
        <button style={{
          background: COLORS.accent, color: "#000", border: "none",
          borderRadius: 8, padding: "10px 20px", fontWeight: 700, cursor: "pointer"
        }}>+ New Job</button>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: "7px 16px", borderRadius: 20, border: `1px solid ${filter === f ? COLORS.accent : COLORS.border}`,
            background: filter === f ? COLORS.accentDim : "transparent",
            color: filter === f ? COLORS.accent : COLORS.muted,
            fontSize: 12, fontWeight: 600, cursor: "pointer", textTransform: "capitalize"
          }}>{f.replace("_", " ")}</button>
        ))}
      </div>

      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, overflow: "hidden" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 140px 120px 80px 90px",
          padding: "10px 20px",
          borderBottom: `1px solid ${COLORS.border}`,
          gap: 12
        }}>
          {["Customer", "Address", "Type", "Date", "Status", "Amount"].map(h => (
            <span key={h} style={{ fontSize: 11, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</span>
          ))}
        </div>
        {filtered.map(job => <JobRow key={job.id} job={job} onView={setSelected} />)}
        {filtered.length === 0 && (
          <div style={{ padding: 40, textAlign: "center", color: COLORS.muted }}>No jobs found.</div>
        )}
      </div>
      {selected && <JobModal job={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function Schedule() {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.text }}>Schedule</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
        {days.map((day, i) => {
          const d = new Date(startOfWeek);
          d.setDate(startOfWeek.getDate() + i);
          const isToday = d.toDateString() === today.toDateString();
          const dayJobs = i === 1 ? MOCK_JOBS.filter(j => j.date.includes("Today")) :
                          i === 2 ? MOCK_JOBS.filter(j => j.date.includes("Tomorrow")) : [];
          return (
            <div key={day} style={{
              background: isToday ? COLORS.accentDim : COLORS.card,
              border: `1px solid ${isToday ? COLORS.accent : COLORS.border}`,
              borderRadius: 12, padding: 16, minHeight: 120
            }}>
              <div style={{ fontSize: 11, color: isToday ? COLORS.accent : COLORS.muted, fontWeight: 600, textTransform: "uppercase", marginBottom: 4 }}>{day}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: isToday ? COLORS.accent : COLORS.text, marginBottom: 10 }}>{d.getDate()}</div>
              {dayJobs.map(j => (
                <div key={j.id} style={{
                  background: STATUS_STYLES[j.status].bg, borderRadius: 6,
                  padding: "4px 8px", marginBottom: 4,
                  fontSize: 11, color: STATUS_STYLES[j.status].color, fontWeight: 600
                }}>{j.customer}</div>
              ))}
            </div>
          );
        })}
      </div>
      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 20 }}>
        <div style={{ fontWeight: 600, color: COLORS.text, marginBottom: 16 }}>Upcoming This Week</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {MOCK_JOBS.filter(j => j.status !== "completed").map(j => (
            <div key={j.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 12, borderBottom: `1px solid ${COLORS.border}` }}>
              <div>
                <div style={{ color: COLORS.text, fontWeight: 500, marginBottom: 2 }}>{j.customer}</div>
                <div style={{ fontSize: 12, color: COLORS.muted }}>{j.type} · {j.date}</div>
              </div>
              <span style={{ color: COLORS.accent, fontWeight: 700 }}>${j.amount}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Customers() {
  const unique = [...new Map(MOCK_JOBS.map(j => [j.customer, j])).values()];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.text }}>Customers</div>
      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, overflow: "hidden" }}>
        {unique.map((c, i) => (
          <div key={i} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "16px 20px", borderBottom: `1px solid ${COLORS.border}`
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{
                width: 40, height: 40, borderRadius: "50%", background: COLORS.accentDim,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: COLORS.accent, fontWeight: 700, fontSize: 14
              }}>{c.customer[0]}</div>
              <div>
                <div style={{ color: COLORS.text, fontWeight: 500 }}>{c.customer}</div>
                <div style={{ fontSize: 12, color: COLORS.muted }}>{c.address}</div>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: COLORS.accent, fontWeight: 700 }}>${c.amount}</div>
              <div style={{ fontSize: 11, color: COLORS.muted }}>Last job</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Team() {
  const members = [
    { name: "James R.", role: "Driver", status: "active", jobs: 12 },
    { name: "Carlos M.", role: "Loader", status: "active", jobs: 9 },
    { name: "DeShawn P.", role: "Driver", status: "off", jobs: 7 },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.text }}>Team</div>
        <button style={{ background: COLORS.accent, color: "#000", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 700, cursor: "pointer" }}>+ Add Member</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {members.map((m, i) => (
          <div key={i} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 48, height: 48, borderRadius: "50%", background: COLORS.accentDim,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: COLORS.accent, fontWeight: 700, fontSize: 18
              }}>{m.name[0]}</div>
              <div>
                <div style={{ color: COLORS.text, fontWeight: 600 }}>{m.name}</div>
                <div style={{ fontSize: 12, color: COLORS.muted }}>{m.role}</div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{
                fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20,
                color: m.status === "active" ? COLORS.green : COLORS.muted,
                background: m.status === "active" ? "#22c55e22" : "#66666622"
              }}>{m.status === "active" ? "On Duty" : "Off"}</span>
              <span style={{ fontSize: 13, color: COLORS.muted }}>{m.jobs} jobs</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Settings() {
  const [biz, setBiz] = useState("JunkPix Operations");
  const [email, setEmail] = useState("operator@junkpix.com");
  const [phone, setPhone] = useState("(717) 555-0100");
  const [saved, setSaved] = useState(false);

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const field = (label, val, setter) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 12, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</label>
      <input value={val} onChange={e => setter(e.target.value)} style={{
        background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8,
        padding: "12px 14px", color: COLORS.text, fontSize: 14, outline: "none",
        fontFamily: "inherit"
      }} />
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 560 }}>
      <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.text }}>Settings</div>
      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ fontWeight: 600, color: COLORS.text, marginBottom: 4 }}>Business Info</div>
        {field("Business Name", biz, setBiz)}
        {field("Email", email, setEmail)}
        {field("Phone", phone, setPhone)}
        <button onClick={save} style={{
          background: saved ? COLORS.green : COLORS.accent, color: "#000",
          border: "none", borderRadius: 8, padding: "12px 0",
          fontWeight: 700, cursor: "pointer", fontSize: 14, transition: "background 0.2s"
        }}>{saved ? "Saved ✓" : "Save Changes"}</button>
      </div>
    </div>
  );
}

const SCREENS = { overview: Overview, jobs: Jobs, schedule: Schedule, customers: Customers, team: Team, settings: Settings };

export default function JunkPixDashboard() {
  const [active, setActive] = useState("overview");
  const Screen = SCREENS[active];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: COLORS.bg, fontFamily: "'Inter', 'Space Grotesk', sans-serif", color: COLORS.text }}>
      {/* Sidebar */}
      <div style={{
        width: 220, background: COLORS.surface, borderRight: `1px solid ${COLORS.border}`,
        display: "flex", flexDirection: "column", padding: "24px 16px", gap: 4, flexShrink: 0
      }}>
        {/* Logo */}
        <div style={{ padding: "8px 12px", marginBottom: 24 }}>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.03em" }}>
            <span style={{ color: COLORS.accent }}>Junk</span>
            <span style={{ color: COLORS.text }}>Pix</span>
          </div>
          <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 2 }}>Operator Dashboard</div>
        </div>

        {NAV_ITEMS.map(item => (
          <button key={item.id} onClick={() => setActive(item.id)} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 14px", borderRadius: 8, border: "none",
            background: active === item.id ? COLORS.accentDim : "transparent",
            color: active === item.id ? COLORS.accent : COLORS.muted,
            cursor: "pointer", fontWeight: active === item.id ? 600 : 400,
            fontSize: 14, textAlign: "left", transition: "all 0.15s"
          }}>
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            {item.label}
          </button>
        ))}

        <div style={{ marginTop: "auto", paddingTop: 24, borderTop: `1px solid ${COLORS.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px" }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%", background: COLORS.accentDim,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: COLORS.accent, fontWeight: 700, fontSize: 13
            }}>O</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>Operator</div>
              <div style={{ fontSize: 11, color: COLORS.muted }}>Admin</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, padding: 32, overflowY: "auto" }}>
        <Screen />
      </div>
    </div>
  );
}