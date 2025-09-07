"use client";

import { useQuery } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Loader from '@/components/shared/Loader';
import ErrorMessage from '@/components/shared/ErrorMessage';

interface IBooking {
    _id: string;
    consumerId: { userName: string };
    providerId?: { userId: { userName: string } };
    serviceId: { serviceName: string };
    bookingStatus: string;
    scheduledAt: string;
    totalPrice: number;
}

async function fetchBookings() {
    const token = localStorage.getItem('admin_token');
    const res = await fetch('/api/bookings', {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
        throw new Error('Failed to fetch bookings');
    }
    return res.json();
}

export default function BookingsPage() {
    const { data: bookings, isLoading, isError, refetch } = useQuery<IBooking[]>({ queryKey: ['bookings'], queryFn: fetchBookings });

    if (isLoading) return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <Loader />
      </div>
    );
    if (isError) return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <ErrorMessage message="Failed to load bookings." retry={refetch} />
      </div>
    );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bookings</CardTitle>
        <CardDescription>View all bookings.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Booking ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Price</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings?.map((booking) => (
              <TableRow key={booking._id}>
                <TableCell>{booking._id}</TableCell>
                <TableCell>{booking.consumerId.userName}</TableCell>
                <TableCell>{booking.providerId?.userId.userName || 'N/A'}</TableCell>
                <TableCell>{booking.serviceId.serviceName}</TableCell>
                <TableCell>
                  <Badge>{booking.bookingStatus}</Badge>
                </TableCell>
                <TableCell>{new Date(booking.scheduledAt).toLocaleDateString()}</TableCell>
                <TableCell>${booking.totalPrice.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
