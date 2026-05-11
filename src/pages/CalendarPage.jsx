import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus, X, MapPin, Clock } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import { mockEvents } from "@/data/mockData";

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState("month");
  const [selectedEvent, setSelectedEvent] = useState(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = useMemo(() => {
    const days = [];
    let day = calStart;
    while (day <= calEnd) { days.push(new Date(day)); day = addDays(day, 1); }
    return days;
  }, [currentDate]);

  const getEventsForDay = (day) => mockEvents.filter((e) => isSameDay(e.start, day));
  const dayNames = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  const selectedDayEvents = getEventsForDay(selectedDate);

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
                        {ev.title}
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
                      <h4 className="text-sm font-medium text-white/80">{ev.title}</h4>
                    </div>
                    <div className="flex items-center gap-1 text-white/30 ml-4">
                      <Clock size={11} />
                      <span className="text-xs">
                        {format(ev.start, "HH:mm")} - {format(ev.end, "HH:mm")}
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
              {mockEvents.slice(0, 4).map((ev) => (
                <div key={ev.id} className="flex items-center gap-3">
                  <div className="w-1 h-8 rounded-full" style={{ background: ev.color }} />
                  <div className="min-w-0">
                    <p className="text-xs text-white/70 font-medium truncate">{ev.title}</p>
                    <p className="text-[11px] text-white/30">{format(ev.start, "dd MMM, HH:mm", { locale: es })}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setSelectedEvent(null)}>
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-sm bg-[#141414] border border-white/10 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ background: selectedEvent.color }} />
                <h2 className="text-base font-bold text-white">{selectedEvent.title}</h2>
              </div>
              <button onClick={() => setSelectedEvent(null)} className="text-white/30 hover:text-white/60 bg-transparent border-none cursor-pointer"><X size={18} /></button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-white/50"><Clock size={14} /><span>{format(selectedEvent.start, "HH:mm")} - {format(selectedEvent.end, "HH:mm")}</span></div>
              {selectedEvent.location && <div className="flex items-center gap-2 text-white/50"><MapPin size={14} /><span>{selectedEvent.location}</span></div>}
              {selectedEvent.description && <p className="text-white/40 text-xs leading-relaxed mt-2 pt-3 border-t border-white/5">{selectedEvent.description}</p>}
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
