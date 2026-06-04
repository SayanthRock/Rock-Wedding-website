import React, { useState } from "react";
import { Wedding, WeddingTask, WeddingGuest, BudgetItem, EventVendor } from "../types/premium";
import { 
  Calendar, MapPin, Sparkles, CheckCircle2, Circle, 
  UserPlus, UserCheck, Plus, Trash2, ArrowLeft, Phone,
  TrendingUp, IndianRupee, PieChart, Users, ClipboardList,
  FolderOpen, Settings, Share2, Clipboard, ChevronRight, MessageSquare
} from "lucide-react";
import BudgetDonutChart from "./BudgetDonutChart";
import QRCode from "react-qr-code";

interface EventDetailsConsoleProps {
  wedding: Wedding;
  tasks: WeddingTask[];
  guests: WeddingGuest[];
  budgetItems: BudgetItem[];
  vendors: EventVendor[];
  activityFeeds: { id: string; eventId: string; message: string; timestamp: string }[];
  isDark: boolean;
  
  // State changers
  onBack: () => void;
  onAddTask: (task: Omit<WeddingTask, "id">) => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onAddGuest: (guest: Omit<WeddingGuest, "id">) => void;
  onToggleGuestRSVP: (guestId: string, newRsvp: WeddingGuest["rsvp"]) => void;
  onDeleteGuest: (guestId: string) => void;
  onAddBudgetItem: (item: Omit<BudgetItem, "id">) => void;
  onDeleteBudgetItem: (itemId: string) => void;
  onAddVendor: (vendor: Omit<EventVendor, "id">) => void;
  onToggleVendorStatus: (vendorId: string) => void;
  onDeleteVendor: (vendorId: string) => void;
  onEnterGallery: () => void;
}

