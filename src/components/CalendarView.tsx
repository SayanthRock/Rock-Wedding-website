import React, { useState } from "react";
import { Wedding } from "../types/premium";
import { Calendar, ChevronLeft, ChevronRight, MapPin, Clock, Sparkles } from "lucide-react";

interface CalendarViewProps {
  weddings: Wedding[];
  onSelectEvent: (wedding: Wedding) => void;
}

export default function CalendarView({ weddings, onSelectEvent }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 4, 1)); // May 2025 as default event month

  const changeMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const copy = new Date(prev);
      if (direction === "prev") {
        copy.setMonth(copy.getMonth() - 1);
      } else {
        copy.setMonth(copy.getMonth() + 1);
      }
      return copy;
    });
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get days in month
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const daysArray = Array.from({ length: totalDays }, (_, i) => i + 1);
  const paddingArray = Array.from({ length: firstDayIndex }, (_, i) => null);
  const calendarIntervals = [...paddingArray, ...daysArray];

  // Helper check if date has an event
  const getEventsForDate = (day: number) => {
    const formattedStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return weddings.filter((w) => w.date === formattedStr);
  };

  return (
    <div className="premier-card p-6 md:p-8 space-y-8 animate-fade-in text-left max-w-4xl mx-auto">
      {/* Header banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-3xl font-serif italic text-stone-900 dark:text-white">Temporal Archives</h3>
          <p className="text-stone-400 text-xs font-bold uppercase tracking-widest mt-1">Navigate scheduled sacred moments.</p>
        </div>

        <div className="flex items-center gap-2 bg-stone-100 dark:bg-stone-800 p-1.5 rounded-2xl">
          <button 
            onClick={() => changeMonth("prev")} 
            className="p-2 hover:bg-white dark:hover:bg-stone-700 rounded-xl transition-all text-stone-600 dark:text-stone-300"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <span className="px-4 text-xs font-bold uppercase tracking-widest text-stone-700 dark:text-stone-300 min-w-[100px] text-center">
            {monthNames[month]} {year}
          </span>

          <button 
            onClick={() => changeMonth("next")} 
            className="p-2 hover:bg-white dark:hover:bg-stone-700 rounded-xl transition-all text-stone-600 dark:text-stone-300"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-7 gap-1 text-center font-mono text-[9px] font-bold uppercase tracking-widest text-stone-400">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="py-2">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarIntervals.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="aspect-square bg-stone-50/20 dark:bg-stone-900/10 rounded-xl opacity-20" />;
              }

              const events = getEventsForDate(day);
              const hasEvents = events.length > 0;

              return (
                <div 
                  key={`day-${day}`}
                  onClick={() => hasEvents && onSelectEvent(events[0])}
                  className={`aspect-square p-2 rounded-2xl flex flex-col justify-between transition-all relative group shadow-sm ${
                    hasEvents 
                      ? "bg-sand-primary text-white font-bold cursor-pointer hover:scale-105 active:scale-95" 
                      : "bg-white/40 dark:bg-stone-900/30 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-950 dark:text-stone-200 border border-stone-100/40 dark:border-white/5"
                  }`}
                  style={{
                    backgroundColor: hasEvents ? "var(--sand-primary)" : undefined
                  }}
                >
                  <span className="text-xs transition-colors">{day}</span>
                  {hasEvents && (
                    <div className="flex flex-col items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 hidden group-hover:block bg-stone-900 dark:bg-white text-white dark:text-stone-900 text-[9px] font-bold uppercase tracking-wider py-1.5 px-3 rounded-lg z-20 whitespace-nowrap shadow-xl">
                        {events.map(e => e.name).join(", ")}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Featured list */}
        <div className="space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-stone-400">Agenda For May 2025</h4>
            
            <div className="space-y-3">
              {weddings.map((w, i) => (
                <div 
                  key={w.id} 
                  onClick={() => onSelectEvent(w)}
                  className="premier-card p-4 hover:shadow-md cursor-pointer hover:border-sand-primary bg-white/60 dark:bg-stone-900/40 relative group overflow-hidden border border-stone-100/40 dark:border-white/5"
                >
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-xl bg-sand-soft text-sand-primary flex flex-col items-center justify-center font-mono shrink-0">
                      <span className="text-[8px] font-bold uppercase">MAY</span>
                      <span className="text-xs font-bold leading-none">{w.date.split("-")[2] || "25"}</span>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-serif font-bold text-stone-900 dark:text-white line-clamp-1">{w.name}</p>
                      <div className="flex items-center gap-1.5 text-[9px] text-stone-500">
                        <MapPin className="w-3 h-3 text-stone-400" />
                        <span>The Grand Palace, Jaipur</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-sand-soft/50 dark:bg-stone-900/30 border border-sand-primary/20 rounded-[2rem] p-5 space-y-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-sand-primary/10 rounded-full blur-xl pointer-events-none" />
            <Sparkles className="w-5 h-5 text-sand-primary animate-pulse" />
            <p className="text-stone-800 dark:text-stone-300 text-xs font-bold uppercase tracking-wider">Aesthetic Scheduling</p>
            <p className="text-stone-500 dark:text-stone-400 text-[10px] leading-relaxed italic mt-1">"Select any highlighted event date on the coordinate matrix to open its real-time planning and photo gallery suite immediately."</p>
          </div>
        </div>
      </div>
    </div>
  );
}
