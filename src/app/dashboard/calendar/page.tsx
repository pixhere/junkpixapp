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
  bg:"#0F172A", card:"#1E2937", surface:"#162032", border:"#2D3748",
  accent:"#00D4C8", accentDim:"rgba(0,212,200,0.1)", text:"#F1F5F9",
  muted:"#94A3B8", green:"#22c55e", red:"#ef4444", yellow:"#F59E0B",
};

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

export default function CalendarPage() {
  const router = useRouter();
  const [operator, setOperator] = useState<any>(null);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string|null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showScheduleJob, setShowScheduleJob] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  const [newEvent, setNewEvent] = useState({ title:"", time:"", type:"manual", notes:"" });
  const [saving, setSaving] = useState(false);
  const [unscheduledQuotes, setUnscheduledQuotes] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data: op } = await supabase.from("operators").select("*").eq("id", user.id).single();
      if (op) setOperator(op);

      // Load scheduled quotes
      const { data: qs } = await supabase.from("quote_requests").select("*")
        .eq("operator_id", user.id)
        .not("scheduled_date", "is", null);
      if (qs) setQuotes(qs);

      // Load unscheduled booked quotes
      const { data: unsch } = await supabase.from("quote_requests").select("*")
        .eq("operator_id", user.id)
        .eq("status", "booked")
        .is("scheduled_date", null);
      if (unsch) setUnscheduledQuotes(unsch);

      // Load calendar events
      const { data: evs } = await supabase.from("calendar_events").select("*")
        .eq("operator_id", user.id)
        .order("date");
      if (evs) setEvents(evs);
    };
    load();
  }, []);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = new Date().toISOString().split("T")[0];

  const getDateStr = (day: number) =>
    `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;

  const getJobsForDay = (day: number) => {
    const dateStr = getDateStr(day);
    return quotes.filter(q => q.scheduled_date === dateStr);
  };

  const getEventsForDay = (day: number) => {
    const dateStr = getDateStr(day);
    return events.filter(e => e.date === dateStr);
  };

  const selectedJobs = selectedDate ? quotes.filter(q => q.scheduled_date === selectedDate) : [];
  const selectedEvents = selectedDate ? events.filter(e => e.date === selectedDate) : [];

  const addEvent = async () => {
    if (!newEvent.title || !selectedDate || !operator) return;
    setSaving(true);
    const { data } = await supabase.from("calendar_events").insert({
      operator_id: operator.id,
      title: newEvent.title,
      date: selectedDate,
      time: newEvent.time || null,
      type: newEvent.type,
      notes: newEvent.notes || null,
    }).select().single();
    if (data) setEvents(prev => [...prev, data]);
    setNewEvent({ title:"", time:"", type:"manual", notes:"" });
    setShowAddEvent(false);
    setSaving(false);
  };

  const deleteEvent = async (eventId: string) => {
    await supabase.from("calendar_events").delete().eq("id", eventId);
    setEvents(prev => prev.filter(e => e.id !== eventId));
  };

  const scheduleJob = async (quoteId: string, date: string, time: string) => {
    await supabase.from("quote_requests").update({ scheduled_date: date, scheduled_time: time || null }).eq("id", quoteId);
    const quote = unscheduledQuotes.find(q => q.id === quoteId);
    if (quote) {
      setQuotes(prev => [...prev, { ...quote, scheduled_date: date, scheduled_time: time }]);
      setUnscheduledQuotes(prev => prev.filter(q => q.id !== quoteId));
    }
    setShowScheduleJob(false);
    setSelectedQuote(null);
  };

  const unscheduleJob = async (quoteId: string) => {
    await supabase.from("quote_requests").update({ scheduled_date: null, scheduled_time: null }).eq("id", quoteId);
    const quote = quotes.find(q => q.id === quoteId);
    if (quote) {
      setUnscheduledQuotes(prev => [...prev, { ...quote, scheduled_date: null }]);
      setQuotes(prev => prev.filter(q => q.id !== quoteId));
    }
  };

  const eventTypeColor = (type: string) => {
    if (type === "blocked") return C.red;
    if (type === "non_junkpix") return C.yellow;
    return C.muted;
  };

  const eventTypeIcon = (type: string) => {
    if (type === "blocked") return "🚫";
    if (type === "non_junkpix") return "📦";
    return "📌";
  };

  return (
    <NavLayout active="calendar">
      <div style={{ padding:24, maxWidth:800, margin:"0 auto" }}>

        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
          <div style={{ fontSize:"1.4rem", fontWeight:800, color:C.text }}>📅 Calendar</div>
        </div>

        {/* Unscheduled booked jobs */}
        {unscheduledQuotes.length > 0 && (
          <div style={{ background:"rgba(245,158,11,0.08)", border:"1px solid rgba(245,158,11,0.3)", borderRadius:12, padding:16, marginBottom:20 }}>
            <div style={{ fontSize:".72rem", color:C.yellow, fontFamily:"monospace", fontWeight:700, marginBottom:10 }}>⚠️ BOOKED JOBS NEEDING A DATE ({unscheduledQuotes.length})</div>
            <div style={{ display:"flex", flexDirection:"column" as const, gap:8 }}>
              {unscheduledQuotes.map(q => (
                <div key={q.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", background:C.card, borderRadius:8, padding:"10px 14px" }}>
                  <div>
                    <div style={{ fontWeight:600, color:C.text, fontSize:".88rem" }}>{q.customer_name}</div>
                    <div style={{ fontSize:".72rem", color:C.muted }}>{q.customer_address}</div>
                  </div>
                  <button onClick={() => { setSelectedQuote(q); setShowScheduleJob(true); setSelectedDate(selectedDate || todayStr); }}
                    style={{ padding:"7px 14px", borderRadius:8, border:"none", background:C.accent, color:"#000", fontWeight:700, cursor:"pointer", fontSize:".78rem" }}>
                    Schedule →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Calendar grid */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, overflow:"hidden", marginBottom:20 }}>
          {/* Month nav */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"16px 20px", borderBottom:`1px solid ${C.border}` }}>
            <button onClick={() => setCurrentMonth(new Date(year, month-1))} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:8, color:C.muted, cursor:"pointer", padding:"6px 12px" }}>←</button>
            <div style={{ fontWeight:700, color:C.text }}>{MONTHS[month]} {year}</div>
            <button onClick={() => setCurrentMonth(new Date(year, month+1))} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:8, color:C.muted, cursor:"pointer", padding:"6px 12px" }}>→</button>
          </div>

          {/* Day headers */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", borderBottom:`1px solid ${C.border}` }}>
            {DAYS.map(d => (
              <div key={d} style={{ padding:"8px 4px", textAlign:"center" as const, fontSize:".65rem", color:C.muted, fontWeight:600 }}>{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)" }}>
            {Array.from({ length: firstDay }).map((_,i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_,i) => {
              const day = i+1;
              const dateStr = getDateStr(day);
              const jobs = getJobsForDay(day);
              const dayEvents = getEventsForDay(day);
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;
              const isBlocked = dayEvents.some(e => e.type === "blocked");
              return (
                <div key={day} className="jp-card-hover" onClick={() => setSelectedDate(dateStr === selectedDate ? null : dateStr)}
                  style={{ padding:"6px 4px", minHeight:60, borderRight:`1px solid ${C.border}`, borderBottom:`1px solid ${C.border}`, cursor:"pointer",
                    background: isSelected ? C.accentDim : isBlocked ? "rgba(239,68,68,0.05)" : isToday ? "rgba(255,255,255,0.03)" : "transparent",
                    border: isSelected ? `1px solid ${C.accent}` : "none" }}>
                  <div style={{ fontSize:".78rem", fontWeight: isToday ? 800 : 400, color: isToday ? C.accent : isBlocked ? C.red : C.text, textAlign:"center" as const, marginBottom:2 }}>{day}</div>
                  {jobs.slice(0,2).map((j,idx) => (
                    <div key={idx} style={{ fontSize:".58rem", background:"rgba(0,212,200,0.15)", color:C.accent, borderRadius:3, padding:"1px 4px", marginBottom:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" as const }}>
                      {j.customer_name?.split(" ")[0]}
                    </div>
                  ))}
                  {dayEvents.slice(0,2).map((e,idx) => (
                    <div key={idx} style={{ fontSize:".58rem", background: e.type === "blocked" ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.15)", color: e.type === "blocked" ? C.red : C.yellow, borderRadius:3, padding:"1px 4px", marginBottom:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" as const }}>
                      {e.title}
                    </div>
                  ))}
                  {(jobs.length + dayEvents.length) > 2 && <div style={{ fontSize:".55rem", color:C.muted, textAlign:"center" as const }}>+{jobs.length + dayEvents.length - 2}</div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected day panel */}
        {selectedDate && (
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:20, marginBottom:16 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <div style={{ fontWeight:700, color:C.text }}>
                {new Date(selectedDate+"T12:00:00").toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={() => setShowAddEvent(true)}
                  style={{ padding:"7px 14px", borderRadius:8, border:`1px solid ${C.border}`, background:"transparent", color:C.text, cursor:"pointer", fontSize:".78rem", fontWeight:600 }}>
                  + Add Event
                </button>
                <button onClick={() => { setShowScheduleJob(true); }}
                  style={{ padding:"7px 14px", borderRadius:8, border:"none", background:C.accent, color:"#000", cursor:"pointer", fontSize:".78rem", fontWeight:700 }}>
                  + Schedule Job
                </button>
              </div>
            </div>

            {/* Jobs this day */}
            {selectedJobs.length === 0 && selectedEvents.length === 0 && (
              <div style={{ color:C.muted, fontSize:".84rem", textAlign:"center" as const, padding:"20px 0" }}>Nothing scheduled. Add an event or schedule a job.</div>
            )}

            {selectedJobs.map(job => (
              <div key={job.id} style={{ background:C.surface, borderRadius:10, padding:16, marginBottom:10, border:`1px solid ${C.border}` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                  <div>
                    <div style={{ fontWeight:700, color:C.text, marginBottom:2 }}>🚛 {job.customer_name}</div>
                    <div style={{ fontSize:".78rem", color:C.muted }}>{job.customer_address}</div>
                    {job.scheduled_time && <div style={{ fontSize:".78rem", color:C.accent, marginTop:2 }}>⏰ {job.scheduled_time}</div>}
                    {job.final_price && <div style={{ fontSize:".84rem", color:C.green, fontWeight:700, marginTop:4 }}>${job.final_price}</div>}
                  </div>
                  <div style={{ display:"flex", gap:6 }}>
                    <button onClick={() => router.push(`/dashboard/quote/${job.id}`)}
                      style={{ padding:"6px 12px", borderRadius:6, border:`1px solid ${C.border}`, background:"transparent", color:C.muted, cursor:"pointer", fontSize:".72rem" }}>
                      View
                    </button>
                    <button onClick={() => unscheduleJob(job.id)}
                      style={{ padding:"6px 12px", borderRadius:6, border:`1px solid ${C.red}`, background:"transparent", color:C.red, cursor:"pointer", fontSize:".72rem" }}>
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {selectedEvents.map(event => (
              <div key={event.id} style={{ background:C.surface, borderRadius:10, padding:16, marginBottom:10, border:`1px solid ${eventTypeColor(event.type)}33` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                  <div>
                    <div style={{ fontWeight:700, color:C.text, marginBottom:2 }}>{eventTypeIcon(event.type)} {event.title}</div>
                    {event.time && <div style={{ fontSize:".78rem", color:C.accent }}>⏰ {event.time}</div>}
                    {event.notes && <div style={{ fontSize:".78rem", color:C.muted, marginTop:4 }}>{event.notes}</div>}
                  </div>
                  <button onClick={() => deleteEvent(event.id)}
                    style={{ padding:"6px 12px", borderRadius:6, border:`1px solid ${C.red}`, background:"transparent", color:C.red, cursor:"pointer", fontSize:".72rem" }}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Event Modal */}
        {showAddEvent && selectedDate && (
          <div style={{ position:"fixed" as const, inset:0, background:"rgba(0,0,0,0.7)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:24, width:"100%", maxWidth:440 }}>
              <div style={{ fontWeight:800, color:C.text, marginBottom:4 }}>Add Event</div>
              <div style={{ fontSize:".78rem", color:C.muted, marginBottom:20 }}>
                {new Date(selectedDate+"T12:00:00").toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}
              </div>

              <div style={{ display:"flex", gap:8, marginBottom:16 }}>
                {[
                  { v:"manual", l:"📌 Note" },
                  { v:"blocked", l:"🚫 Day Off" },
                  { v:"non_junkpix", l:"📦 Other Job" },
                ].map(t => (
                  <button key={t.v} onClick={() => setNewEvent(p => ({...p, type:t.v}))}
                    style={{ flex:1, padding:"8px", borderRadius:8, border:`1px solid ${newEvent.type === t.v ? C.accent : C.border}`, background: newEvent.type === t.v ? C.accentDim : "transparent", color: newEvent.type === t.v ? C.accent : C.muted, cursor:"pointer", fontSize:".75rem", fontWeight: newEvent.type === t.v ? 700 : 400 }}>
                    {t.l}
                  </button>
                ))}
              </div>

              <input value={newEvent.title} onChange={e => setNewEvent(p => ({...p, title:e.target.value}))}
                placeholder={newEvent.type === "blocked" ? "e.g. Day Off" : newEvent.type === "non_junkpix" ? "Job description" : "Event title"}
                style={{ width:"100%", padding:"11px 14px", borderRadius:8, border:`1px solid ${C.border}`, background:C.surface, color:C.text, fontSize:".88rem", outline:"none", marginBottom:12, boxSizing:"border-box" as const }} />

              <input value={newEvent.time} onChange={e => setNewEvent(p => ({...p, time:e.target.value}))}
                placeholder="Time (optional) e.g. 9:00 AM"
                style={{ width:"100%", padding:"11px 14px", borderRadius:8, border:`1px solid ${C.border}`, background:C.surface, color:C.text, fontSize:".88rem", outline:"none", marginBottom:12, boxSizing:"border-box" as const }} />

              <input value={newEvent.notes} onChange={e => setNewEvent(p => ({...p, notes:e.target.value}))}
                placeholder="Notes (optional)"
                style={{ width:"100%", padding:"11px 14px", borderRadius:8, border:`1px solid ${C.border}`, background:C.surface, color:C.text, fontSize:".88rem", outline:"none", marginBottom:16, boxSizing:"border-box" as const }} />

              <div style={{ display:"flex", gap:8 }}>
                <button onClick={() => setShowAddEvent(false)}
                  style={{ flex:1, padding:"11px", borderRadius:8, border:`1px solid ${C.border}`, background:"transparent", color:C.muted, cursor:"pointer", fontWeight:600 }}>
                  Cancel
                </button>
                <button onClick={addEvent} disabled={!newEvent.title || saving}
                  style={{ flex:1, padding:"11px", borderRadius:8, border:"none", background: newEvent.title ? C.accent : "#333", color: newEvent.title ? "#000" : C.muted, cursor: newEvent.title ? "pointer" : "not-allowed", fontWeight:700 }}>
                  {saving ? "Saving..." : "Add Event"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Schedule Job Modal */}
        {showScheduleJob && (
          <div style={{ position:"fixed" as const, inset:0, background:"rgba(0,0,0,0.7)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:24, width:"100%", maxWidth:440 }}>
              <div style={{ fontWeight:800, color:C.text, marginBottom:16 }}>Schedule a Job</div>

              {!selectedQuote ? (
                <>
                  <div style={{ fontSize:".78rem", color:C.muted, marginBottom:12 }}>Select a booked job to schedule:</div>
                  {unscheduledQuotes.length === 0 ? (
                    <div style={{ color:C.muted, fontSize:".84rem", textAlign:"center" as const, padding:"20px 0" }}>No unscheduled booked jobs.</div>
                  ) : (
                    <div style={{ display:"flex", flexDirection:"column" as const, gap:8, marginBottom:16 }}>
                      {unscheduledQuotes.map(q => (
                        <button key={q.id} onClick={() => setSelectedQuote(q)}
                          style={{ padding:"12px", borderRadius:8, border:`1px solid ${C.border}`, background:C.surface, color:C.text, cursor:"pointer", textAlign:"left" as const }}>
                          <div style={{ fontWeight:600 }}>{q.customer_name}</div>
                          <div style={{ fontSize:".75rem", color:C.muted }}>{q.customer_address}</div>
                        </button>
                      ))}
                    </div>
                  )}
                  <button onClick={() => setShowScheduleJob(false)}
                    style={{ width:"100%", padding:"11px", borderRadius:8, border:`1px solid ${C.border}`, background:"transparent", color:C.muted, cursor:"pointer" }}>
                    Cancel
                  </button>
                </>
              ) : (
                <ScheduleJobForm
                  quote={selectedQuote}
                  defaultDate={selectedDate || todayStr}
                  onSchedule={scheduleJob}
                  onCancel={() => { setSelectedQuote(null); setShowScheduleJob(false); }}
                  C={C}
                />
              )}
            </div>
          </div>
        )}

      </div>
    </NavLayout>
  );
}

function ScheduleJobForm({ quote, defaultDate, onSchedule, onCancel, C }: any) {
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState("");

  return (
    <div>
      <div style={{ background:C.surface, borderRadius:8, padding:12, marginBottom:16 }}>
        <div style={{ fontWeight:600, color:C.text }}>{quote.customer_name}</div>
        <div style={{ fontSize:".75rem", color:C.muted }}>{quote.customer_address}</div>
        {quote.final_price && <div style={{ color:C.green, fontWeight:700, marginTop:4 }}>${quote.final_price}</div>}
      </div>

      <div style={{ marginBottom:12 }}>
        <label style={{ fontSize:".72rem", color:C.muted, display:"block", marginBottom:6 }}>JOB DATE</label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          style={{ width:"100%", padding:"11px 14px", borderRadius:8, border:`1px solid ${C.border}`, background:C.surface, color:C.text, fontSize:".88rem", outline:"none", boxSizing:"border-box" as const }} />
      </div>

      <div style={{ marginBottom:16 }}>
        <label style={{ fontSize:".72rem", color:C.muted, display:"block", marginBottom:6 }}>TIME (OPTIONAL)</label>
        <input value={time} onChange={e => setTime(e.target.value)} placeholder="e.g. 9:00 AM"
          style={{ width:"100%", padding:"11px 14px", borderRadius:8, border:`1px solid ${C.border}`, background:C.surface, color:C.text, fontSize:".88rem", outline:"none", boxSizing:"border-box" as const }} />
      </div>

      <div style={{ display:"flex", gap:8 }}>
        <button onClick={onCancel}
          style={{ flex:1, padding:"11px", borderRadius:8, border:`1px solid ${C.border}`, background:"transparent", color:C.muted, cursor:"pointer" }}>
          Cancel
        </button>
        <button onClick={() => onSchedule(quote.id, date, time)} disabled={!date}
          style={{ flex:1, padding:"11px", borderRadius:8, border:"none", background:date ? C.accent : "#333", color:date ? "#000" : C.muted, cursor:date ? "pointer" : "not-allowed", fontWeight:700 }}>
          Schedule Job
        </button>
      </div>
    </div>
  );
}