export default function EventDetailsConsole({
  wedding,
  tasks,
  guests,
  budgetItems,
  vendors,
  activityFeeds,
  isDark,
  onBack,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onAddGuest,
  onToggleGuestRSVP,
  onDeleteGuest,
  onAddBudgetItem,
  onDeleteBudgetItem,
  onAddVendor,
  onToggleVendorStatus,
  onDeleteVendor,
  onEnterGallery
}: EventDetailsConsoleProps) {
  const [activeTab, setActiveTab] = useState<"tasks" | "guests" | "budget" | "vendors" | "share">("tasks");
  const [copiedLink, setCopiedLink] = useState(false);

  // Form states
  const [taskTitle, setTaskTitle] = useState("");
  const [taskCat, setTaskCat] = useState<WeddingTask["category"]>("Other");
  const [taskDate, setTaskDate] = useState("");

  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestRsvp, setGuestRsvp] = useState<WeddingGuest["rsvp"]>("attending");

  const [budgetName, setBudgetName] = useState("");
  const [budgetCat, setBudgetCat] = useState<BudgetItem["category"]>("Other");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [budgetPaid, setBudgetPaid] = useState(false);

  const [vendorName, setVendorName] = useState("");
  const [vendorCat, setVendorCat] = useState<EventVendor["category"]>("Other");
  const [vendorPhone, setVendorPhone] = useState("");
  const [vendorContact, setVendorContact] = useState("");

  // Simulated calling
  const [dialingVendor, setDialingVendor] = useState<EventVendor | null>(null);

  // Filters items by wedding
  const currentWeddingTasks = tasks.filter(t => t.weddingId === wedding.id);
  const currentWeddingGuests = guests.filter(g => g.weddingId === wedding.id);
  const currentWeddingBudget = budgetItems.filter(b => b.weddingId === wedding.id);
  const currentWeddingVendors = vendors.filter(v => v.weddingId === wedding.id);
  const currentActivityFeeds = activityFeeds.filter(a => a.eventId === wedding.id);

  const completedTasksCount = currentWeddingTasks.filter(t => t.status === "completed").length;
  const totalTasksCount = currentWeddingTasks.length;
  const progressPercent = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  const totalSumBudget = currentWeddingBudget.reduce((acc, curr) => acc + curr.amount, 0);

  const shareableUrl = `${window.location.origin}${window.location.pathname}?v=${wedding.id}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareableUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="space-y-8 animate-fade-in text-left max-w-5xl mx-auto pb-12 relative">
      {/* Return link */}
      <button 
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#5f5548] dark:text-[#c5b8a5] hover:text-[#e2b884] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Return to Dashboard
      </button>

      {/* Hero Banner Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Banner Deck */}
        <div className="lg:col-span-2 space-y-8">
          <div className="premier-card overflow-hidden relative group aspect-video md:aspect-[21/9] flex flex-col justify-end p-8 border border-stone-100/40 dark:border-white/5">
            <img 
              src={wedding.coverUrl || "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200"} 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            
            <div className="relative z-10 space-y-2 text-white">
              <span className="text-[10px] font-mono text-[#e2b884] uppercase tracking-[0.4em] font-bold">ACTIVE EXPERIENCE</span>
              <h2 className="text-4xl md:text-5xl font-serif italic">{wedding.name}</h2>
              <div className="flex flex-wrap items-center gap-4 text-xs font-bold uppercase tracking-wider text-stone-300 mt-2">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#e2b884]" />
                  <span>{wedding.date}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#e2b884]" />
                  <span>The Grand Palace, Jaipur</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="premier-card p-4 flex flex-col justify-between bg-white/50 dark:bg-stone-900/40 border border-stone-100/40 dark:border-white/5">
              <ClipboardList className="w-4 h-4 text-slate-400" />
              <div className="mt-4">
                <p className="text-[9px] uppercase font-bold tracking-widest text-stone-400">Total Tasks</p>
                <p className="text-xl font-serif text-stone-900 dark:text-white mt-1">{totalTasksCount}</p>
              </div>
            </div>
            <div className="premier-card p-4 flex flex-col justify-between bg-white/50 dark:bg-stone-900/40 border border-stone-100/40 dark:border-white/5">
              <Users className="w-4 h-4 text-slate-400" />
              <div className="mt-4">
                <p className="text-[9px] uppercase font-bold tracking-widest text-stone-400">Guest Count</p>
                <p className="text-xl font-serif text-stone-900 dark:text-white mt-1">{currentWeddingGuests.length}</p>
              </div>
            </div>
            <div className="premier-card p-4 flex flex-col justify-between bg-white/50 dark:bg-stone-900/40 border border-stone-100/40 dark:border-white/5">
              <IndianRupee className="w-4 h-4 text-slate-400" />
              <div className="mt-4">
                <p className="text-[9px] uppercase font-bold tracking-widest text-stone-400">Total Budget</p>
                <p className="text-xl font-serif text-stone-900 dark:text-white mt-1">₹{(totalSumBudget / 100000).toFixed(2)}L</p>
              </div>
            </div>
            <div className="premier-card p-4 flex flex-col justify-between bg-white/50 dark:bg-stone-900/40 border border-stone-100/40 dark:border-white/5">
              <TrendingUp className="w-4 h-4 text-slate-400" />
              <div className="mt-4">
                <p className="text-[9px] uppercase font-bold tracking-widest text-stone-400">Task Progress</p>
                <p className="text-xl font-serif text-stone-900 dark:text-white mt-1">{progressPercent}%</p>
              </div>
            </div>
          </div>

          {/* Sangeet Night main workspace widget with Navigation */}
          <div className="premier-card p-6 md:p-8 space-y-6 bg-white/80 dark:bg-stone-900/60 border border-stone-100/40 dark:border-white/5">
            {/* Inline tabs control */}
            <div className="flex border-b border-stone-100 dark:border-white/5 pb-2 overflow-x-auto gap-2">
              {[
                { id: "tasks", label: "Tasks Detail" },
                { id: "guests", label: "Guest Registry" },
                { id: "budget", label: "Budget & Costs" },
                { id: "vendors", label: "Vendors Circle" },
                { id: "share", label: "Magic Sharing" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all whitespace-nowrap ${
                    activeTab === tab.id 
                      ? "bg-[#e2b884] text-white shadow-md shadow-[#e2b884]/20" 
                      : "text-stone-400 hover:text-stone-800 dark:hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Render selected workspace view */}
            {activeTab === "tasks" && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <h4 className="text-sm font-serif italic text-stone-500">Scheduled Actions ({currentWeddingTasks.length})</h4>
                  
                  {/* Inline creation collapsible */}
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!taskTitle) return;
                      onAddTask({ weddingId: wedding.id, title: taskTitle, category: taskCat, status: "pending", dueDate: taskDate || undefined });
                      setTaskTitle("");
                      setTaskDate("");
                    }}
                    className="flex flex-wrap items-center gap-2 w-full md:w-auto"
                  >
                    <input 
                      type="text" 
                      placeholder="Add planning action..."
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      className="px-4 py-2 text-xs rounded-xl bg-stone-100 dark:bg-stone-950 border border-stone-200 dark:border-white/5 focus:outline-none focus:ring-1 focus:ring-[#e2b884] flex-1 min-w-[150px]"
                    />
                    <select
                      value={taskCat}
                      onChange={(e) => setTaskCat(e.target.value as any)}
                      className="px-3 py-2 text-xs rounded-xl bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-white/5 text-stone-600 dark:text-stone-300 focus:outline-none"
                    >
                      {["Venue", "Catering", "Decor", "Entertainment", "Attire", "Coordinator", "Other"].map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <button 
                      type="submit" 
                      className="p-2 bg-[#e2b884] hover:bg-[#d9a96d] text-white rounded-xl transition-all"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </form>
                </div>

                {/* Task list render */}
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {currentWeddingTasks.length === 0 ? (
                    <p className="text-xs text-stone-400 italic py-4">No tasks planned for this event. Introduce one above.</p>
                  ) : (
                    currentWeddingTasks.map((t) => (
                      <div 
                        key={t.id}
                        className={`p-4 rounded-xl flex items-center justify-between gap-4 border border-stone-50 transition-all ${
                          t.status === "completed" 
                            ? "bg-stone-50/50 dark:bg-stone-900/20 text-stone-400 line-through" 
                            : "bg-white dark:bg-stone-950 shadow-sm"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => onToggleTask(t.id)}
                            className="text-[#e2b884] hover:scale-110 transition-transform shrink-0"
                          >
                            {t.status === "completed" ? (
                              <CheckCircle2 className="w-5 h-5 fill-current text-[#e2b884]" />
                            ) : (
                              <Circle className="w-5 h-5 text-stone-300 dark:text-stone-600" />
                            )}
                          </button>
                          
                          <div className="text-left">
                            <p className="text-xs font-semibold">{t.title}</p>
                            <div className="flex items-center gap-2 text-[9px] uppercase tracking-wider text-stone-400 mt-1">
                              <span className="bg-stone-100 dark:bg-stone-900 px-1.5 py-0.5 rounded leading-none text-[8px]">{t.category}</span>
                              {t.dueDate && <span>Due: {t.dueDate}</span>}
                            </div>
                          </div>
                        </div>

                        <button 
                          onClick={() => onDeleteTask(t.id)}
                          className="text-stone-300 hover:text-red-500 p-1.5 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === "guests" && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <h4 className="text-sm font-serif italic text-stone-500">Invitations Matrix ({currentWeddingGuests.length})</h4>
                  
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!guestName) return;
                      onAddGuest({ weddingId: wedding.id, name: guestName, rsvp: guestRsvp, phone: guestPhone || undefined });
                      setGuestName("");
                      setGuestPhone("");
                    }}
                    className="flex flex-wrap items-center gap-2 w-full md:w-auto"
                  >
                    <input 
                      type="text" 
                      placeholder="Guest name..."
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className="px-4 py-2 text-xs rounded-xl bg-stone-100 dark:bg-stone-950 border border-stone-200 dark:border-white/5 focus:outline-none focus:ring-1 focus:ring-[#e2b884] flex-1 min-w-[150px]"
                    />
                    <input 
                      type="text" 
                      placeholder="Phone (optional)..."
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      className="px-3 py-2 text-xs rounded-xl bg-stone-100 dark:bg-stone-950 border border-stone-200 dark:border-white/5 focus:outline-none focus:ring-1 focus:ring-[#e2b884] w-28"
                    />
                    <select
                      value={guestRsvp}
                      onChange={(e) => setGuestRsvp(e.target.value as any)}
                      className="px-3 py-2 text-xs rounded-xl bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-white/5 text-stone-600 dark:text-stone-300 focus:outline-none"
                    >
                      <option value="attending">Attending</option>
                      <option value="pending">Pending</option>
                      <option value="declined">Declined</option>
                    </select>
                    <button 
                      type="submit" 
                      className="p-2 bg-[#e2b884] hover:bg-[#d9a96d] text-white rounded-xl transition-all"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </form>
                </div>

                {/* Guest grid/list */}
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {currentWeddingGuests.length === 0 ? (
                    <p className="text-xs text-stone-400 italic py-4">The registry is empty. Book guest passes above.</p>
                  ) : (
                    currentWeddingGuests.map((g) => (
                      <div 
                        key={g.id}
                        className="p-4 rounded-xl bg-white dark:bg-stone-950 border border-stone-50 dark:border-white/[0.03] shadow-sm flex items-center justify-between"
                      >
                        <div className="text-left space-y-1">
                          <p className="text-xs font-bold text-stone-800 dark:text-stone-200">{g.name}</p>
                          {g.phone && <p className="text-[10px] font-mono text-stone-400">{g.phone}</p>}
                        </div>

                        <div className="flex items-center gap-3">
                          {/* RSVP switcher dropdown */}
                          <select
                            value={g.rsvp}
                            onChange={(e) => onToggleGuestRSVP(g.id, e.target.value as any)}
                            className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg border-0 focus:outline-none cursor-pointer ${
                              g.rsvp === "attending" 
                                ? "bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400" 
                                : g.rsvp === "declined"
                                ? "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400"
                                : "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400"
                            }`}
                          >
                            <option value="attending">Attending</option>
                            <option value="pending">Pending</option>
                            <option value="declined">Declined</option>
                          </select>

                          <button 
                            onClick={() => onDeleteGuest(g.id)}
                            className="text-stone-300 hover:text-red-500 p-1.5 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === "budget" && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-stone-100 dark:border-white/5 pb-4">
                  <h4 className="text-sm font-serif italic text-stone-500">Expenses Log ({currentWeddingBudget.length})</h4>
                  
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!budgetName || !budgetAmount) return;
                      onAddBudgetItem({ weddingId: wedding.id, name: budgetName, category: budgetCat, amount: Number(budgetAmount), paid: budgetPaid });
                      setBudgetName("");
                      setBudgetAmount("");
                      setBudgetPaid(false);
                    }}
                    className="flex flex-wrap items-center gap-2 w-full md:w-auto"
                  >
                    <input 
                      type="text" 
                      placeholder="Expense item..."
                      value={budgetName}
                      onChange={(e) => setBudgetName(e.target.value)}
                      className="px-4 py-2 text-xs rounded-xl bg-stone-100 dark:bg-stone-950 border border-stone-200 dark:border-white/5 focus:outline-none focus:ring-1 focus:ring-[#e2b884] flex-1 min-w-[120px]"
                    />
                    <input 
                      type="number" 
                      placeholder="Amount..."
                      value={budgetAmount}
                      onChange={(e) => setBudgetAmount(e.target.value)}
                      className="px-3 py-2 text-xs rounded-xl bg-stone-100 dark:bg-stone-950 border border-stone-200 dark:border-white/5 focus:outline-none focus:ring-1 focus:ring-[#e2b884] w-24"
                    />
                    <select
                      value={budgetCat}
                      onChange={(e) => setBudgetCat(e.target.value as any)}
                      className="px-3 py-2 text-xs rounded-xl bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-white/5 text-stone-600 dark:text-stone-300 focus:outline-none"
                    >
                      {["Venue", "Catering", "Decor", "Entertainment", "Attire", "Other"].map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>

                    <label className="flex items-center gap-1.5 px-3 py-2 bg-stone-100 dark:bg-stone-900 rounded-xl cursor-pointer text-[10px] font-bold uppercase tracking-wider text-stone-500">
                      <input 
                        type="checkbox" 
                        checked={budgetPaid}
                        onChange={(e) => setBudgetPaid(e.target.checked)}
                        className="rounded"
                      />
                      <span>Paid</span>
                    </label>

                    <button 
                      type="submit" 
                      className="p-2 bg-[#e2b884] hover:bg-[#d9a96d] text-white rounded-xl transition-all"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </form>
                </div>

                {/* SVG Donut implementation */}
                <BudgetDonutChart items={currentWeddingBudget} />

                {/* Item list */}
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {currentWeddingBudget.map((b) => (
                    <div 
                      key={b.id}
                      className="p-3.5 rounded-xl bg-white dark:bg-stone-950 border border-stone-100 dark:border-white/[0.03] shadow-sm flex items-center justify-between"
                    >
                      <div className="text-left space-y-0.5">
                        <p className="text-xs font-bold text-stone-800 dark:text-stone-200">{b.name}</p>
                        <p className="text-[9px] uppercase tracking-wider text-stone-400 font-medium">{b.category}</p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xs font-bold font-mono">₹{b.amount.toLocaleString()}</p>
                          <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                            b.paid 
                              ? "bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400" 
                              : "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400"
                          }`}>
                            {b.paid ? "PAID" : "DUE"}
                          </span>
                        </div>

                        <button 
                          onClick={() => onDeleteBudgetItem(b.id)}
                          className="text-stone-300 hover:text-red-500 p-1.5 rounded-lg transition-colors animate-fade-in"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "vendors" && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <h4 className="text-sm font-serif italic text-stone-500">Service Vendors Circle ({currentWeddingVendors.length})</h4>
                  
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!vendorName || !vendorPhone) return;
                      onAddVendor({ weddingId: wedding.id, name: vendorName, category: vendorCat, phone: vendorPhone, contactPerson: vendorContact || undefined, status: "booked" });
                      setVendorName("");
                      setVendorPhone("");
                      setVendorContact("");
                    }}
                    className="flex flex-wrap items-center gap-2 w-full md:w-auto"
                  >
                    <input 
                      type="text" 
                      placeholder="Vendor name..."
                      value={vendorName}
                      onChange={(e) => setVendorName(e.target.value)}
                      className="px-4 py-2 text-xs rounded-xl bg-stone-100 dark:bg-stone-950 border border-stone-200 dark:border-white/5 focus:outline-none focus:ring-1 focus:ring-[#e2b884] flex-1 min-w-[120px]"
                    />
                    <input 
                      type="text" 
                      placeholder="Category o contact..."
                      value={vendorContact}
                      onChange={(e) => setVendorContact(e.target.value)}
                      className="px-3 py-2 text-xs rounded-xl bg-stone-100 dark:bg-stone-950 border border-stone-200 dark:border-white/5 focus:outline-none w-28"
                    />
                    <input 
                      type="text" 
                      placeholder="Phone no..."
                      value={vendorPhone}
                      onChange={(e) => setVendorPhone(e.target.value)}
                      className="px-3 py-2 text-xs rounded-xl bg-stone-100 dark:bg-stone-950 border border-stone-200 dark:border-white/5 focus:outline-none w-24"
                    />
                    <select
                      value={vendorCat}
                      onChange={(e) => setVendorCat(e.target.value as any)}
                      className="px-3 py-2 text-xs rounded-xl bg-stone-100 dark:bg-stone-950 border border-stone-200 dark:border-white/5 text-stone-600 dark:text-stone-300 focus:outline-none"
                    >
                      {["Venue", "Decor", "Catering", "Entertainment", "Photography", "Makeup", "Other"].map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>

                    <button 
                      type="submit" 
                      className="p-2 bg-[#e2b884] hover:bg-[#d9a96d] text-white rounded-xl transition-all"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </form>
                </div>

                {/* Vendor cards list */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-1">
                  {currentWeddingVendors.length === 0 ? (
                    <p className="text-xs text-stone-400 italic py-4 col-span-2">No vendors listed yet. Pitch contracts above.</p>
                  ) : (
                    currentWeddingVendors.map((v) => (
                      <div 
                        key={v.id}
                        className="p-4 rounded-xl bg-white dark:bg-stone-950 border border-stone-100 dark:border-white/[0.03] shadow-sm flex items-center justify-between hover:border-sand-primary/40 transition-all group"
                      >
                        <div className="text-left space-y-1">
                          <span className="text-[8px] font-bold uppercase tracking-wider text-stone-400 bg-stone-100 dark:bg-stone-900 px-1.5 py-0.5 rounded leading-none">{v.category}</span>
                          <p className="text-xs font-bold text-stone-800 dark:text-stone-200 mt-1">{v.name}</p>
                          {v.contactPerson && <p className="text-[10px] text-stone-400">Contact: {v.contactPerson}</p>}
                          <p className="text-[10px] font-mono text-stone-400">{v.phone}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => {
                              setDialingVendor(v);
                              setTimeout(() => setDialingVendor(null), 4000);
                            }}
                            className="p-2 bg-[#e2b884]/15 hover:bg-[#e2b884] hover:text-white text-[#e2b884] rounded-full transition-all shrink-0"
                            title="Simulate Call"
                          >
                            <Phone className="w-4 h-4" />
                          </button>

                          <button 
                            onClick={() => onDeleteVendor(v.id)}
                            className="text-stone-300 hover:text-red-500 p-2 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === "share" && (
              <div className="p-4 space-y-6 text-center animate-fade-in flex flex-col items-center">
                <div className="w-16 h-16 bg-sand-soft rounded-2xl flex items-center justify-center text-sand-primary shadow-inner gap-1">
                  <Share2 className="w-6 h-6 animate-pulse" />
                </div>
                
                <div className="max-w-md space-y-3">
                  <h4 className="text-xl font-serif italic text-stone-900 dark:text-white">Coordinate Portal Access</h4>
                  <p className="text-stone-400 text-xs">Instantly share QR scanning links allowing guests to enter coordinates, view matching archival logs, and upload pristine custom assets instantly.</p>
                </div>

                <div className="bg-white p-4 rounded-[2rem] border border-stone-100 shadow-xl inline-flex flex-col items-center gap-2 mt-2">
                  <QRCode id="qr-share-magic" value={shareableUrl} size={150} />
                  <p className="text-[8px] font-mono text-stone-400 mt-1 uppercase">EVENT KEY: {wedding.id.slice(0, 8)}</p>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-2 max-w-md w-full mt-4">
                  <div className="bg-stone-100 dark:bg-stone-950 border border-stone-200 dark:border-white/5 rounded-xl px-4 py-3 flex-1 text-xs truncate font-mono text-stone-500 w-full select-all">
                    {shareableUrl}
                  </div>
                  <button 
                    onClick={copyToClipboard}
                    className="w-full md:w-auto px-6 py-3 rounded-xl bg-stone-900 dark:bg-white text-white dark:text-stone-900 font-bold text-xs uppercase tracking-widest hover:translate-y-[-2px] transition-all whitespace-nowrap active:scale-95 shadow-lg"
                  >
                    {copiedLink ? "Copied Link!" : "Copy Portal URL"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Control Desk Sidemenu columns */}
        <div className="space-y-8">
          {/* Main Launcher widget */}
          <div className="premier-card p-6 flex flex-col items-center text-center bg-gradient-to-t from-stone-50/50 to-white/50 dark:from-stone-950/20 dark:to-stone-900/10 border border-stone-100/40 dark:border-white/5 space-y-4">
            <span className="text-[9px] font-bold text-stone-400 uppercase tracking-[0.3em]">MEDIA CHANNELS</span>
            <div className="w-16 h-16 bg-white dark:bg-stone-800 rounded-3xl flex items-center justify-center text-slate-800 dark:text-white shadow-2xl animate-spin-slow">
              <FolderOpen className="w-6 h-6 text-[#e2b884]" />
            </div>
            
            <div className="space-y-1.5">
              <h5 className="text-lg font-serif italic font-bold text-stone-900 dark:text-white">Sacred Media Archives</h5>
              <p className="text-[10px] leading-relaxed text-stone-400 max-w-xs px-2">Launch full-scale high-resolution galleries, photo downloads, watermarking dashboards, and filters contextually linked for this event.</p>
            </div>

            <button 
              onClick={onEnterGallery}
              className="w-full py-4 rounded-xl bg-[#e2b884] text-white hover:bg-[#d9a96d] font-bold text-[10px] uppercase tracking-widest transition-all hover:translate-y-[-2px] active:scale-95 shadow-md flex items-center justify-center gap-2"
            >
              <span>Explore Studio Gallery</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Detailed Event Info Dashboard */}
          <div className="premier-card p-6 bg-white/70 dark:bg-stone-900/40 border border-stone-100/40 dark:border-white/5 space-y-4 text-xs font-medium text-stone-600 dark:text-stone-300">
            <h5 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#e2b884] mb-2">EVENT SPECIFICATIONS</h5>
            
            <div className="flex justify-between py-2.5 border-b border-stone-100/50 dark:border-white/[0.03]">
              <span className="text-stone-400">Theme Atmosphere</span>
              <span className="font-bold text-stone-900 dark:text-white">Royal Elegance</span>
            </div>
            <div className="flex justify-between py-2.5 border-b border-stone-100/50 dark:border-white/[0.03]">
              <span className="text-stone-400">Total Registry</span>
              <span className="font-bold text-stone-900 dark:text-white">{currentWeddingGuests.length} Expected</span>
            </div>
            <div className="flex justify-between py-2.5 border-b border-stone-100/50 dark:border-white/[0.03]">
              <span className="text-stone-400">Assigned Captain</span>
              <span className="font-bold text-stone-900 dark:text-white">Aisha Khan</span>
            </div>
            <div className="flex justify-between py-2.5">
              <span className="text-stone-400">Access Channel</span>
              <span className="font-bold font-mono text-sand-primary">{wedding.id.slice(0, 8).toUpperCase()}</span>
            </div>
          </div>

          {/* Activity Feeds */}
          <div className="premier-card p-6 bg-white/70 dark:bg-stone-900/40 border border-stone-100/40 dark:border-white/5 space-y-4">
            <h5 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#e2b884] mb-2">LIVE COORDINATES FEED</h5>
            
            <div className="space-y-4 text-xs">
              {currentActivityFeeds.length === 0 ? (
                <p className="text-stone-400 italic text-[11px]">No activity logs generated yet. Modifying planner logs updates feed instantly.</p>
              ) : (
                currentActivityFeeds.map((feed) => (
                  <div key={feed.id} className="flex gap-2.5 text-left items-start group">
                    <div className="w-1.5 h-1.5 rounded-full bg-sand-primary mt-1.5 shrink-0 animate-pulse" />
                    <div className="space-y-0.5">
                      <p className="text-stone-700 dark:text-stone-300 font-medium leading-normal">{feed.message}</p>
                      <span className="text-[9px] font-mono text-stone-400 group-hover:text-sand-primary transition-colors">{feed.timestamp}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Simulated Phone dialer overlay */}
      {dialingVendor && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-stone-900/80 backdrop-blur-md">
          <div className="glass-dark rounded-[3rem] p-10 max-w-sm w-full text-center space-y-8 border border-white/10 animate-scale-in text-white shadow-2xl">
            <div className="space-y-2">
              <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-orange-400 animate-pulse">SIREN CALL INITIATED</p>
              <h4 className="text-2xl font-serif italic text-[#e2b884]">{dialingVendor.name}</h4>
              <p className="text-stone-400 text-xs mt-1">Calling: {dialingVendor.contactPerson || "Vendor Representative"}</p>
            </div>

            <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-orange-500/10 border border-orange-500/20 animate-ping" />
              <div className="w-16 h-16 rounded-full bg-[#e2b884] flex items-center justify-center animate-beat">
                <Phone className="w-6 h-6 text-white" />
              </div>
            </div>

            <div className="space-y-1 font-mono text-stone-400 text-sm">
              <p>{dialingVendor.phone}</p>
              <p className="text-[10px] uppercase font-bold text-green-400 tracking-wider">Dialed successfully...</p>
            </div>

            <button 
              onClick={() => setDialingVendor(null)}
              className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-[10px] uppercase tracking-widest transition-all"
            >
              Hang Up
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
