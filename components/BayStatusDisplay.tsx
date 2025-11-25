"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

type BayStatus = "available" | "occupied"

interface Bay {
  id: number
  status: BayStatus
  label: string
}

export default function BayStatusDisplay() {
  // Default state: 3 Green Bays (Optimistic UI)
  const [bays, setBays] = useState<Bay[]>([
    { id: 1, status: "available", label: "Bay 1" },
    { id: 2, status: "available", label: "Bay 2" },
    { id: 3, status: "available", label: "Bay 3" },
  ])
  const [availableCount, setAvailableCount] = useState<number>(3)
  const [loading, setLoading] = useState(true)

  const fetchAvailability = async () => {
    try {
      // 1. Fetch from the API we just created
      // 't' param prevents browser caching
      const res = await fetch(`/api/bays/status?t=${Date.now()}`)
      
      if (!res.ok) throw new Error("Failed to fetch status")
      
      const data = await res.json()
      
      // 2. Update the UI
      setBays(data.bays)
      setAvailableCount(data.availableCount)
      setLoading(false)
    } catch (error) {
      console.error("Error fetching bay status:", error)
      // Stop loading spinner even if error, keeping default state
      setLoading(false)
    }
  }

  useEffect(() => {
    // Initial fetch on load
    fetchAvailability()

    // Poll every 30 seconds
    const interval = setInterval(fetchAvailability, 30000)

    // Cleanup
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="w-full">
      {/* Header Badge */}
      <div className="flex justify-center mb-8">
        <div className="bg-orange-500 rounded-full px-8 py-3 shadow-lg flex items-center gap-3">
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-white" />
          ) : (
            // Pulsing Dot Animation
            <div className="relative flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-white"></span>
            </div>
          )}
          
          <h2 className="text-white font-bold text-xl md:text-2xl tracking-wide uppercase">
            {loading ? "CHECKING STATUS..." : `${availableCount} BAYS AVAILABLE NOW`}
          </h2>
        </div>
      </div>

      {/* Grid of Bays */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {bays.map((bay) => (
          <div
            key={bay.id}
            className={`
              relative border-2 rounded-xl p-6 flex flex-col items-center justify-center transition-all duration-500
              ${
                bay.status === "available"
                  ? "border-green-500 bg-green-50/50"
                  : "border-red-500 bg-red-50/50"
              }
            `}
          >
            {/* Status Dot */}
            <div
              className={`
                h-8 w-8 rounded-full mb-4 shadow-sm transition-colors duration-500
                ${bay.status === "available" ? "bg-green-500" : "bg-red-500"}
              `}
            />

            {/* Bay Name */}
            <h3 className="text-xl font-bold text-gray-800 mb-2">{bay.label}</h3>

            {/* Status Pill */}
            <span
              className={`
                px-4 py-1 rounded-md text-sm font-bold text-white uppercase tracking-wider transition-colors duration-500
                ${bay.status === "available" ? "bg-gray-800" : "bg-yellow-600"}
              `}
            >
              {bay.status === "available" ? "Available" : "Occupied"}
            </span>

            {/* Helper Text */}
            {bay.status === "available" ? (
               <span className="mt-3 text-xs font-semibold text-green-700">Walk-ins Welcome</span>
            ) : (
               <span className="mt-3 text-xs font-semibold text-red-700">Currently in Session</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
