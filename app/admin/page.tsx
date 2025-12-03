"use client"

import { useState, useEffect, useMemo } from "react"
import { createClient } from "@supabase/supabase-js"
import { 
  Trash2, CheckCircle, Clock, DollarSign, Users, Calendar as CalendarIcon, 
  Search, RefreshCw, LogOut, CreditCard, Target, Trophy, Loader2, 
  AlertCircle, XCircle, Edit, MoreHorizontal, ChevronLeft, ChevronRight,
  Filter, Smartphone, Globe
} from "lucide-react"
import { format, startOfWeek, endOfWeek, addDays, isSameDay, parseISO, getDay } from "date-fns"

// --- CONSTANTS ---
const BAY_NAMES: Record<number, string> = {
  1: "Lounge Bay",
  2: "Middle Bay",
  3: "Window Bay"
}

const DURATION_OPTIONS = [1, 1.5, 2, 2.5, 3, 3.5, 4]

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function AdminDashboard() {
  // --- STATE ---
  const [pin, setPin] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [activeTab, setActiveTab] = useState<"dashboard" | "calendar" | "walkin">("dashboard")
  
  // Data
  const [bookings, setBookings] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isActionLoading, setIsActionLoading] = useState(false)
  
  // Filters & Search
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0])
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // Walk-in Form State
  const [walkInName, setWalkInName] = useState("")
  const [walkInTime, setWalkInTime] = useState("12:00")
  const [walkInDuration, setWalkInDuration] = useState(1)
  const [walkInPlayers, setWalkInPlayers] = useState(1)
  const [walkInAmountPaid, setWalkInAmountPaid] = useState("") // Partial payment support

  // Edit Modal State
  const [editingBooking, setEditingBooking] = useState<any | null>(null)

  // --- AUTH ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (pin === "8821") {
      setIsAuthenticated(true)
      fetchBookings()
    } else {
      alert("Invalid PIN")
    }
  }

  // --- FETCHING ---
  const fetchBookings = async () => {
    setIsLoading(true)
    try {
      let query = supabase.from("bookings").select("*").order("start_time", { ascending: true })
      
      // If in dashboard/walkin mode, filter by specific date
      if (activeTab !== 'calendar') {
        query = query.eq("booking_date", currentDate)
      } else {
        // If in calendar mode, fetch whole week
        const start = weekStart.toISOString().split('T')[0]
        const end = endOfWeek(weekStart, { weekStartsOn: 1 }).toISOString().split('T')[0]
        query = query.gte("booking_date", start).lte("booking_date", end)
      }

      const { data, error } = await query
      if (error) throw error
      setBookings(data || [])
    } catch (err: any) {
      console.error(err)
      alert("Error fetching data")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated) fetchBookings()
  }, [currentDate, activeTab, weekStart])

  // --- ACTIONS ---

  // 1. Create Walk-in
  const handleWalkInSubmit = async () => {
    if(!walkInName) return alert("Enter guest name")
    setIsActionLoading(true)
    
    try {
        const pricing = { 1: 250, 2: 180, 3: 160, 4: 150 }
        // @ts-ignore
        const rate = pricing[Math.min(walkInPlayers, 4)] || 150
        const total = rate * walkInPlayers * walkInDuration
        
        const paidAmount = walkInAmountPaid ? parseFloat(walkInAmountPaid) : 0
        const isFullyPaid = paidAmount >= total

        const res = await fetch("/api/bookings/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                booking_date: currentDate,
                start_time: walkInTime,
                duration_hours: walkInDuration,
                players: walkInPlayers,
                session_type: "quick", 
                guest_name: walkInName,
                guest_email: "walkin@venue-os.com", 
                guest_phone: "0000000000",
                total_price: total,
                // NEW: Handle partials
                amount_paid: paidAmount,
                payment_status: isFullyPaid ? "paid_instore" : "pending",
                booking_source: "walk_in"
            })
        })

        const data = await res.json()
        if(!res.ok) throw new Error(data.error)

        alert(`✅ Walk-in Created!\n${BAY_NAMES[data.assigned_bay]}\nBalance Due: R${total - paidAmount}`)
        
        // Reset
        setWalkInName("")
        setWalkInAmountPaid("")
        setActiveTab("dashboard")
        fetchBookings()

    } catch (err: any) {
        alert(err.message)
    } finally {
        setIsActionLoading(false)
    }
  }

  // 2. Update Booking (General Edit)
  const handleUpdateBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingBooking) return
    setIsActionLoading(true)

    try {
      // Calculate Status based on payment
      const total = parseFloat(editingBooking.total_price)
      const paid = parseFloat(editingBooking.amount_paid || 0)
      
      let newPaymentStatus = editingBooking.payment_status
      if (paid >= total) newPaymentStatus = "paid_instore"
      else if (paid > 0) newPaymentStatus = "pending" // Partial is still pending completion

      const { error } = await supabase
        .from("bookings")
        .update({
          guest_name: editingBooking.guest_name,
          guest_email: editingBooking.guest_email,
          guest_phone: editingBooking.guest_phone,
          start_time: editingBooking.start_time,
          duration_hours: editingBooking.duration_hours,
          total_price: total,
          amount_paid: paid,
          payment_status: newPaymentStatus,
          status: editingBooking.status,
          simulator_id: editingBooking.simulator_id
        })
        .eq("id", editingBooking.id)

      if (error) throw error
      
      setEditingBooking(null)
      fetchBookings()
    } catch (err: any) {
      alert("Update failed: " + err.message)
    } finally {
      setIsActionLoading(false)
    }
  }

  // 3. Quick Settle Balance
  const handleQuickSettle = async (booking: any) => {
    if (!confirm(`Mark remainder (R${booking.total_price - (booking.amount_paid || 0)}) as PAID?`)) return
    
    const { error } = await supabase
      .from("bookings")
      .update({
        amount_paid: booking.total_price,
        payment_status: "paid_instore",
        status: "confirmed"
      })
      .eq("id", booking.id)
    
    if (error) alert("Error")
    else fetchBookings()
  }

  // 4. Delete
  const handleDelete = async (id: string) => {
    if (!confirm("Permanently delete this booking?")) return
    await fetch("/api/bookings/delete", {
      method: "POST",
      body: JSON.stringify({ id, pin: "8821" })
    })
    setBookings(prev => prev.filter(b => b.id !== id))
  }

  // --- DERIVED DATA ---
  const filteredBookings = bookings.filter(b => {
    const searchMatch = (b.guest_name || "").toLowerCase().includes(searchTerm.toLowerCase())
    const statusMatch = statusFilter === 'all' ? true : b.status === statusFilter
    return searchMatch && statusMatch
  })

  // Stats
  const totalRev = bookings.reduce((acc, b) => acc + (b.amount_paid || 0), 0)
  const outstanding = bookings.reduce((acc, b) => acc + (b.total_price - (b.amount_paid || 0)), 0)

  // --- UI COMPONENTS ---

  if (!isAuthenticated) return <LoginScreen pin={pin} setPin={setPin} handleLogin={handleLogin} />

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      
      {/* HEADER */}
      <header className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-[1800px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-900/20">
               <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
                <h1 className="font-bold text-lg text-white">Venue OS</h1>
                <span className="text-xs text-zinc-500 font-medium">Administrator</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
             <div className="bg-zinc-900 rounded-xl p-1 flex border border-zinc-800">
                <TabButton active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")} icon={<Target className="w-4 h-4" />} label="Live View" />
                <TabButton active={activeTab === "calendar"} onClick={() => setActiveTab("calendar")} icon={<CalendarIcon className="w-4 h-4" />} label="Schedule" />
                <TabButton active={activeTab === "walkin"} onClick={() => setActiveTab("walkin")} icon={<CreditCard className="w-4 h-4" />} label="New Walk-in" />
             </div>
             <button onClick={() => setIsAuthenticated(false)} className="p-3 text-zinc-500 hover:text-red-400 transition-colors">
               <LogOut className="w-5 h-5" />
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1800px] mx-auto p-6 space-y-8">
        
        {/* EDIT MODAL */}
        {editingBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95">
              <div className="flex justify-between items-center p-6 border-b border-zinc-800">
                <h3 className="text-xl font-bold text-white">Edit Booking</h3>
                <button onClick={() => setEditingBooking(null)}><XCircle className="w-6 h-6 text-zinc-500 hover:text-white" /></button>
              </div>
              <form onSubmit={handleUpdateBooking} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-zinc-500 font-bold uppercase">Guest Name</label>
                    <input className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 mt-1" value={editingBooking.guest_name} onChange={e => setEditingBooking({...editingBooking, guest_name: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 font-bold uppercase">Contact</label>
                    <input className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 mt-1" value={editingBooking.guest_phone} onChange={e => setEditingBooking({...editingBooking, guest_phone: e.target.value})} />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                   <div>
                    <label className="text-xs text-zinc-500 font-bold uppercase">Bay</label>
                    <select 
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 mt-1"
                      value={editingBooking.simulator_id}
                      onChange={e => setEditingBooking({...editingBooking, simulator_id: parseInt(e.target.value)})}
                    >
                      <option value={1}>Lounge</option>
                      <option value={2}>Middle</option>
                      <option value={3}>Window</option>
                    </select>
                   </div>
                   <div>
                    <label className="text-xs text-zinc-500 font-bold uppercase">Time</label>
                    <input type="time" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 mt-1" value={editingBooking.start_time} onChange={e => setEditingBooking({...editingBooking, start_time: e.target.value})} />
                   </div>
                   <div>
                    <label className="text-xs text-zinc-500 font-bold uppercase">Duration (h)</label>
                    <input type="number" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 mt-1" value={editingBooking.duration_hours} onChange={e => setEditingBooking({...editingBooking, duration_hours: parseFloat(e.target.value)})} />
                   </div>
                </div>

                <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-800 space-y-4">
                   <div className="flex justify-between items-center">
                      <label className="text-sm font-bold text-white">Financials</label>
                      <span className={`text-xs px-2 py-1 rounded ${editingBooking.amount_paid >= editingBooking.total_price ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                        {editingBooking.amount_paid >= editingBooking.total_price ? "FULLY PAID" : "OUTSTANDING BALANCE"}
                      </span>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-zinc-500">Total Price (R)</label>
                        <input type="number" className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 mt-1 font-mono" value={editingBooking.total_price} onChange={e => setEditingBooking({...editingBooking, total_price: parseFloat(e.target.value)})} />
                      </div>
                      <div>
                        <label className="text-xs text-zinc-500">Amount Paid (R)</label>
                        <input type="number" className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 mt-1 font-mono" value={editingBooking.amount_paid} onChange={e => setEditingBooking({...editingBooking, amount_paid: parseFloat(e.target.value)})} />
                      </div>
                   </div>
                </div>

                <div className="pt-2 flex gap-3">
                  <button type="submit" disabled={isActionLoading} className="flex-1 bg-white text-black font-bold py-3 rounded-xl hover:bg-zinc-200 transition-colors">
                    {isActionLoading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --- VIEW: CALENDAR --- */}
        {activeTab === 'calendar' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-4">
                 <h2 className="text-2xl font-bold">Weekly Schedule</h2>
                 <div className="flex items-center bg-zinc-900 rounded-lg border border-zinc-800">
                    <button onClick={() => setWeekStart(d => addDays(d, -7))} className="p-2 hover:bg-zinc-800 rounded-l-lg"><ChevronLeft className="w-4 h-4" /></button>
                    <span className="px-4 text-sm font-mono">{format(weekStart, "MMM d")} - {format(endOfWeek(weekStart, {weekStartsOn: 1}), "MMM d")}</span>
                    <button onClick={() => setWeekStart(d => addDays(d, 7))} className="p-2 hover:bg-zinc-800 rounded-r-lg"><ChevronRight className="w-4 h-4" /></button>
                 </div>
               </div>
               <button onClick={fetchBookings} className="p-2 bg-zinc-900 rounded-lg hover:bg-zinc-800"><RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin': ''}`} /></button>
            </div>

            <div className="grid grid-cols-7 gap-px bg-zinc-800 border border-zinc-800 rounded-2xl overflow-hidden">
               {/* Headers */}
               {Array.from({ length: 7 }).map((_, i) => {
                 const day = addDays(weekStart, i)
                 const isToday = isSameDay(day, new Date())
                 return (
                   <div key={i} className={`bg-zinc-950 p-4 text-center border-b border-zinc-900 ${isToday ? 'bg-zinc-900/50' : ''}`}>
                      <div className="text-zinc-500 text-xs uppercase font-bold">{format(day, "EEE")}</div>
                      <div className={`text-xl font-bold mt-1 ${isToday ? 'text-emerald-400' : 'text-zinc-300'}`}>{format(day, "d")}</div>
                   </div>
                 )
               })}
               
               {/* Days content */}
               {Array.from({ length: 7 }).map((_, i) => {
                 const day = addDays(weekStart, i)
                 const dayBookings = bookings.filter(b => b.booking_date === format(day, "yyyy-MM-dd"))
                 
                 return (
                   <div key={i} className="bg-zinc-950 min-h-[300px] p-2 space-y-2">
                      {dayBookings.length === 0 && <div className="text-zinc-800 text-xs text-center py-10">No bookings</div>}
                      {dayBookings.map(b => (
                        <div key={b.id} onClick={() => setEditingBooking(b)} className={`p-2 rounded-lg border text-xs cursor-pointer hover:opacity-80 transition-opacity ${
                          b.booking_source === 'walk_in' 
                            ? 'bg-purple-500/10 border-purple-500/20 text-purple-200' 
                            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200'
                        }`}>
                           <div className="font-bold truncate">{b.start_time.slice(0,5)} - {b.guest_name}</div>
                           <div className="opacity-60 truncate">{BAY_NAMES[b.simulator_id]}</div>
                        </div>
                      ))}
                   </div>
                 )
               })}
            </div>
          </div>
        )}

        {/* --- VIEW: WALK IN --- */}
        {activeTab === 'walkin' && (
          <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4">
             <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                <div className="flex items-center gap-4 mb-8 pb-8 border-b border-zinc-800">
                  <div className="w-14 h-14 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-900/20">
                    <Smartphone className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Walk-in Terminal</h2>
                    <p className="text-zinc-500">Create instant booking & process payment</p>
                  </div>
                </div>
                
                <div className="space-y-6">
                   <div>
                     <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Guest Name</label>
                     <input value={walkInName} onChange={e => setWalkInName(e.target.value)} className="w-full mt-2 bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white text-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all" placeholder="e.g. Gary Player" />
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Time</label>
                        <input type="time" value={walkInTime} onChange={e => setWalkInTime(e.target.value)} className="w-full mt-2 bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white outline-none" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Players</label>
                        <select value={walkInPlayers} onChange={e => setWalkInPlayers(Number(e.target.value))} className="w-full mt-2 bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-white outline-none appearance-none">
                          {[1,2,3,4].map(n => <option key={n} value={n}>{n} Players</option>)}
                        </select>
                      </div>
                   </div>

                   <div>
                      <label className="text-xs font-bold text-zinc-500 uppercase ml-1 mb-2 block">Duration</label>
                      <div className="grid grid-cols-4 gap-2">
                        {DURATION_OPTIONS.map(h => (
                           <button key={h} onClick={() => setWalkInDuration(h)} className={`py-3 rounded-lg text-sm font-bold border transition-all ${walkInDuration === h ? 'bg-purple-600 border-purple-500 text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'}`}>
                             {h}h
                           </button>
                        ))}
                      </div>
                   </div>

                   {/* Payment Section */}
                   <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-800 mt-4">
                      <div className="flex justify-between items-center mb-4">
                         <span className="text-zinc-400 font-medium">Total Due</span>
                         <span className="text-2xl font-bold text-white">R{( (walkInPlayers <= 4 ? (walkInPlayers === 1 ? 250 : walkInPlayers === 2 ? 180 : walkInPlayers === 3 ? 160 : 150) : 150) * walkInPlayers * walkInDuration ).toFixed(0)}</span>
                      </div>
                      <div className="flex gap-4 items-center">
                         <div className="flex-1">
                            <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Amount Paying Now (R)</label>
                            <input 
                              type="number" 
                              placeholder="0.00" 
                              value={walkInAmountPaid} 
                              onChange={e => setWalkInAmountPaid(e.target.value)}
                              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-white font-mono focus:border-purple-500 outline-none" 
                            />
                         </div>
                      </div>
                   </div>

                   <button onClick={handleWalkInSubmit} disabled={isActionLoading} className="w-full bg-white hover:bg-zinc-200 text-black font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-xl">
                      {isActionLoading ? <Loader2 className="animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                      Confirm Booking
                   </button>
                </div>
             </div>
          </div>
        )}

        {/* --- VIEW: DASHBOARD --- */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in">
             
             {/* Stats Cards */}
             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard label="Banked Revenue" value={`R${totalRev.toLocaleString()}`} icon={<DollarSign className="text-emerald-400" />} sub="Paid Amount" />
                <StatCard label="Outstanding" value={`R${outstanding.toLocaleString()}`} icon={<AlertCircle className="text-amber-400" />} sub="Pending Collection" />
                <StatCard label="Total Bookings" value={bookings.length} icon={<CalendarIcon className="text-blue-400" />} sub="Slots Filled Today" />
                <StatCard label="Bay Occupancy" value={`${Math.round((bookings.reduce((acc,b)=>acc+b.duration_hours,0)/36)*100)}%`} icon={<Users className="text-purple-400" />} sub="Utilization" />
             </div>

             {/* Filters */}
             <div className="flex flex-col md:flex-row justify-between gap-4 bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800">
                <div className="flex items-center gap-4">
                   <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2">
                      <CalendarIcon className="w-4 h-4 text-zinc-500 mr-2" />
                      <input type="date" value={currentDate} onChange={e => setCurrentDate(e.target.value)} className="bg-transparent border-none text-white text-sm outline-none" />
                   </div>
                   <div className="flex gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                      {['all','confirmed','pending'].map(s => (
                        <button key={s} onClick={()=>setStatusFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${statusFilter===s ? 'bg-zinc-800 text-white':'text-zinc-500 hover:text-white'}`}>{s}</button>
                      ))}
                   </div>
                </div>
                <div className="relative">
                   <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                   <input placeholder="Search guest..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white w-64 outline-none focus:border-zinc-600" />
                </div>
             </div>

             {/* Main Table */}
             <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-lg">
                <table className="w-full text-left">
                   <thead>
                      <tr className="bg-zinc-950 text-xs uppercase text-zinc-500 font-bold border-b border-zinc-800">
                         <th className="px-6 py-4">Time</th>
                         <th className="px-6 py-4">Bay</th>
                         <th className="px-6 py-4">Source</th>
                         <th className="px-6 py-4">Guest</th>
                         <th className="px-6 py-4 text-right">Balance</th>
                         <th className="px-6 py-4 text-center">Status</th>
                         <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-zinc-800">
                      {filteredBookings.map(b => {
                         const balance = b.total_price - (b.amount_paid || 0)
                         return (
                           <tr key={b.id} className="hover:bg-zinc-800/30 transition-colors group">
                              <td className="px-6 py-4">
                                 <div className="flex items-center gap-2 font-mono text-zinc-300">
                                    <Clock className="w-3 h-3 text-zinc-600" />
                                    {b.start_time.slice(0,5)} <span className="text-zinc-600 text-xs">({b.duration_hours}h)</span>
                                 </div>
                              </td>
                              <td className="px-6 py-4">
                                 <span className={`inline-block px-2 py-1 rounded text-xs font-bold border ${
                                    b.simulator_id === 1 ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                    b.simulator_id === 2 ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                    'bg-orange-500/10 text-orange-400 border-orange-500/20'
                                 }`}>
                                    {BAY_NAMES[b.simulator_id]}
                                 </span>
                              </td>
                              <td className="px-6 py-4">
                                 {b.booking_source === 'walk_in' ? (
                                    <div className="flex items-center gap-1.5 text-xs font-medium text-purple-400">
                                       <Smartphone className="w-3 h-3" /> Walk-in
                                    </div>
                                 ) : (
                                    <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                                       <Globe className="w-3 h-3" /> Online
                                    </div>
                                 )}
                              </td>
                              <td className="px-6 py-4">
                                 <div className="font-bold text-white">{b.guest_name}</div>
                                 <div className="text-xs text-zinc-500">{b.player_count} Players</div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                 <div className={`font-mono font-bold ${balance > 0 ? 'text-amber-400' : 'text-zinc-500'}`}>
                                    {balance > 0 ? `R${balance}` : '-'}
                                 </div>
                                 {balance > 0 && (
                                    <button onClick={() => handleQuickSettle(b)} className="text-[10px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded border border-amber-500/20 hover:bg-amber-500 hover:text-white transition-all mt-1">
                                       Quick Settle
                                    </button>
                                 )}
                              </td>
                              <td className="px-6 py-4 text-center">
                                 {balance <= 0 ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold border border-emerald-500/20">
                                       <CheckCircle className="w-3 h-3" /> Paid
                                    </span>
                                 ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/10 text-amber-500 text-xs font-bold border border-amber-500/20">
                                       <Clock className="w-3 h-3" /> Pending
                                    </span>
                                 )}
                              </td>
                              <td className="px-6 py-4 text-right">
                                 <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => setEditingBooking(b)} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white" title="Edit">
                                       <Edit className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(b.id)} className="p-2 hover:bg-red-500/20 rounded-lg text-zinc-400 hover:text-red-400" title="Delete">
                                       <Trash2 className="w-4 h-4" />
                                    </button>
                                 </div>
                              </td>
                           </tr>
                         )
                      })}
                      {filteredBookings.length === 0 && (
                         <tr><td colSpan={7} className="text-center py-12 text-zinc-500">No bookings found for this date.</td></tr>
                      )}
                   </tbody>
                </table>
             </div>
          </div>
        )}

      </main>
    </div>
  )
}

// --- SUBCOMPONENTS ---

function TabButton({active, onClick, icon, label}: any) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${active ? 'bg-zinc-800 text-white shadow-md' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'}`}>
      {icon} {label}
    </button>
  )
}

