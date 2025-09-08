"use client";

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Loader from '@/components/shared/Loader';
import ErrorMessage from '@/components/shared/ErrorMessage';
import StatCard from '@/components/shared/StatCard';
import { Button } from '@/components/ui/button';
import { Calendar, CheckCircle, XCircle } from 'lucide-react';

const BOOKINGS_PER_PAGE = 10;

interface IBooking {
    _id: string;
    userId:{userName: string} ;
    providerId?: { userId: { userName: string } };
    serviceId: { serviceName: string };
    status: string;
    scheduledDateTime: string;
    pricing: { finalAmount: number };
}

interface IBookingsData {
    bookings: IBooking[];
    totalBookings: number;
}

interface IBookingStats {
    total: number;
    completed: number;
    cancelled: number;
}

async function fetchBookings(page: number): Promise<IBookingsData> {
    const token = localStorage.getItem('admin_token');
    const url = new URL('/api/bookings', window.location.origin);
    url.searchParams.append('page', page.toString());
    url.searchParams.append('limit', BOOKINGS_PER_PAGE.toString());
    const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
        throw new Error('Failed to fetch bookings');
    }
    return res.json();
}

async function fetchBookingStats(): Promise<IBookingStats> {
    const token = localStorage.getItem('admin_token');
    const url = new URL('/api/bookings', window.location.origin);
    url.searchParams.append('stats', 'true');
    const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
        throw new Error('Failed to fetch booking stats');
    }
    return res.json();
}

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'cancelled_by_user':
    case 'cancelled_by_provider':
      return 'bg-red-100 text-red-800';
    case 'confirmed':
      return 'bg-blue-100 text-blue-800';
    case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};


export default function BookingsPage() {
    const [currentPage, setCurrentPage] = useState(1);
    const { data, isLoading, isError, refetch } = useQuery<IBookingsData>({ 
        queryKey: ['bookings', currentPage], 
        queryFn: () => fetchBookings(currentPage),
        keepPreviousData: true,
    });

    const { data: stats, isLoading: statsLoading } = useQuery<IBookingStats>({
      queryKey: ['bookingStats'],
      queryFn: fetchBookingStats,
    });
    console.log('Stats:', stats);

    if (isLoading || statsLoading) return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <Loader />
      </div>
    );
    if (isError) return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <ErrorMessage message="Failed to load bookings." retry={refetch} />
      </div>
    );

    const totalPages = data ? Math.ceil(data.totalBookings / BOOKINGS_PER_PAGE) : 0;
    console.log(data)
  return (
    <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <StatCard title="Total Bookings" value={stats?.total ?? 0} icon={Calendar} />
            <StatCard title="Completed Bookings" value={stats?.completed ?? 0} icon={CheckCircle} />
            <StatCard title="Cancelled Bookings" value={stats?.cancelled ?? 0} icon={XCircle} />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Bookings</CardTitle>
            <CardDescription>View all bookings.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  {/* <TableHead>Booking ID</TableHead> */}
                  <TableHead>Customer</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.bookings.map((booking) => (
                  <TableRow key={booking._id}>
                    {/* <TableCell>{booking._id}</TableCell> */}
                    <TableCell>{booking.userId.userName }</TableCell>
                    <TableCell>{booking.providerId?.userId.userName }</TableCell>
                    <TableCell>{booking.serviceId.serviceName}</TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeVariant(booking.status)}>{booking.status}</Badge>
                    </TableCell>
                    <TableCell>{new Date(booking.scheduledDateTime).toLocaleDateString()}</TableCell>
                    <TableCell>${ booking.pricing.finalAmount.toFixed(2) }</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        {totalPages > 1 && (
            <div className="flex items-center justify-end space-x-2 py-4">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>Previous</Button>
                <span>Page {currentPage} of {totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>Next</Button>
            </div>
        )}
    </div>
  );
}