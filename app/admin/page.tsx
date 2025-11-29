"use client"

import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"

// Initialize Supabase Client for the Browser
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Duration options for the dropdown
const DURATION_OPTIONS = [1, 1.5, 2, 2.5, 3, 3.5, 4]

export default function AdminDashboard() {
  // --- STATE ---
  const [pin, setPin] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  
  // Dashboard Data
  const [bookings, setBookings] = useState<any[]>([])
  
  // Walk-in Form State
  const [walkInName, setWalkInName] = useState("")
  const [walkInTime, setWalkInTime] = useState("09:00")
  const [walkInDate, setWalkInDate] = useState(new Date().toISOString().split('T')[0])
  const [walkInDuration, setWalkInDuration] = useState(1)
  const [walkInPlayers, setWalkInPlayers] = useState(1)

  // --- ACTIONS ---

  // 1. PIN LOGIN
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (pin === "1234") {
      setIsAuthenticated(true)
      fetchBookings()
    } else {
      setError("Incorrect PIN")
    }
  }

  // 2. FETCH BOOKINGS
  const fetchBookings = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("booking_date", walkInDate)
      .neq("status", "cancelled")
      .order("start_time", { ascending: true })
    
    if (data) setBookings(data)
    if (error) console.error("Fetch Error:", error)
    setLoading(false)
  }

  // 3. CREATE WALK-IN (FIXED: Uses Admin Route + Instant Confirmation)
  const handleWalkIn = async () => {
    if (!walkInName || !walkInTime) return alert("Please fill in details")
    
    setLoading(true)
    try {
      // CHANGED: Use the dedicated Admin/Walk-in Endpoint
      const res = await fetch("/api/bookings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_date: walkInDate,
          start_time: walkInTime,
          duration_hours: walkInDuration,
          players: walkInPlayers, 
          session_type: "quickplay", 
          guest_name: walkInName,
          guest_email: "walkin@themulligan.org", // Dummy email for record
          total_price: 0, // Walk-ins pay at the counter, tracking value optional here
          payment_status: "completed" // <--- FORCE CONFIRMED STATUS
        }),
      })

      const result = await res.json()
      
      if (!res.ok) {
        throw new Error(result.error || "Failed to create booking")
      }

      // CHANGED: Show clean message with Assigned Bay
      alert(`✅ Walk-in Confirmed!\n\n👉 ASSIGN TO: Simulator ${result.assigned_bay}`)
      
      // Reset Form
      setWalkInName("")
      fetchBookings() 

    } catch (err: any) {
      console.error(err)
      alert(`❌ Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Auto-refresh when date changes
  useEffect(() => {
    if (isAuthenticated) fetchBookings()
  }, [walkInDate, isAuthenticated])

  // --- RENDER ---

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <form onSubmit={handleLogin} className="w-full max-w-sm rounded bg-white p-8 shadow">
          <h2 className="mb-6 text-center text-2xl font-bold text-green-900">Admin Access</h2>
          {error && <p className="mb-4 text-center text-sm text-red-600">{error}</p>}
          <input
            type="password"
            placeholder="Enter PIN"
            className="mb-4 w-full rounded border p-2"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            autoFocus
          />
          <button type="submit" className="w-full rounded bg-green-900 py-2 text-white hover:bg-green-800">
            Unlock Dashboard
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Store Dashboard</h1>
          <button onClick={() => setIsAuthenticated(false)} className="text-sm text-red-600 underline">Logout</button>
        </div>

        {/* --- CONTROLS --- */}
        <div className="mb-8 grid gap-6 md:grid-cols-2">
          
          {/* 1. Add Walk-in */}
          <div className="rounded-lg bg-white p-6 shadow border border-green-100">
            <h3 className="mb-4 text-lg font-semibold text-green-800">⛳ Add Walk-in Booking</h3>
            <div className="space-y-3">
              <input 
                className="w-full rounded border p-2" 
                placeholder="Customer Name" 
                value={walkInName}
                onChange={e => setWalkInName(e.target.value)}
              />
              <div className="flex gap-2">
                <input 
                  type="date" 
                  className="w-1/2 rounded border p-2" 
                  value={walkInDate}
                  onChange={e => setWalkInDate(e.target.value)}
                />
                <input 
                  type="time" 
                  className="w-1/2 rounded border p-2" 
                  value={walkInTime}
                  onChange={e => setWalkInTime(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <select 
                    className="w-1/2 rounded border p-2"
                    value={walkInDuration}
                    onChange={(e) => setWalkInDuration(Number(e.target.value))}
                  >
                    {DURATION_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt} Hours</option>
                    ))}
                </select>
                <select 
                    className="w-1/2 rounded border p-2"
                    value={walkInPlayers}
                    onChange={(e) => setWalkInPlayers(Number(e.target.value))}
                  >
                    {[1,2,3,4,5,6,7,8].map(n => (
                      <option key={n} value={n}>{n} Players</option>
                    ))}
                </select>
              </div>

              <button 
                onClick={handleWalkIn}
                disabled={loading}
                className="w-full rounded bg-green-700 py-3 font-bold text-white hover:bg-green-800 disabled:opacity-50 transition-colors"
              >
                {loading ? "Processing..." : "Confirm & Pay In-Store"}
              </button>
            </div>
          </div>

          {/* 2. Stats / Filter */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-4 text-lg font-semibold text-gray-800">📅 Daily View</h3>
             <input 
                  type="date" 
                  className="mb-4 w-full rounded border p-2 text-lg" 
                  value={walkInDate}
                  onChange={e => setWalkInDate(e.target.value)}
              />
            <div className="text-center py-4 bg-gray-50 rounded">
              <p className="text-gray-500">Active Bookings Today</p>
              <p className="text-5xl font-bold text-green-700">{bookings.length}</p>
            </div>
          </div>
        </div>

        {/* --- BOOKINGS TABLE --- */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Bay</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {bookings.length === 0 ? (
                <tr><td colSpan={5} className="p-6 text-center text-gray-500">No bookings found for this date.</td></tr>
              ) : (
                bookings.map((b) => (
                  <tr key={b.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-bold text-gray-900">
                      {b.start_time.slice(0,5)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      <span className="font-semibold text-gray-700">Simulator {b.simulator_id}</span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {b.guest_name}
                      <div className="text-xs text-gray-400">{b.session_type}</div>
                    </td>
                     <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {b.duration_hours} hrs
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-bold leading-5 ${
                        b.status === 'confirmed' ? 'bg-green-100 text-green-800' : 
                        b.status === 'pending' ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {b.status.toUpperCase()}
                      </span>
                      {b.payment_status === 'paid_instore' && (
                        <div className="text-xs text-green-600 mt-1 font-medium">In-Store Payment</div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  )
}
