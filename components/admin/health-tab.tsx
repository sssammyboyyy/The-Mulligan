'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { RefreshCw } from 'lucide-react';

// Define a basic type for anomalous bookings.
type AnomalousBooking = {
    id: string;
    guest_name: string | null;
    guest_email: string | null;
    yoco_payment_id: string | null;
    created_at: string;
    total_price: number;
};

export function HealthTab() {
    const [anomalies, setAnomalies] = useState<AnomalousBooking[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [reconcilingId, setReconcilingId] = useState<string | null>(null);

    const fetchAnomalies = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        const adminPin = sessionStorage.getItem('admin-pin');
        if (!adminPin) {
            setError("Admin PIN not found. Please re-authenticate.");
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/admin/anomalies', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin: adminPin }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || `Failed to fetch anomalies with status: ${response.status}`);
            }

            const data = await response.json();
            setAnomalies(data.anomalies || []);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        // Prompt for PIN on initial load if not in session storage
        if (!sessionStorage.getItem('admin-pin')) {
            const pin = prompt("Enter Admin PIN to view system health:");
            if (pin) {
                sessionStorage.setItem('admin-pin', pin);
            }
        }
        fetchAnomalies();
    }, [fetchAnomalies]);

    const handleReconcile = async (bookingId: string) => {
        setReconcilingId(bookingId);
        const adminPin = sessionStorage.getItem('admin-pin');
        if (!adminPin) {
            alert("Admin PIN not found. Please refresh and re-enter.");
            setReconcilingId(null);
            return;
        }

        const response = await fetch('/api/reconcile-payments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookingId, pin: adminPin }),
        });

        const result = await response.json();
        setReconcilingId(null);

        if (response.ok) {
            const reconciledBooking = result.results?.find((r: any) => r.bookingId === bookingId);
            if (reconciledBooking?.healed) {
                alert(`Sync Complete: Booking ${bookingId} was successfully healed and confirmed.`);
            } else {
                alert(`Sync Checked: Yoco reports the payment for ${bookingId} is not successful (Status: ${reconciledBooking?.yocoStatus || 'N/A'}). No action taken.`);
            }
            fetchAnomalies(); // Refresh the list
        } else {
            alert(`Reconciliation failed: ${result.error || 'Unknown error'}`);
        }
    };

    if (error) return <div className="text-red-500 p-4">Error: {error}</div>;

    return (
        <div className="p-4 border rounded-md">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h2 className="text-xl font-semibold">System Health</h2>
                    <p className="text-sm text-gray-500">
                        Bookings with a payment attempt that are not yet confirmed.
                    </p>
                </div>
                <Button onClick={fetchAnomalies} disabled={isLoading} variant="outline">
                    <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    {isLoading ? 'Refreshing...' : 'Refresh List'}
                </Button>
            </div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Guest</TableHead>
                        <TableHead>Created At</TableHead>
                        <TableHead>Yoco ID</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {anomalies.map((booking) => (
                        <TableRow key={booking.id} className="bg-red-50 hover:bg-red-100">
                            <TableCell>{booking.guest_name || 'N/A'}<br /><span className="text-xs text-gray-500">{booking.guest_email}</span></TableCell>
                            <TableCell>{new Date(booking.created_at).toLocaleString()}</TableCell>
                            <TableCell><Badge variant="secondary">{booking.yoco_payment_id}</Badge></TableCell>
                            <TableCell className="text-right">
                                <Button size="sm" onClick={() => handleReconcile(booking.id)} disabled={reconcilingId === booking.id}>
                                    <RefreshCw className={`mr-2 h-4 w-4 ${reconcilingId === booking.id ? 'animate-spin' : ''}`} />
                                    {reconcilingId === booking.id ? 'Syncing...' : 'Sync'}
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            {anomalies.length === 0 && !isLoading && (
                <div className="text-center py-8 text-gray-500">No anomalies found. The system is healthy.</div>
            )}
        </div>
    );
}