'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Define a basic type for the booking. You might have a more detailed one in `lib/types.ts`
interface LiveBooking {
    id: string;
    guest_name: string;
    simulator_id: number;
    slot_start: string;
    slot_end: string;
}

// This component would be your BayStatusDisplay.tsx or similar
const BayStatusDisplay = ({ bookings }: { bookings: LiveBooking[] }) => {
    // A placeholder for your actual live view UI
    return <div className="p-4 bg-gray-50 rounded-lg">Displaying {bookings.length} live bookings...</div>;
};

export function LiveViewTab() {
    const [bookings, setBookings] = useState<LiveBooking[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        const fetchInitialData = async () => {
            const { data, error } = await supabase
                .from('bookings')
                .select('id, guest_name, simulator_id, slot_start, slot_end')
                .eq('status', 'confirmed')
                .order('slot_start', { ascending: true });

            if (error) {
                console.error('Error fetching initial live view data:', error);
                setError('Failed to load initial data.');
            } else {
                setBookings(data || []);
            }
        };

        fetchInitialData();

        const channel = supabase
            .channel('realtime-bookings')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' },
                (payload) => {
                    console.log('Change received!', payload);
                    fetchInitialData(); // Re-fetch on any change
                }
            )
            .subscribe((status, err) => {
                if (status === 'CHANNEL_ERROR' || err) {
                    console.error('Subscription error:', err);
                    setError('Real-time connection failed.');
                }
            });

        // **THE CLINICAL FIX**: This cleanup function is called when the component unmounts.
        return () => {
            console.log('Cleaning up real-time subscription for Live View.');
            supabase.removeChannel(channel);
        };
    }, []); // Empty dependency array ensures this runs only on mount and unmount.

    if (error) return <div className="text-red-500 p-4">{error}</div>;

    return <BayStatusDisplay bookings={bookings} />;
}