function StatCard({label, value, icon, sub}: any) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl shadow-sm">
       <div className="flex justify-between items-start mb-4">
          <div className="p-2 bg-zinc-950 border border-zinc-800 rounded-lg">{icon}</div>
          <span className="text-[10px] font-bold bg-zinc-800 text-zinc-400 px-2 py-1 rounded">LIVE</span>
       </div>
       <div>
          <div className="text-xs text-zinc-500 font-bold uppercase tracking-wider">{label}</div>
          <div className="text-2xl font-bold text-white mt-1">{value}</div>
          <div className="text-xs text-zinc-600 mt-1">{sub}</div>
       </div>
    </div>
  )
}

function LoginScreen({pin, setPin, handleLogin}: any) {
  return (
    <div className="h-screen bg-black flex items-center justify-center">
       <form onSubmit={handleLogin} className="text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-600 rounded-2xl mx-auto flex items-center justify-center animate-bounce">
             <Trophy className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Venue OS</h1>
          <input 
            type="password" 
            placeholder="Enter PIN" 
            value={pin}
            onChange={e => setPin(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 text-center text-2xl tracking-[1em] text-white p-4 rounded-xl outline-none focus:border-emerald-500 w-64"
            autoFocus
          />
          <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-500 transition-colors">
             Unlock Dashboard
          </button>
       </form>
    </div>
  )
}
