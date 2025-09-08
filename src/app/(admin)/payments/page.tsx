"use client";

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import StatCard from '@/components/shared/StatCard';
import { DollarSign, CheckCircle2, XCircle, Clock, FilterX } from 'lucide-react';
import Loader from '@/components/shared/Loader';
import ErrorMessage from '@/components/shared/ErrorMessage';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const PAYMENTS_PER_PAGE = 5;

interface IPayment {
    _id: string;
    bookingId: { _id: string } | null;
    amount: number;
    paymentStatus: string;
    paymentMethod: string;
    providerName: string;
    createdAt: string;
}

interface IPaymentsData {
    payments: IPayment[];
    totalPayments: number;
    totalRevenue: number;
}

interface IPaymentStats {
    successful: number;
    failed: number;
    pending: number;
    totalRevenue: number;
}

async function fetchPayments(page: number, search: string, status: string, date: string): Promise<IPaymentsData> {
    const token = localStorage.getItem('admin_token');
    const url = new URL('/api/payments', window.location.origin);
    url.searchParams.append('page', page.toString());
    url.searchParams.append('limit', PAYMENTS_PER_PAGE.toString());
    if (search) url.searchParams.append('search', search);
    if (status) url.searchParams.append('status', status);
    if (date) url.searchParams.append('date', date);

    const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
        throw new Error('Failed to fetch payments');
    }
    return res.json();
}

async function fetchPaymentStats(): Promise<IPaymentStats> {
    const token = localStorage.getItem('admin_token');
    const url = new URL('/api/payments', window.location.origin);
    url.searchParams.append('stats', 'true');
    const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
        throw new Error('Failed to fetch payment stats');
    }
    return res.json();
}

const getStatusBadgeVariant = (status: string) => {
    switch (status) {
        case 'successful':
            return 'bg-green-100 text-green-800';
        case 'pending':
            return 'bg-yellow-100 text-yellow-800';
        case 'failed':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

export default function PaymentsPage() {
    const [currentPage, setCurrentPage] = useState(1);
    const [searchInput, setSearchInput] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('');
    const [activeSearch, setActiveSearch] = useState('');
    const [activeStatus, setActiveStatus] = useState('all');
    const [activeDate, setActiveDate] = useState('');
    
    const { data, isLoading, isError, refetch } = useQuery<IPaymentsData>({
        queryKey: ['payments', currentPage, activeSearch, activeStatus, activeDate],
        queryFn: () => fetchPayments(currentPage, activeSearch, activeStatus === 'all' ? '' : activeStatus, activeDate),
        keepPreviousData: true,
    });

    console.log(data);
    
    const { data: stats, isLoading: statsLoading } = useQuery<IPaymentStats>({
        queryKey: ['paymentStats'],
        queryFn: fetchPaymentStats,
    });

    const handleSearchAndFilter = () => {
        setCurrentPage(1);
        setActiveSearch(searchInput);
        setActiveStatus(statusFilter);
        setActiveDate(dateFilter);
    };

    const handleClearFilters = () => {
        setCurrentPage(1);
        setSearchInput('');
        setStatusFilter('all');
        setDateFilter('');
        setActiveSearch('');
        setActiveStatus('all');
        setActiveDate('');
    };

    const totalPages = data?.totalPayments ? Math.ceil(data.totalPayments / PAYMENTS_PER_PAGE) : 0;

    if (isLoading || statsLoading) return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <Loader />
      </div>
    );
    if (isError) return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <ErrorMessage message="Failed to load payments." retry={refetch} />
      </div>
    );

  return (
    <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Revenue" value={`$${stats?.totalRevenue.toFixed(2) ?? '0.00'}`} icon={DollarSign} />
            <StatCard title="Successful Payments" value={stats?.successful ?? 0} icon={CheckCircle2} />
            <StatCard title="Pending Payments" value={stats?.pending ?? 0} icon={Clock} />
            <StatCard title="Failed Payments" value={stats?.failed ?? 0} icon={XCircle} />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Payments</CardTitle>
            <CardDescription>View and filter all payment transactions.</CardDescription>
            <div className="flex items-center gap-2 pt-4 flex-wrap">
                <Input
                    placeholder="Search by provider name or method..."
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
                        <SelectItem value="successful">Successful</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                </Select>
                 <Input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                />
                <Button onClick={handleSearchAndFilter}>Search & Filter</Button>
                <Button onClick={handleClearFilters} variant="outline"><FilterX className="h-4 w-4 mr-2" />Clear</Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking ID</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.payments && data.payments.length > 0 ? (
                  data.payments.map((payment) => (
                    <TableRow key={payment._id}>
                      <TableCell>{payment.bookingId ?? 'N/A'}</TableCell>
                      <TableCell>{payment.providerName ?? 'N/A'}</TableCell>
                      <TableCell>${payment.amount.toFixed(2)}</TableCell>
                      <TableCell>
                           <Badge className={getStatusBadgeVariant(payment.paymentStatus)}>
                              {payment.paymentStatus}
                          </Badge>
                      </TableCell>
                      <TableCell>{payment.paymentMethod}</TableCell>
                      <TableCell>{new Date(payment.createdAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      No payments found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
             {totalPages > 1 && (
                <div className="flex items-center justify-end space-x-2 py-4">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>Previous</Button>
                    <span>Page {currentPage} of {totalPages}</span>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>Next</Button>
                </div>
            )}
          </CardContent>
        </Card>
    </div>
  );
}