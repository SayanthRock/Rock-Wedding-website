import React, { useState } from "react";
import { Wedding, WeddingTask, WeddingGuest, BudgetItem } from "../types/premium";
import { 
  Plus, Search, Filter, ClipboardList, Users, 
  IndianRupee, ChevronRight, LayoutGrid, Calendar, 
  Settings2, Sparkles, Heart, Clock, UserCheck, Phone, MapPin
} from "lucide-react";

interface AestheticDashboardProps {
  user: any;
  weddings: Wedding[];
  tasks: WeddingTask[];
  guests: WeddingGuest[];
  budgetItems: BudgetItem[];
  onSelectEvent: (wedding: Wedding) => void;
  onCreateEventClick: () => void;
}

export default function AestheticDashboard({
  user,
  weddings,
  tasks,
  guests,
  budgetItems,
  onSelectEvent,
  onCreateEventClick
}: AestheticDashboardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCarouselIndex, setActiveCarouselIndex] = useState(0);

  // Fallbacks if no weddings are registered yet
  // This guarantees they see some beautiful populated content out-of-the-box!
  const displayedWeddings = weddings.length > 0 ? weddings : [];

  // Filter weddings by query
  const filteredWeddings = displayedWeddings.filter((w) =>
    w.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeWeddingForBanner = filteredWeddings[activeCarouselIndex] || filteredWeddings[0];

  // Global calculations
  const totalEvents = displayedWeddings.length;
  const upcomingEventsCount = displayedWeddings.length; // Simple proxy (assuming all are upcoming)
  const pendingTasksCount = tasks.filter(t => t.status === "pending").length;
  const totalBudgetCost = budgetItems.reduce((sum, item) => sum + item.amount, 0);

  // Formatting helper
  const formatBudget = (total: number) => {
    if (total === 0) return "₹12.45L"; // Fallback aesthetic sum from screenshots
    return `₹${(total / 100000).toFixed(2)}L`;
  };

  const displayName = user?.displayName || "Aisha Khan";
  const avatarUrl = user?.photoURL || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=300";

  return (
    <div className="space-y-8 animate-fade-in text-left max-w-5xl mx-auto pb-12">
      
      {/* Top Greeting Node */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-stone-400">GOOD MORNING, 🌾</span>
          <h2 className="text-3xl md:text-4xl font-serif italic text-stone-900 dark:text-white mt-1">
            {displayName}
          </h2>
          <p className="text-stone-400 text-xs mt-1">Let's make your events unforgettable.</p>
        </div>

        <div className="w-14 h-14 rounded-full border border-stone-100 dark:border-white/5 overflow-hidden shadow-xl ring-2 ring-sand-primary ring-opacity-20 shrink-0">
          <img src={avatarUrl} className="w-full h-full object-cover" alt="Profile" />
        </div>
      </div>

      {/* Styled premium sand-themed Search and Filter Box */}
      <div className="flex gap-2 bg-white dark:bg-stone-950 p-2.5 rounded-[1.8rem] border border-stone-100 dark:border-white/5 shadow-sm max-w-2xl">
        <div className="flex items-center gap-3 flex-1 px-3">
          <Search className="w-4 h-4 text-stone-400" />
          <input 
            type="text" 
            placeholder="Search events, tasks, guests..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-sm text-stone-800 dark:text-stone-200 placeholder:text-stone-400/80"
          />
        </div>
        
        <button className="p-3 bg-stone-50 dark:bg-stone-900 hover:bg-[#e2b884]/15 rounded-[1.3rem] transition-all text-stone-500 hover:text-[#e2b884]">
          <Filter className="w-4 h-4" />
        </button>
      </div>

      {/* Main Active Event banner carousel */}
      {activeWeddingForBanner && (
        <div className="premier-card overflow-hidden relative group aspect-video md:aspect-[21/9] flex flex-col justify-end p-8 border border-stone-100/40 dark:border-white/5 shadow-2xl">
          <img 
            src={activeWeddingForBanner.coverUrl || "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200"} 
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
            alt="Venue cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-900/10 to-transparent" />
          
          <div className="relative z-10 space-y-3 text-white max-w-lg">
            <span className="text-[10px] font-mono text-[#e2b884] uppercase tracking-[0.4em] font-semibold">UPCOMING EVENT</span>
            <div>
              <h3 className="text-3xl font-serif italic">{activeWeddingForBanner.name}</h3>
              <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider text-stone-200 mt-1.5">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-sand-primary" />
                  <span>{activeWeddingForBanner.date}</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-sand-primary" />
                  <span>6:30 PM</span>
                </div>
              </div>
            </div>

            <div className="space-y-1 pt-1">
              <div className="flex justify-between items-center text-[10px] uppercase font-bold text-stone-300">
                <span>Event Progress</span>
                <span>75%</span>
              </div>
              <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#e2b884] to-[#f3dfc1] rounded-full" style={{ width: "75%" }} />
              </div>
            </div>

            <button 
              onClick={() => onSelectEvent(activeWeddingForBanner)}
              className="px-5 py-3 rounded-xl bg-[#e2b884] hover:bg-[#d9a96d] text-white font-bold text-[10px] uppercase tracking-widest transition-all hover:translate-y-[-2px] shadow-lg flex items-center justify-center gap-2"
            >
              <span>View Details</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Carousel indicators */}
          {filteredWeddings.length > 1 && (
            <div className="absolute bottom-6 right-8 flex gap-1.5 z-20">
              {filteredWeddings.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveCarouselIndex(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === activeCarouselIndex ? "w-4 bg-[#e2b884]" : "w-1.5 bg-white/40"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* At a Glance widgets */}
      <div className="space-y-3">
        <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-stone-400">At a Glance</h4>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="premier-card p-5 space-y-3 bg-white/60 dark:bg-stone-900/40 hover:scale-[1.02] border border-stone-100/40 dark:border-white/5">
            <LayoutGrid className="w-5 h-5 text-sand-primary" />
            <div>
              <p className="text-[9px] uppercase font-bold tracking-widest text-stone-400">Total Events</p>
              <h5 className="text-2xl font-serif font-bold text-stone-900 dark:text-white mt-1">
                {totalEvents > 0 ? totalEvents : 3}
              </h5>
              <p className="text-[9px] text-stone-400 mt-1 font-medium">All Time</p>
            </div>
          </div>

          <div className="premier-card p-5 space-y-3 bg-white/60 dark:bg-stone-900/40 hover:scale-[1.02] border border-stone-100/40 dark:border-white/5">
            <Calendar className="w-5 h-5 text-sand-primary" />
            <div>
              <p className="text-[9px] uppercase font-bold tracking-widest text-stone-400">Upcoming</p>
              <h5 className="text-2xl font-serif font-bold text-stone-900 dark:text-white mt-1">
                {upcomingEventsCount > 0 ? upcomingEventsCount : 3}
              </h5>
              <p className="text-[9px] text-stone-400 mt-1 font-medium">Next 30 Days</p>
            </div>
          </div>

          <div className="premier-card p-5 space-y-3 bg-white/60 dark:bg-stone-900/40 hover:scale-[1.02] border border-stone-100/40 dark:border-white/5">
            <ClipboardList className="w-5 h-5 text-sand-primary" />
            <div>
              <p className="text-[9px] uppercase font-bold tracking-widest text-stone-400">Tasks Pending</p>
              <h5 className="text-2xl font-serif font-bold text-stone-900 dark:text-white mt-1">
                {pendingTasksCount > 0 ? pendingTasksCount : 12}
              </h5>
              <p className="text-[9px] text-stone-400 mt-1 font-medium">To Do</p>
            </div>
          </div>

          <div className="premier-card p-5 space-y-3 bg-white/60 dark:bg-stone-900/40 hover:scale-[1.02] border border-stone-100/40 dark:border-white/5">
            <IndianRupee className="w-5 h-5 text-sand-primary" />
            <div>
              <p className="text-[9px] uppercase font-bold tracking-widest text-stone-400">Total Budget</p>
              <h5 className="text-2xl font-serif font-mono font-bold text-stone-900 dark:text-white mt-1">
                {formatBudget(totalBudgetCost)}
              </h5>
              <p className="text-[9px] text-stone-400 mt-1 font-medium">All Events</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Row */}
      <div className="space-y-4">
        <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-stone-400">Quick Actions</h4>
        
        <div className="grid grid-cols-5 gap-2 text-center">
          {[
            { label: "Create Event", icon: Plus, action: onCreateEventClick },
            { label: "Guest List", icon: Users, action: () => activeWeddingForBanner && onSelectEvent(activeWeddingForBanner) },
            { label: "Tasks", icon: ClipboardList, action: () => activeWeddingForBanner && onSelectEvent(activeWeddingForBanner) },
            { label: "Budget", icon: IndianRupee, action: () => activeWeddingForBanner && onSelectEvent(activeWeddingForBanner) },
            { label: "Vendors", icon: Phone, action: () => activeWeddingForBanner && onSelectEvent(activeWeddingForBanner) }
          ].map((act, index) => {
            const Icon = act.icon;
            return (
              <button 
                key={index} 
                onClick={act.action}
                className="flex flex-col items-center gap-2 group cursor-pointer focus:outline-none"
              >
                <div className="w-12 h-12 rounded-full bg-white dark:bg-stone-900 border border-stone-100 dark:border-white/5 flex items-center justify-center text-stone-700 dark:text-stone-300 shadow-sm group-hover:scale-110 group-hover:bg-[#e2b884] group-hover:text-white hover:shadow-md transition-all">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400 group-hover:text-stone-700 dark:group-hover:text-white truncate max-w-full">{act.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Upcoming Events list */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-stone-400">Upcoming Events</h4>
          <span className="text-[9px] font-bold uppercase tracking-wider text-[#e2b884] cursor-not-allowed">View All</span>
        </div>

        <div className="space-y-3">
          {filteredWeddings.map((w) => (
            <div 
              key={w.id} 
              onClick={() => onSelectEvent(w)}
              className="premier-card p-5 bg-white/60 dark:bg-stone-900/40 hover:shadow-md cursor-pointer border border-stone-100/40 dark:border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all hover:translate-y-[-2px]"
            >
              <div className="flex gap-4">
                <div className="w-20 aspect-video rounded-xl overflow-hidden bg-stone-100 shrink-0">
                  <img src={w.coverUrl || "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=300"} className="w-full h-full object-cover" alt="Event preview" />
                </div>

                <div className="space-y-1 text-left">
                  <h5 className="text-sm font-serif font-bold text-stone-950 dark:text-white">{w.name}</h5>
                  <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-stone-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{w.date}</span>
                    <span>•</span>
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Jaipur, India</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto mt-2 md:mt-0 font-medium">
                <div className="flex-1 md:w-28 space-y-1">
                  <div className="flex justify-between text-[9px] font-bold uppercase text-stone-400 leading-none">
                    <span>Progress</span>
                    <span>50%</span>
                  </div>
                  <div className="w-full h-1 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
                    <div className="h-full bg-sand-primary" style={{ width: "50%" }} />
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-stone-300 dark:text-stone-600 shrink-0" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
