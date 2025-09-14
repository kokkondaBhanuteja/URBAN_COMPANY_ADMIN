"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import StatCard from "@/components/shared/StatCard";
import Loader from "@/components/shared/Loader";
import ErrorMessage from "@/components/shared/ErrorMessage";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DollarSign, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// API call function
async function fetchFinancials(page: number) {
  const token = localStorage.getItem("admin_token");
  const url = new URL("/api/financials", window.location.origin);
  url.searchParams.append("page", page.toString());
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error("Failed to fetch financial data");
  }
  return res.json();
}

export default function FinancialsPage() {
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["financials", currentPage],
    queryFn: () => fetchFinancials(currentPage),
    keepPreviousData: true,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const getTransactionTypeBadge = (type: string) => {
    switch (type) {
      case 'revenue': return 'bg-sky-100 text-sky-800';
      case 'commission': return 'bg-green-100 text-green-800';
      case 'payout': return 'bg-red-100 text-red-800';
      case 'refund': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) return <div className="flex items-center justify-center h-[calc(100vh-8rem)]"><Loader /></div>;
  if (isError) return <div className="flex items-center justify-center h-[calc(100vh-8rem)]"><ErrorMessage message={error.message} retry={refetch} /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Financials</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Revenue" value={formatCurrency(data?.summary.totalRevenue || 0)} icon={DollarSign} />
        <StatCard title="Total Payouts" value={formatCurrency(data?.summary.totalPayouts || 0)} icon={TrendingUp} />
        <StatCard title="Gross Profit (Commission)" value={formatCurrency(data?.summary.grossProfit || 0)} icon={TrendingDown} />
        <StatCard title="Admin Wallet Balance" value={formatCurrency(data?.summary.adminWalletBalance || 0)} icon={Wallet} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Platform Ledger</CardTitle>
          <CardDescription>An immutable record of all financial transactions.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Credit</TableHead>
                <TableHead className="text-right">Debit</TableHead>
                <TableHead className="text-right">Platform Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.ledger.transactions.map((tx: any) => (
                <TableRow key={tx._id}>
                  <TableCell>{new Date(tx.transactionDate).toLocaleString()}</TableCell>
                  <TableCell><Badge className={getTransactionTypeBadge(tx.type)}>{tx.type}</Badge></TableCell>
                  <TableCell>{tx.description}</TableCell>
                  <TableCell className="text-right text-green-600">{tx.credit > 0 ? formatCurrency(tx.credit) : '-'}</TableCell>
                  <TableCell className="text-right text-red-600">{tx.debit > 0 ? formatCurrency(tx.debit) : '-'}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(tx.platformBalance)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {(!data?.ledger.transactions || data.ledger.transactions.length === 0) && (
            <div className="text-center py-10">No transactions found.</div>
          )}
        </CardContent>
      </Card>

      {data?.ledger.totalPages > 1 && (
        <div className="flex items-center justify-end space-x-2 py-4">
            <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
            >
                Previous
            </Button>
            <span>Page {currentPage} of {data.ledger.totalPages}</span>
            <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, data.ledger.totalPages))}
                disabled={currentPage === data.ledger.totalPages}
            >
                Next
            </Button>
        </div>
      )}
    </div>
  );
}