"use client";
import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import NavLayout from "@/components/NavLayout";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const C = {
  bg:"#0A0A0A", card:"#111111", border:"#222222", text:"#F5F4F0",
  muted:"#666660", accent:"#D97B4F", surface:"#1a1a1a",
};

export default function CalendarPage() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string|null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data: qs } = await supabase.from("quote_requests").select("*").eq("operator_id", user.id).not("scheduled_date", "is", null);
      if (qs) setQuotes(qs);
    };
    load();
  }, []);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const today = new Date();
  const todayStr = today.getFullYear() + "-" + String(today.getMonth()+1).padStart(2,"0") + "-" + String(today.getDate()).padStart(2,"0");

  const getJobsForDay = (day: number) => {
    const dateStr = year + "-" + String(month+1).padStart(2,"0") + "-" + String(day).padStart(2,"0");
    return quotes.filter(q => q.scheduled_date === dateStr);
  };

  const selectedJobs = selectedDate ? quotes.filter(q => q.scheduled_date === selectedDate) : [];

  return (
    <NavLayout active="calendar" title="📅 Calendar">
      <div style={{ maxWidth: 700, margin: "0 auto", padding: 16 }}>

        {/* Month nav */}
        <div style={{ background: C.card, border: "1px solid " + C.border, borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <button onClick={() => setCurrentMonth(new Date(year, month-1))} style={{ background: "none", border: "1px solid " + C.border, borderRadius: 8, color: C.muted, cursor: "pointer", padding: "6px 12px" }}>←</button>
            <div style={{ fontWeight: 700, color: C.text }}>{monthNames[month]} {year}</div>
            <button onClick={() => setCurrentMonth(new Date(year, month+1))} style={{ background: "none", border: "1px solid " + C.border, borderRadius: 8, color: C.muted, cursor: "pointer", padding: "6px 12px" }}>→</button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 4 }}>
            {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
              <div key={d} style={{ textAlign: "center" as const, fontSize: ".6rem", color: C.muted, padding: "4px 0" }}>{d}</div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
            {Array.from({ length: firstDay }).map((_,i) => <div key={"e"+i} />)}
            {Array.from({ length: daysInMonth }).map((_,i) => {
              const day = i+1;
              const dateStr = year + "-" + String(month+1).padStart(2,"0") + "-" + String(day).padStart(2,"0");
              const jobs = getJobsForDay(day);
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;
              return (
                <div key={day} onClick={() => setSelectedDate(dateStr === selectedDate ? null : dateStr)} style={{ padding: "6px 2px", borderRadius: 8, textAlign: "center" as const, cursor: "pointer", background: isSelected ? "rgba(217,123,79,0.15)" : isToday ? "rgba(255,255,255,0.05)" : "transparent", border: isSelected ? "1px solid " + C.accent : isToday ? "1px solid rgba(255,255,255,0.1)" : "1px solid transparent" }}>
                  <div style={{ fontSize: ".82rem", fontWeight: isToday ? 700 : 400, color: isToday ? C.accent : C.text }}>{day}</div>
                  {jobs.length > 0 && (
                    <div style={{ display: "flex", justifyContent: "center", gap: 2, marginTop: 2 }}>
                      {jobs.slice(0,3).map((_,j) => <div key={j} style={{ width: 5, height: 5, borderRadius: "50%", background: C.accent }} />)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected day */}
        {selectedDate && (
          <div style={{ background: C.card, border: "1px solid " + C.border, borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: ".65rem", color: C.muted, fontFamily: "monospace", marginBottom: 12 }}>
              {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric" })}
            </div>
            {selectedJobs.length === 0 ? (
              <div style={{ color: C.muted, fontSize: ".84rem" }}>No jobs scheduled.</div>
            ) : selectedJobs.map(q => (
              <div key={q.id} onClick={() => router.push("/dashboard/quote/"+q.id)} style={{ padding: "12px 14px", borderRadius: 8, background: C.surface, border: "1px solid " + C.border, cursor: "pointer", marginBottom: 8 }}>
                <div style={{ fontWeight: 600, color: C.text }}>{q.customer_name}</div>
                <div style={{ fontSize: ".75rem", color: C.muted }}>{q.customer_address}</div>
                {q.scheduled_time && <div style={{ fontSize: ".75rem", color: C.accent }}>⏰ {q.scheduled_time}</div>}
              </div>
            ))}
          </div>
        )}

        {/* Upcoming jobs */}
        <div style={{ background: C.card, border: "1px solid " + C.border, borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: ".65rem", color: C.muted, fontFamily: "monospace", marginBottom: 12 }}>UPCOMING JOBS</div>
          {quotes.length === 0 ? (
            <div style={{ color: C.muted, fontSize: ".84rem" }}>No jobs scheduled yet.</div>
          ) : quotes.sort((a,b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()).slice(0,10).map(q => (
            <div key={q.id} onClick={() => router.push("/dashboard/quote/"+q.id)} style={{ padding: "12px 14px", borderRadius: 8, background: C.surface, border: "1px solid " + C.border, cursor: "pointer", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 600, color: C.text, fontSize: ".9rem" }}>{q.customer_name}</div>
                <div style={{ fontSize: ".72rem", color: C.accent }}>📅 {new Date(q.scheduled_date+"T12:00:00").toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})}{q.scheduled_time && " · "+q.scheduled_time}</div>
              </div>
              <div style={{ color: C.accent, fontWeight: 700 }}>${q.final_price || q.estimated_min}</div>
            </div>
          ))}
        </div>

      </div>
    </NavLayout>
  );
}
