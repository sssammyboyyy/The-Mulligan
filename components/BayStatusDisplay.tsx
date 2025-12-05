"use client"

import { useEffect, useState } from "react"
import { Loader2, Armchair, LayoutGrid, Maximize } from "lucide-react"

type BayStatus = "available" | "occupied"

interface Bay {
  id: number
  status: BayStatus
  label: string
  icon: any
}

export default function BayStatusDisplay() {
  const [bays, setBays] = useState<Bay[]>([
    { id: 1, status: "available", label: "Lounge Bay", icon: Armchair },
    { id: 2, status: "available", label: "Middle Bay", icon: LayoutGrid },
    { id: 3, status: "available", label: "Window Bay", icon: Maximize },
  ])
  const [availableCount, setAvailableCount] = useState<number>(3)
  const [loading, setLoading] = useState(true)

  const fetchAvailability = async () => {
    try {
      const res = await fetch(`/api/bays/status?t=${Date.now()}`)
      if (!res.ok) throw new Error("Failed to fetch status")
      const data = await res.json()
      
      // Map API data to UI
      const updatedBays = [
        { id: 1, status: data.bays.find((b: any) => b.id === 1)?.status || "available", label: "Lounge Bay", icon: Armchair },
        { id: 2, status: data.bays.find((b: any) => b.id === 2)?.status || "available", label: "Middle Bay", icon: LayoutGrid },
        { id: 3, status: data.bays.find((b: any) => b.id === 3)?.status || "available", label: "Window Bay", icon: Maximize },
      ]

      setBays(updatedBays)
      setAvailableCount(data.availableCount)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching bay status:", error)
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAvailability()
    const interval = setInterval(fetchAvailability, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="w-full">
      {/* Header Badge */}
      <div className="flex justify-center mb-10">
        <div className="bg-orange-600 text-white rounded-full px-8 py-3 shadow-xl shadow-orange-900/20 flex items-center gap-3 transform hover:scale-105 transition-transform duration-300 border border-orange-400/30">
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
            </div>
          )}
          <h2 className="font-bold text-lg md:text-xl tracking-widest uppercase">
            {loading ? "CHECKING STATUS..." : `${availableCount} BAYS AVAILABLE NOW`}
          </h2>
        </div>
      </div>

      {/* Grid of Bays */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto px-4">
        {bays.map((bay) => {
          const isAvailable = bay.status === "available"
          const Icon = bay.icon

          return (
            <div
              key={bay.id}
              className={`
                relative group overflow-hidden rounded-2xl border-2 p-6 flex flex-col items-center justify-center transition-all duration-300
                ${isAvailable 
                  ? "bg-white border-emerald-500/30 hover:border-emerald-500 hover:shadow-2xl hover:shadow-emerald-900/10" 
                  : "bg-zinc-50 border-red-200 opacity-90"}
              `}
            >
              {/* Status Dot */}
              <div className={`
                absolute top-4 right-4 h-3 w-3 rounded-full shadow-sm
                ${isAvailable ? "bg-emerald-500 animate-pulse" : "bg-red-500"}
              `} />

              {/* Icon */}
              <div className={`
                mb-4 p-4 rounded-full transition-colors duration-300
                ${isAvailable ? "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100" : "bg-red-50 text-red-400"}
              `}>
                <Icon className="w-8 h-8" />
              </div>

              {/* Bay Name */}
              <h3 className="text-2xl font-serif font-bold text-zinc-800 mb-4">{bay.label}</h3>

              {/* Status Pill */}
              <div className={`
                px-6 py-2 rounded-lg text-sm font-bold uppercase tracking-wider mb-2
                ${isAvailable ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20" : "bg-zinc-800 text-zinc-400"}
              `}>
                {isAvailable ? "Available" : "Occupied"}
              </div>

              {/* Helper Text */}
              <span className={`text-xs font-semibold mt-2 ${isAvailable ? "text-emerald-700" : "text-zinc-400"}`}>
                {isAvailable ? "Walk-ins Welcome" : "Currently in Session"}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
