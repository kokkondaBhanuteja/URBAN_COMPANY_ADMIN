// src/app/(admin)/bookings/page.tsx
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
import { Calendar, CheckCircle, XCircle, SearchIcon } from 'lucide-react';
import {
  Input,
} from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


const BOOKINGS_PER_PAGE = 5;

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

async function fetchBookings(page: number, search: string, status: string): Promise<IBookingsData> {
    const token = localStorage.getItem('admin_token');
    const url = new URL('/api/bookings', window.location.origin);
    url.searchParams.append('page', page.toString());
    url.searchParams.append('limit', BOOKINGS_PER_PAGE.toString());
    if (search) url.searchParams.append('search', search);
    if (status) url.searchParams.append('status', status);

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
    const [searchInput, setSearchInput] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [activeSearch, setActiveSearch] = useState('');
    const [activeStatus, setActiveStatus] = useState('all');

    const { data, isLoading, isError, refetch } = useQuery<IBookingsData>({
        queryKey: ['bookings', currentPage, activeSearch, activeStatus],
        queryFn: () => fetchBookings(currentPage, activeSearch, activeStatus === 'all' ? '' : activeStatus),
        keepPreviousData: true,
    });

    const { data: stats, isLoading: statsLoading } = useQuery<IBookingStats>({
      queryKey: ['bookingStats'],
      queryFn: fetchBookingStats,
    });

    const totalPages = data ? Math.ceil(data.totalBookings / BOOKINGS_PER_PAGE) : 0;
    
    const handleSearchAndFilter = () => {
        setCurrentPage(1);
        setActiveSearch(searchInput);
        setActiveStatus(statusFilter);
    };


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
            <div className="flex items-center gap-2 pt-4">
                <Input
                    placeholder="Search customer, provider, or service..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearchAndFilter()}
                    className="max-w-sm"
                />
                <Select onValueChange={setStatusFilter} value={statusFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="requested">Requested</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="assigned">Assigned</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled_by_user">Cancelled by User</SelectItem>
                        <SelectItem value="cancelled_by_provider">Cancelled by Provider</SelectItem>
                    </SelectContent>
                </Select>
                <Button onClick={handleSearchAndFilter}><SearchIcon className="h-4 w-4 mr-2" />Search & Filter</Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
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
                    <TableCell>{booking.userId.userName }</TableCell>
                    <TableCell>{booking.providerId?.userId.userName }</TableCell>
                    <TableCell>{booking.serviceId.serviceName}</TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeVariant(booking.status ?? '')}>{booking.status?.replace(/_/g, " ")}</Badge>
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