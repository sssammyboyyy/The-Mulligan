"use client"

import { useState, useEffect, useMemo } from "react"
import { createClient } from "@supabase/supabase-js"
import { 
  Trash2, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  Users, 
  Calendar, 
  Search, 
  RefreshCw,
  LogOut,
  CreditCard,
  Target,
  Trophy,
  Loader2,
  AlertCircle,
  Filter,
  TrendingUp,
  MoreHorizontal
} from "lucide-react"
import { format } from "date-fns"

// Initialize Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function AdminDashboard() {
  // --- STATE ---
  const [pin, setPin] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [activeTab, setActiveTab] = useState<"dashboard" | "walkin">("dashboard")
  
  // Data State
  const [bookings, setBookings] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isActionLoading, setIsActionLoading] = useState(false)
  
  // Filters
  const [currentDate, setCurrentDate] = useState(() => {
    // Default to SAST Today
    const now = new Date();
    const sast = new Date(now.getTime() + (2 * 60 * 60 * 1000)); 
    return sast.toISOString().split('T')[0];
  })
  const [viewMode, setViewMode] = useState<"day" | "all">("day")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // Walk-in Form State
  const [walkInName, setWalkInName] = useState("")
  const [walkInTime, setWalkInTime] = useState("12:00")
  const [walkInDuration, setWalkInDuration] = useState(1)
  const [walkInPlayers, setWalkInPlayers] = useState(1)

  // --- AUTHENTICATION ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (pin === "8821") {
      setIsAuthenticated(true)
      fetchBookings()
    } else {
      alert("Access Denied")
    }
  }

  // --- DATA FETCHING ---
  const fetchBookings = async () => {
    setIsLoading(true)
    try {
      let query = supabase
        .from("bookings")
        .select("*")
        .neq("status", "cancelled") // Hide cancelled by default to keep list clean
        .order("booking_date", { ascending: true })
        .order("start_time", { ascending: true })

      if (viewMode === "day") {
        query = query.eq("booking_date", currentDate)
      } else {
        query = query.gte("booking_date", new Date().toISOString().split('T')[0])
      }

      const { data, error } = await query
      if (error) throw error
      setBookings(data || [])

    } catch (err: any) {
      console.error("Fetch Error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated) fetchBookings()
  }, [currentDate, viewMode])

  // --- ACTIONS ---

  const handleDelete = async (id: string) => {
    if (!confirm("⚠️ Are you sure you want to delete this booking?")) return

    setIsActionLoading(true)
    try {
        const res = await fetch("/api/bookings/delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, pin: "8821" }) // Using the pin as a simple server-side check
        })

        const data = await res.json()

        if (!res.ok) {
            throw new Error(data.error || "Server returned an error")
        }

        // Optimistic UI update
        setBookings(prev => prev.filter(b => b.id !== id))

    } catch (err: any) {
        // Detailed Alert for debugging
        alert(`Failed to delete: ${err.message}`)
    } finally {
        setIsActionLoading(false)
    }
  }

  const handleMarkPaid = async (id: string) => {
    setIsActionLoading(true)
    await supabase.from("bookings").update({ status: "confirmed", payment_status: "paid_instore" }).eq("id", id)
    await fetchBookings()
    setIsActionLoading(false)
  }

  // --- WALK IN ---
  const handleWalkInSubmit = async () => {
    if(!walkInName) return alert("Please enter guest name")
    setIsActionLoading(true)
    try {
        const pricing = { 1: 250, 2: 180, 3: 160, 4: 150 }
        // @ts-ignore
        const rate = pricing[Math.min(walkInPlayers, 4)] || 150
        const total = rate * walkInPlayers * walkInDuration

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
                guest_email: "walkin@themulligan.org",
                guest_phone: "0000000000",
                total_price: total,
                payment_status: "completed"
            })
        })

        const data = await res.json()
        if(!res.ok) throw new Error(data.error)

        alert(`✅ Walk-in Confirmed! Assigned to Sim ${data.assigned_bay}`)
        setWalkInName("")
        setActiveTab("dashboard")
        fetchBookings()
    } catch (err: any) {
        alert("Error: " + err.message)
    } finally {
        setIsActionLoading(false)
    }
  }

  // --- STATS ---
  const stats = useMemo(() => {
    const totalRevenue = bookings.reduce((acc, curr) => acc + (Number(curr.total_price) || 0), 0)
    const paidRevenue = bookings
        .filter(b => b.payment_status === 'paid' || b.payment_status === 'paid_instore')
        .reduce((acc, curr) => acc + (Number(curr.total_price) || 0), 0)
    
    // Calculate Occupancy (Assuming 3 Bays * 10 Hours = 30 Slots)
    const totalHours = bookings.reduce((acc, curr) => acc + (Number(curr.duration_hours) || 0), 0)
    const occupancy = Math.min(Math.round((totalHours / 30) * 100), 100)

    return { totalRevenue, paidRevenue, occupancy, count: bookings.length }
  }, [bookings])

  const filteredBookings = bookings.filter(b => {
    const searchMatch = (b.guest_name || "").toLowerCase().includes(searchTerm.toLowerCase())
    return searchMatch
  })

  // --- LOGIN SCREEN ---
  if (!isAuthenticated) return (
    <div className="flex h-screen items-center justify-center bg-zinc-950 text-zinc-100 p-4">
        <div className="w-full max-w-sm text-center space-y-8">
            <div className="flex justify-center">
                <div className="w-20 h-20 bg-emerald-900/30 rounded-3xl flex items-center justify-center border border-emerald-500/30 shadow-[0_0_40px_rgba(16,185,129,0.1)]">
                    <Trophy className="w-10 h-10 text-emerald-500" />
                </div>
            </div>
            <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">The Mulligan</h1>
                <p className="text-zinc-500 mt-2">Admin Command Center</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
                <input 
                    type="password" 
                    placeholder="ENTER PIN" 
                    value={pin} 
                    onChange={e=>setPin(e.target.value)} 
                    className="w-full bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl text-center text-white text-2xl tracking-[0.5em] focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all placeholder:text-zinc-700 placeholder:tracking-normal font-mono" 
                    autoFocus 
                />
                <button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white p-4 rounded-xl font-bold transition-all shadow-lg shadow-emerald-900/20">
                    UNLOCK SYSTEM
                </button>
            </form>
        </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500/30 pb-20">
      
      {/* HEADER */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-900/20 rounded-xl flex items-center justify-center border border-emerald-500/20">
               <Trophy className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
                <h1 className="font-bold text-xl tracking-tight text-white leading-none">The Mulligan</h1>
                <span className="text-xs text-zinc-500 font-medium tracking-wider uppercase">Admin Dashboard</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="hidden md:flex bg-zinc-900/50 border border-zinc-800 rounded-xl p-1">
                <button onClick={() => setActiveTab("dashboard")} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'dashboard' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-400 hover:text-white'}`}>
                  Live View
                </button>
                <button onClick={() => setActiveTab("walkin")} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'walkin' ? 'bg-emerald-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white'}`}>
                  Walk-in
                </button>
             </div>
             <button onClick={() => setIsAuthenticated(false)} className="p-3 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-colors text-zinc-500">
               <LogOut className="w-5 h-5" />
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-6 md:p-8 space-y-8">
        
        {/* CONTROLS */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
           <div className="flex items-center gap-3">
               <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-1">
                    <button onClick={() => setViewMode("day")} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${viewMode === 'day' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
                        Daily
                    </button>
                    <button onClick={() => setViewMode("all")} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${viewMode === 'all' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
                        Upcoming
                    </button>
               </div>

               {viewMode === 'day' && (
                   <div className="relative">
                        <input 
                            type="date" 
                            value={currentDate} 
                            onChange={(e) => setCurrentDate(e.target.value)}
                            className="bg-zinc-900 border border-zinc-800 text-white text-sm font-medium px-4 py-2.5 rounded-xl outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
                        />
                   </div>
               )}

               <button onClick={() => fetchBookings()} className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl hover:text-emerald-400 transition-colors">
                    <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
               </button>
           </div>

           <div className="relative group w-full md:w-auto">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" />
             <input 
                type="text" 
                placeholder="Search guest name..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-80 bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all"
             />
           </div>
        </div>

        {/* KPI CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl">
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Total Revenue</p>
                <div className="flex items-end gap-2 mt-2">
                    <h3 className="text-3xl font-bold text-white">R{stats.totalRevenue.toLocaleString()}</h3>
                </div>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl">
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Banked (Paid)</p>
                <div className="flex items-end gap-2 mt-2">
                    <h3 className="text-3xl font-bold text-emerald-400">R{stats.paidRevenue.toLocaleString()}</h3>
                </div>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl">
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Bookings</p>
                <div className="flex items-end gap-2 mt-2">
                    <h3 className="text-3xl font-bold text-white">{stats.count}</h3>
                </div>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl">
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Occupancy</p>
                <div className="flex items-end gap-2 mt-2">
                    <h3 className="text-3xl font-bold text-white">{stats.occupancy}%</h3>
                    <div className="h-1.5 w-16 bg-zinc-800 rounded-full mb-2 ml-auto">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${stats.occupancy}%` }} />
                    </div>
                </div>
            </div>
        </div>

        {activeTab === 'walkin' ? (
            <div className="max-w-xl mx-auto bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl animate-in fade-in zoom-in-95">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-emerald-500" /> Walk-in Terminal
                </h2>
                <div className="space-y-6">
                    <div>
                        <label className="text-xs text-zinc-500 font-bold uppercase ml-1">Guest Name</label>
                        <input value={walkInName} onChange={e=>setWalkInName(e.target.value)} className="w-full bg-black border border-zinc-800 p-4 rounded-xl text-white mt-1 outline-none focus:border-emerald-500" placeholder="John Doe" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-zinc-500 font-bold uppercase ml-1">Time</label>
                            <input type="time" value={walkInTime} onChange={e=>setWalkInTime(e.target.value)} className="w-full bg-black border border-zinc-800 p-4 rounded-xl text-white mt-1 outline-none focus:border-emerald-500" />
                        </div>
                        <div>
                            <label className="text-xs text-zinc-500 font-bold uppercase ml-1">Players</label>
                            <select value={walkInPlayers} onChange={e=>setWalkInPlayers(Number(e.target.value))} className="w-full bg-black border border-zinc-800 p-4 rounded-xl text-white mt-1 outline-none focus:border-emerald-500">
                                {[1,2,3,4,5,6].map(n=><option key={n} value={n}>{n} Players</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-zinc-500 font-bold uppercase ml-1">Duration</label>
                        <div className="grid grid-cols-4 gap-2 mt-1">
                            {[1,2,3,4].map(h=>(
                                <button key={h} onClick={()=>setWalkInDuration(h)} className={`p-3 rounded-lg border text-sm font-bold transition-all ${walkInDuration===h ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-black border-zinc-800 text-zinc-400'}`}>{h}h</button>
                            ))}
                        </div>
                    </div>
                    <button onClick={handleWalkInSubmit} disabled={isActionLoading} className="w-full bg-white text-black font-bold p-4 rounded-xl hover:bg-zinc-200 transition-colors mt-4">
                        {isActionLoading ? "Processing..." : "Confirm & Print Receipt"}
                    </button>
                </div>
            </div>
        ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-black/20 text-zinc-500 uppercase text-xs tracking-wider font-bold">
                            <tr>
                                <th className="px-6 py-4">Date & Time</th>
                                <th className="px-6 py-4">Bay</th>
                                <th className="px-6 py-4">Guest</th>
                                <th className="px-6 py-4 text-right">Amount</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                            {filteredBookings.map(b => (
                                <tr key={b.id} className="hover:bg-zinc-800/40 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-white text-lg font-mono">{b.start_time?.slice(0,5)} <span className="text-sm text-zinc-600 font-sans">({b.duration_hours}h)</span></div>
                                        <div className="text-zinc-500 text-xs mt-1">{b.booking_date}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${
                                            b.simulator_id === 1 ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                            b.simulator_id === 2 ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                            'bg-orange-500/10 text-orange-400 border-orange-500/20'
                                        }`}>
                                            Sim {b.simulator_id}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-zinc-200 text-base">{b.guest_name}</div>
                                        <div className="text-zinc-500 text-xs">{b.guest_email}</div>
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono font-medium text-zinc-300">
                                        R{b.total_price}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                            b.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 
                                            'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                        }`}>
                                            {b.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-all">
                                            {b.payment_status !== 'paid_instore' && (
                                                <button onClick={() => handleMarkPaid(b.id)} className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all">
                                                    <DollarSign className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button onClick={() => handleDelete(b.id)} className="p-2 bg-red-500/10 text-red-500 rounded-lg border border-red-500/20 hover:bg-red-500 hover:text-white transition-all">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredBookings.length === 0 && (
                                <tr><td colSpan={6} className="text-center py-16 text-zinc-500">No bookings found for this period.</td></tr>
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
