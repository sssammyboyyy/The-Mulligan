'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { getSASTDate } from '@/lib/utils';

export function LiveViewTab() {
  const [data, setData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        // Will throw immediately if env vars are missing
        const supabase = createBrowserClient();
        const todaySAST = getSASTDate();

        const { data: bookings, error: dbError } = await supabase
          .from('booking_dashboard')
          .select('*')
          .eq('booking_date', todaySAST)
          .order('start_time', { ascending: true });

        if (dbError) throw dbError;

        setData(bookings || []);
      } catch (err: any) {
        console.error("Dashboard Fetch Error:", err);
        // Handle the specific legacy key error or missing env var error
        if (err.message?.includes('Legacy API keys') || err.code === 'PGRST301') {
          setError("Database connection failed: 401 Unauthorized. Please update to modern publishable API keys.");
        } else {
          setError(err.message || "Failed to load dashboard data. Check environment configuration.");
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  if (isLoading) return <div className="p-8 text-center animate-pulse text-zinc-500 font-black uppercase tracking-widest">Loading live view...</div>;

  return (
    <div className="w-full space-y-4">
      {/* Fallback UI: Red Banner for Errors */}
      {error && (
        <div className="p-6 mb-8 text-white bg-red-600/10 border border-red-600/30 rounded-2xl shadow-xl backdrop-blur-md">
          <h3 className="font-black text-lg uppercase tracking-tight mb-2">System Configuration Error</h3>
          <p className="text-sm font-medium opacity-90">{error}</p>
          <div className="mt-4 p-3 bg-red-600/20 rounded-xl border border-red-600/20 text-[10px] font-black uppercase tracking-widest">
            Action Required: Check Cloudflare Environment Variables or Supabase API Key Status.
          </div>
        </div>
      )}

      {/* Normal Dashboard Render */}
      {!error && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {data.map((booking) => (
            <div key={booking.id} className="p-6 bg-[#09090b] border border-zinc-900 rounded-[2rem] shadow-2xl ring-1 ring-white/5 group hover:border-zinc-700 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="font-black text-white text-lg tracking-tight leading-tight">{booking.guest_name}</p>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Bay {booking.simulator_id}</p>
                </div>
                <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-xl ${booking.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
                  {booking.status}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-4 text-zinc-400">
                <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
                <p className="text-sm font-bold">{booking.start_time}</p>
              </div>
            </div>
          ))}
          {data.length === 0 && (
            <div className="col-span-full py-20 bg-zinc-900/10 border border-zinc-900 border-dashed rounded-[2rem] text-center">
                <p className="text-sm font-black uppercase tracking-[0.3em] text-zinc-600">No bookings scheduled for today.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
