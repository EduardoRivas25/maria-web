import { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus, X, MapPin, Clock, Loader2, AlertCircle } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import { calendarApi } from "@/lib/api/calendar";
import { isGoogleConnected } from "@/lib/google-auth";
import GoogleConnectPrompt from "@/components/GoogleConnectPrompt";

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState("month");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [needsGoogle, setNeedsGoogle] = useState(!isGoogleConnected());

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(monthStart);
      const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
      const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

      const rawEvents = await calendarApi.listEvents({
        timeMin: calStart.toISOString(),
        timeMax: calEnd.toISOString(),
        maxResults: 200,
      });

      // Map Google Calendar events to frontend format
      const formattedEvents = rawEvents.map(e => {
        const start = e.start?.dateTime ? new Date(e.start.dateTime) : (e.start?.date ? new Date(e.start.date) : new Date());
        const end = e.end?.dateTime ? new Date(e.end.dateTime) : (e.end?.date ? new Date(e.end.date) : new Date());
        return {
          id: e.id,
          title: e.summary || '(Sin título)',
          description: e.description,
          location: e.location,
          start,
          end,
          color: e.colorId ? '#f99e02' : '#3b82f6', // Just an example color mapping
          isAllDay: !!e.start?.date
        };
      });

      setEvents(formattedEvents);
    } catch (err) {
      console.error("[Calendar] Error loading events:", err);
      if (err.message === 'NO_GOOGLE_TOKEN') {
        setNeedsGoogle(true);
      } else {
        setError('Error al cargar los eventos del calendario.');
      }
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    if (!needsGoogle) fetchEvents();
  }, [fetchEvents, needsGoogle]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = useMemo(() => {
    const days = [];
    let day = calStart;
    while (day <= calEnd) { days.push(new Date(day)); day = addDays(day, 1); }
    return days;
  }, [calStart, calEnd]);

  const getEventsForDay = (day) => events.filter((e) => isSameDay(e.start, day));
  const dayNames = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  const selectedDayEvents = getEventsForDay(selectedDate);
  const upcomingEvents = events.filter(e => e.start >= new Date()).sort((a,b) => a.start - b.start);

  return (
    <div className="max-w-[1400px]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <h2 className="text-xl md:text-2xl font-bold text-white capitalize">
            {format(currentDate, "MMMM yyyy", { locale: es })}
          </h2>
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-all bg-transparent border-none cursor-pointer">
              <ChevronLeft size={18} />
            </button>
            <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 rounded-xl text-xs font-medium text-white/50 hover:text-white hover:bg-white/5 transition-all bg-transparent border-none cursor-pointer">Hoy</button>
            <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-all bg-transparent border-none cursor-pointer">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-white/[0.03] border border-white/[0.06] rounded-xl p-1 overflow-x-auto w-full md:w-auto hide-scrollbar">
          {["day", "week", "month", "agenda"].map((v) => (
            <button key={v} onClick={() => setView(v)} className={`px-3 py-1.5 flex-1 md:flex-none rounded-lg text-xs font-medium transition-all border-none cursor-pointer ${view === v ? "bg-[#f99e02]/15 text-[#f99e02]" : "text-white/40 hover:text-white/70 bg-transparent"}`}>
              {v === "day" ? "Día" : v === "week" ? "Semana" : v === "month" ? "Mes" : "Agenda"}
            </button>
          ))}
        </div>
      </div>

      {needsGoogle ? (
        <div className="py-10">
          <GoogleConnectPrompt
            serviceName="Google Calendar"
            onConnected={() => { setNeedsGoogle(false); setLoading(true); fetchEvents(); }}
          />
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
          <AlertCircle size={32} className="text-red-400 mb-3" />
          <p className="text-red-400 font-medium mb-1">No se pudo cargar el calendario</p>
          <p className="text-sm text-red-400/70">{error}</p>
        </div>
      ) : loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={32} className="text-[#f99e02] animate-spin mb-4" />
          <p className="text-white/40 text-sm">Cargando eventos de Google Calendar...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
          {/* Calendar Grid */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-3 md:p-5 overflow-x-auto hide-scrollbar">
            <div className="min-w-[500px]">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map((d) => (
                <div key={d} className="text-center text-xs font-medium text-white/30 py-2">{d}</div>
              ))}
            </div>
            {/* Day cells */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, i) => {
                const dayEvents = getEventsForDay(day);
                const isToday = isSameDay(day, new Date());
                const isSelected = isSameDay(day, selectedDate);
                const isCurrentMonth = isSameMonth(day, currentDate);
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(day)}
                    className={`relative p-2 rounded-xl text-left min-h-[80px] transition-all duration-200 border-none cursor-pointer
                      ${isSelected ? "bg-[#f99e02]/10 border border-[#f99e02]/30" : "hover:bg-white/[0.03]"}
                      ${!isCurrentMonth ? "opacity-30" : ""}
                    `}
                    style={{ background: isSelected ? "rgba(249,158,2,0.08)" : "transparent" }}
                  >
                    <span className={`text-xs font-medium ${isToday ? "bg-[#f99e02] text-white w-6 h-6 rounded-full flex items-center justify-center" : isSelected ? "text-[#f99e02]" : "text-white/60"}`}>
                      {format(day, "d")}
                    </span>
                    <div className="mt-1 space-y-0.5">
                      {dayEvents.slice(0, 2).map((ev) => (
                        <div key={ev.id} onClick={(e) => { e.stopPropagation(); setSelectedEvent(ev); }} className="text-[10px] px-1.5 py-0.5 rounded-md truncate cursor-pointer hover:opacity-80" style={{ background: `${ev.color}20`, color: ev.color }}>
                          {ev.isAllDay ? ev.title : `${format(ev.start, "HH:mm")} ${ev.title}`}
                        </div>
                      ))}
                      {dayEvents.length > 2 && <p className="text-[10px] text-white/30 px-1">+{dayEvents.length - 2} más</p>}
                    </div>
                  </button>
                );
              })}
            </div>
            </div>
          </motion.div>

          {/* Side Panel */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="space-y-5">
            {/* Selected Day Events */}
            <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4">
                {format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })}
              </h3>
              {selectedDayEvents.length > 0 ? (
                <div className="space-y-3">
                  {selectedDayEvents.map((ev) => (
                    <div key={ev.id} onClick={() => setSelectedEvent(ev)} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/10 cursor-pointer transition-all">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full" style={{ background: ev.color }} />
                        <h4 className="text-sm font-medium text-white/80 line-clamp-1">{ev.title}</h4>
                      </div>
                      <div className="flex items-center gap-1 text-white/30 ml-4">
                        <Clock size={11} />
                        <span className="text-xs">
                          {ev.isAllDay ? 'Todo el día' : `${format(ev.start, "HH:mm")} - ${format(ev.end, "HH:mm")}`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-white/20 text-center py-8">No hay eventos este día</p>
              )}
            </div>

            {/* Upcoming */}
            <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Próximos eventos</h3>
              <div className="space-y-3">
                {upcomingEvents.slice(0, 4).map((ev) => (
                  <div key={ev.id} className="flex items-center gap-3 cursor-pointer hover:bg-white/[0.02] p-1 -mx-1 rounded-lg transition-colors" onClick={() => setSelectedEvent(ev)}>
                    <div className="w-1 h-8 rounded-full" style={{ background: ev.color }} />
                    <div className="min-w-0">
                      <p className="text-xs text-white/70 font-medium truncate">{ev.title}</p>
                      <p className="text-[11px] text-white/30">
                        {ev.isAllDay ? format(ev.start, "dd MMM", { locale: es }) : format(ev.start, "dd MMM, HH:mm", { locale: es })}
                      </p>
                    </div>
                  </div>
                ))}
                {upcomingEvents.length === 0 && (
                  <p className="text-xs text-white/20 text-center py-4">No hay eventos próximos</p>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Event Detail Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setSelectedEvent(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-sm bg-[#141414] border border-white/10 rounded-2xl p-6 shadow-2xl mx-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 pr-4">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: selectedEvent.color }} />
                  <h2 className="text-base font-bold text-white">{selectedEvent.title}</h2>
                </div>
                <button onClick={() => setSelectedEvent(null)} className="text-white/30 hover:text-white/60 bg-transparent border-none cursor-pointer flex-shrink-0"><X size={18} /></button>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-white/50">
                  <Clock size={14} />
                  <span>
                    {selectedEvent.isAllDay 
                      ? 'Todo el día' 
                      : `${format(selectedEvent.start, "EEEE d 'de' MMM, HH:mm", { locale: es })} - ${format(selectedEvent.end, "HH:mm")}`}
                  </span>
                </div>
                {selectedEvent.location && (
                  <div className="flex items-center gap-2 text-white/50">
                    <MapPin size={14} /><span>{selectedEvent.location}</span>
                  </div>
                )}
                {selectedEvent.description && (
                  <div className="text-white/40 text-xs leading-relaxed mt-2 pt-3 border-t border-white/5 prose prose-invert prose-p:my-1 prose-a:text-[#f99e02]" dangerouslySetInnerHTML={{ __html: selectedEvent.description }} />
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
