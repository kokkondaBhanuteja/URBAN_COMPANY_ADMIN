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
import { useEffect } from 'react';


const BOOKINGS_PER_PAGE = 5;

interface IBooking {
    _id: string;
    userId:{userName: string} ;
    providerId?: { userId: { userName: string } };
    serviceId: { serviceName: string };
    status: string; // Correct field name
    scheduledDateTime: string; // Correct field name
    startedAt?: string;
    completedAt?: string;
    serviceAddress: {
        addressLine1: string;
        city: string;
    };
    pricing: { basePrice: number, finalAmount: number };
    paymentDetails: { paymentStatus: string };
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

async function fetchBookings(page: number, search: string, status: string, startDate: string, endDate: string, minPrice: string, maxPrice: string): Promise<IBookingsData> {
    const token = localStorage.getItem('admin_token');
    const url = new URL('/api/bookings', window.location.origin);
    url.searchParams.append('page', page.toString());
    url.searchParams.append('limit', BOOKINGS_PER_PAGE.toString());
    if (search) url.searchParams.append('search', search);
    if (status) url.searchParams.append('status', status);
    if (startDate) url.searchParams.append('startDate', startDate);
    if (endDate) url.searchParams.append('endDate', endDate);
    if (minPrice) url.searchParams.append('minPrice', minPrice);
    if (maxPrice) url.searchParams.append('maxPrice', maxPrice);

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

const getQuarterStartAndEnd = (date: Date) => {
  const quarter = Math.floor(date.getMonth() / 3);
  const startMonth = quarter * 3;
  const startDate = new Date(date.getFullYear(), startMonth, 1);
  const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 3, 0);
  return { startDate, endDate };
};


export default function BookingsPage() {
    const [currentPage, setCurrentPage] = useState(1);
    const [searchInput, setSearchInput] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateRange, setDateRange] = useState({startDate: '', endDate: ''});
    const [priceRange, setPriceRange] = useState({ minPrice: '', maxPrice: '' });
    const [activeSearch, setActiveSearch] = useState('');
    const [activeStatus, setActiveStatus] = useState('all');
    const [activeDateRange, setActiveDateRange] = useState({startDate: '', endDate: ''});
    const [activePriceRange, setActivePriceRange] = useState({minPrice: '', maxPrice: ''});


    const { data, isLoading, isError, refetch } = useQuery<IBookingsData>({
        queryKey: ['bookings', currentPage, activeSearch, activeStatus, activeDateRange, activePriceRange],
        queryFn: () => fetchBookings(currentPage, activeSearch, activeStatus === 'all' ? '' : activeStatus, activeDateRange.startDate, activeDateRange.endDate, activePriceRange.minPrice, activePriceRange.maxPrice),
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
        setActivePriceRange(priceRange);
    };

    const handleClearFilters = () => {
        setSearchInput('');
        setStatusFilter('all');
        setDateRange({ startDate: '', endDate: '' });
        setPriceRange({ minPrice: '', maxPrice: '' });
        setCurrentPage(1);
        setActiveSearch('');
        setActiveStatus('all');
        setActiveDateRange({ startDate: '', endDate: '' });
        setActivePriceRange({minPrice: '', maxPrice: ''});
    };

    const handleDatePreset = (preset: 'week' | 'month' | 'quarter') => {
        const now = new Date();
        let startDate: Date;
        let endDate: Date;

        switch (preset) {
            case 'week':
                startDate = new Date(now.setDate(now.getDate() - now.getDay()));
                endDate = new Date(now.setDate(now.getDate() - now.getDay() + 6));
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                break;
            case 'quarter':
                const quarterDates = getQuarterStartAndEnd(now);
                startDate = quarterDates.startDate;
                endDate = quarterDates.endDate;
                break;
            default:
                startDate = new Date();
                endDate = new Date();
        }

        setDateRange({ 
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0]
        });
        setCurrentPage(1);
    };

    useEffect(() => {
        // This effect runs whenever dateRange changes to trigger a refetch
        setActiveDateRange(dateRange);
    }, [dateRange]);


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
            <div className="flex items-center gap-2 pt-4 flex-wrap">
                <Input
                    placeholder="Search by customer, provider..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleFilter()}
                    className="max-w-sm"
                />
                <Select onValueChange={setStatusFilter} value={statusFilter}>
                    <SelectTrigger className="w-[180px]">
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
                 <div className="flex items-center gap-2">
                    <Input
                        type="date"
                        placeholder="Start Date"
                        value={dateRange.startDate}
                        onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                        className="w-auto"
                    />
                    <Input
                        type="date"
                        placeholder="End Date"
                        value={dateRange.endDate}
                        onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                        className="w-auto"
                    />
                </div>
                <Input
                  type="number"
                  placeholder="Min Price"
                  value={priceRange.minPrice}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, minPrice: e.target.value }))}
                  className="w-[120px]"
                />
                <Input
                  type="number"
                  placeholder="Max Price"
                  value={priceRange.maxPrice}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, maxPrice: e.target.value }))}
                  className="w-[120px]"
                />
                <Button onClick={handleFilter}><SearchIcon className="h-4 w-4 mr-2" />Filter</Button>
                <Button onClick={handleClearFilters} variant="outline"><FilterX className="h-4 w-4 mr-2" />Clear</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Booking Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Start Time</TableHead>
                    <TableHead>Completion Time</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Payment Status</TableHead>
                    <TableHead>Special Instructions</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Updated At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.bookings.map((booking) => (
                    <TableRow key={booking._id}>
                      <TableCell>{booking.userId.userName}</TableCell>
                      <TableCell>{booking.providerId?.userId.userName}</TableCell>
                      <TableCell>{booking.serviceId.serviceName}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeVariant(booking.status ?? '')}>{booking.status?.replace(/_/g, " ")}</Badge>
                      </TableCell>
                      <TableCell>{booking.serviceAddress.addressLine1}, {booking.serviceAddress.city}</TableCell>
                      <TableCell>{new Date(booking.scheduledDateTime).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(booking.scheduledDateTime).toLocaleTimeString()}</TableCell>
                      <TableCell>{booking.startedAt ? new Date(booking.startedAt).toLocaleTimeString() : 'N/A'}</TableCell>
                      <TableCell>{booking.completedAt ? new Date(booking.completedAt).toLocaleTimeString() : 'N/A'}</TableCell>
                      <TableCell>${ booking.pricing.finalAmount.toFixed(2) }</TableCell>
                      <TableCell>{booking.paymentDetails?.paymentStatus ?? 'N/A'}</TableCell>
                      <TableCell>{booking.specialInstructions ?? 'N/A'}</TableCell>
                      <TableCell>{new Date(booking.createdAt).toLocaleString()}</TableCell>
                      <TableCell>{new Date(booking.updatedAt).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
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