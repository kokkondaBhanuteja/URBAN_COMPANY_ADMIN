"use client";

import { useQuery } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import StatCard from '@/components/shared/StatCard';
import { DollarSign } from 'lucide-react';
import Loader from '@/components/shared/Loader';
import ErrorMessage from '@/components/shared/ErrorMessage';

interface IPayment {
    _id: string;
    bookingId: { _id: string } | null;
    amount: number;
    paymentStatus: string;
    paymentMethod: string;
}

interface IPaymentsData {
    payments: IPayment[];
    totalRevenue: number;
}

async function fetchPayments(): Promise<IPaymentsData> {
    const token = localStorage.getItem('admin_token');
    const res = await fetch('/api/payments', {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
        throw new Error('Failed to fetch payments');
    }
    return res.json();
}

export default function PaymentsPage() {
    const { data, isLoading, isError, refetch } = useQuery<IPaymentsData>({ queryKey: ['payments'], queryFn: fetchPayments });
    console.log(data);
    if (isLoading) return (
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
        <StatCard title="Total Revenue" value={`$${data?.totalRevenue.toFixed(2) ?? '0.00'}`} icon={DollarSign} />
        <Card>
          <CardHeader>
            <CardTitle>Payments</CardTitle>
            <CardDescription>View all payment transactions.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  {/* <TableHead>Payment ID</TableHead> */}
                  <TableHead>Booking ID</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Method</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.payments.map((payment) => (
                  <TableRow key={payment._id}>
                    {/* <TableCell>{payment._id}</TableCell> */}
                    <TableCell>{payment.bookingId?._id ?? 'N/A'}</TableCell>
                    <TableCell>${payment.amount.toFixed(2)}</TableCell>
                    <TableCell>{payment.paymentStatus}</TableCell>
                    <TableCell>{payment.paymentMethod}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
    </div>
  );
}