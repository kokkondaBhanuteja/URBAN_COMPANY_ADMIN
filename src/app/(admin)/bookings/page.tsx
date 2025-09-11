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
import { Calendar, CheckCircle, XCircle, SearchIcon, FilterX } from 'lucide-react';
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
    bookingStatus: string;
    scheduledAt: string;
    startedAt?: string;
    completedAt?: string;
    serviceAddress: {
        addressLine1: string;
        city: string;
        pincode: string;
    };
    pricing: { basePrice: number, finalAmount: number };
    specialInstructions?: string;
    createdAt: string;
    updatedAt: string;
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

async function fetchBookings(page: number, search: string, status: string, startDate: string, endDate: string, specialInstructions: string): Promise<IBookingsData> {
    const token = localStorage.getItem('admin_token');
    const url = new URL('/api/bookings', window.location.origin);
    url.searchParams.append('page', page.toString());
    url.searchParams.append('limit', BOOKINGS_PER_PAGE.toString());
    if (search) url.searchParams.append('search', search);
    if (status) url.searchParams.append('status', status);
    if (startDate) url.searchParams.append('startDate', startDate);
    if (endDate) url.searchParams.append('endDate', endDate);
    if (specialInstructions) url.searchParams.append('specialInstructions', specialInstructions);

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
    case 'cancelled':
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
    const [dateRange, setDateRange] = useState({startDate: '', endDate: ''});
    const [specialInstructionsSearch, setSpecialInstructionsSearch] = useState('');
    
    const [activeSearch, setActiveSearch] = useState('');
    const [activeStatus, setActiveStatus] = useState('all');
    const [activeDateRange, setActiveDateRange] = useState({startDate: '', endDate: ''});
    const [activeSpecialInstructions, setActiveSpecialInstructions] = useState('');

    const { data, isLoading, isError, refetch } = useQuery<IBookingsData>({
        queryKey: ['bookings', currentPage, activeSearch, activeStatus, activeDateRange, activeSpecialInstructions],
        queryFn: () => fetchBookings(currentPage, activeSearch, activeStatus === 'all' ? '' : activeStatus, activeDateRange.startDate, activeDateRange.endDate, activeSpecialInstructions),
        keepPreviousData: true,
    });

    const { data: stats, isLoading: statsLoading } = useQuery<IBookingStats>({
      queryKey: ['bookingStats'],
      queryFn: fetchBookingStats,
    });

    const totalPages = data ? Math.ceil(data.totalBookings / BOOKINGS_PER_PAGE) : 0;
    
    const handleFilter = () => {
        setCurrentPage(1);
        setActiveSearch(searchInput);
        setActiveStatus(statusFilter);
        setActiveDateRange(dateRange);
        setActiveSpecialInstructions(specialInstructionsSearch);
    };

    const handleClearFilters = () => {
        setSearchInput('');
        setStatusFilter('all');
        setDateRange({ startDate: '', endDate: '' });
        setSpecialInstructionsSearch('');
        setCurrentPage(1);
        setActiveSearch('');
        setActiveStatus('all');
        setActiveDateRange({ startDate: '', endDate: '' });
        setActiveSpecialInstructions('');
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
            <CardTitle>Filter Bookings</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Input
                    placeholder="Search by ID, customer, provider..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleFilter()}
                />
                <Input
                    placeholder="Search special instructions..."
                    value={specialInstructionsSearch}
                    onChange={(e) => setSpecialInstructionsSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleFilter()}
                />
                <Select onValueChange={setStatusFilter} value={statusFilter}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Filter by Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                </Select>
                <Input
                    type="date"
                    placeholder="Start Date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                />
                <Input
                    type="date"
                    placeholder="End Date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                />
                <div className="flex gap-2 col-span-1 sm:col-span-2 lg:col-span-1">
                    <Button onClick={handleFilter} className="w-full"><SearchIcon className="h-4 w-4 mr-2" />Filter</Button>
                    <Button onClick={handleClearFilters} variant="outline" className="w-full"><FilterX className="h-4 w-4 mr-2" />Clear</Button>
                </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Bookings</CardTitle>
            <CardDescription>View all bookings.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Booking ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Service Address</TableHead>
                    <TableHead>Pricing Details</TableHead>
                    <TableHead>Special Instructions</TableHead>
                    <TableHead>Scheduled Date/Time</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Updated At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.bookings && data.bookings.length > 0 ? (
                    data.bookings.map((booking) => (
                      <TableRow key={booking._id}>
                        <TableCell>{booking._id}</TableCell>
                        <TableCell>{booking.userId?.userName ?? 'N/A'}</TableCell>
                        <TableCell>{booking.providerId?.userId?.userName ?? 'N/A'}</TableCell>
                        <TableCell>{booking.serviceId?.serviceName ?? 'N/A'}</TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeVariant(booking.bookingStatus ?? '')}>
                            {booking.bookingStatus?.replace(/_/g, " ") ?? 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {booking.serviceAddress ? `${booking.serviceAddress.addressLine1}, ${booking.serviceAddress.city}, ${booking.serviceAddress.pincode}` : 'N/A'}
                        </TableCell>
                        <TableCell>
                           <div className="flex flex-col">
                              <span className="text-sm text-muted-foreground">Base: ${booking.pricing?.basePrice.toFixed(2) ?? 'N/A'}</span>
                              <span className="font-semibold">Final: ${booking.pricing?.finalAmount.toFixed(2) ?? 'N/A'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs">{booking.specialInstructions ?? 'N/A'}</TableCell>
                        <TableCell>{booking.scheduledAt ? new Date(booking.scheduledAt).toLocaleString() : 'N/A'}</TableCell>
                        <TableCell>{new Date(booking.createdAt).toLocaleString()}</TableCell>
                        <TableCell>{new Date(booking.updatedAt).toLocaleString()}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center">
                        No bookings found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
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