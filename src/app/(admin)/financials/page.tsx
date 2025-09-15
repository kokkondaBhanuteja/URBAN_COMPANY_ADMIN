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
import { DollarSign, TrendingUp, TrendingDown, Wallet, FilterX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


// API call function
async function fetchFinancials(page: number, filters: { type: string, startDate: string, endDate: string }) {
  const token = localStorage.getItem("admin_token");
  const url = new URL("/api/financials", window.location.origin);
  url.searchParams.append("page", page.toString());
  if (filters.type && filters.type !== 'all') {
    url.searchParams.append('type', filters.type);
  }
  if (filters.startDate) {
    url.searchParams.append('startDate', filters.startDate);
  }
  if (filters.endDate) {
    url.searchParams.append('endDate', filters.endDate);
  }
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
  const [filters, setFilters] = useState({
    type: "all",
    startDate: "",
    endDate: "",
  });

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["financials", currentPage, filters],
    queryFn: () => fetchFinancials(currentPage, filters),
    keepPreviousData: true,
  });

  const handleClearFilters = () => {
    setFilters({
      type: "all",
      startDate: "",
      endDate: "",
    });
  };

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
            <CardTitle>Filter Transactions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-4">
        <Select
            value={filters.type}
            onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Transaction Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="revenue">Revenue</SelectItem>
              <SelectItem value="commission">Commission</SelectItem>
              <SelectItem value="payout">Payout</SelectItem>
              <SelectItem value="refund">Refund</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="date"
            placeholder="Start Date"
            value={filters.startDate}
            onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
            className="max-w-sm"
            />
          <Input
            type="date"
            placeholder="End Date"
            value={filters.endDate}
            onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
            className="max-w-sm"
            />
          <Button onClick={handleClearFilters} variant="outline"><FilterX className="h-4 w-4 mr-2" />Clear</Button>
        </CardContent>
      </Card>

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
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Platform Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.ledger.transactions.map((tx: any) => (
                <TableRow key={tx._id}>
                  <TableCell>{new Date(tx.transactionDate).toLocaleString()}</TableCell>
                  <TableCell><Badge className={getTransactionTypeBadge(tx.type)}>{tx.type}</Badge></TableCell>
                  <TableCell>{tx.description}</TableCell>
                  <TableCell className={`text-right font-medium ${tx.credit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.credit > 0 ? formatCurrency(tx.credit) : formatCurrency(tx.debit)}
                  </TableCell>
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