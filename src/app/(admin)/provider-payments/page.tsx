"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Loader from "@/components/shared/Loader";
import ErrorMessage from "@/components/shared/ErrorMessage";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, Search, CheckCircle } from "lucide-react";

interface IProviderPayment {
  _id: string;
  provider: {
    userName: string;
    email: string;
  };
  totalEarnings: number;
  pendingPayouts: number;
  lastPayoutDate?: string;
  payoutSchedule: string;
}

const PAYMENTS_PER_PAGE = 5;

async function fetchProviderPayments(page: number, searchQuery: string): Promise<{providerPayments: IProviderPayment[], totalProviders: number}> {
  const token = localStorage.getItem("admin_token");
  const url = new URL("/api/provider-payments", window.location.origin);
  url.searchParams.append('page', page.toString());
  url.searchParams.append('limit', PAYMENTS_PER_PAGE.toString());
  if (searchQuery) {
    url.searchParams.append("search", searchQuery);
  }
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error("Failed to fetch provider payments");
  }
  return res.json();
}

async function processPayouts(providerIds: string[]) {
    const token = localStorage.getItem('admin_token');
    const res = await fetch('/api/provider-payments/process-payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ providerIds }),
    });
    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to process payouts');
    }
    return res.json();
}


export default function ProviderPaymentsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);

  const { data, isLoading, isError, refetch } = useQuery<{ providerPayments: IProviderPayment[], totalProviders: number}>({
    queryKey: ["providerPayments", currentPage, activeSearch],
    queryFn: () => fetchProviderPayments(currentPage, activeSearch),
    keepPreviousData: true
  });

  const providerPayments = data?.providerPayments || [];
  const totalProviders = data?.totalProviders || 0;
  const totalPages = Math.ceil(totalProviders / PAYMENTS_PER_PAGE);

  const processPayoutsMutation = useMutation({
    mutationFn: processPayouts,
    onSuccess: (data) => {
        toast({ title: "Success", description: data.message });
        setSelectedProviders([]);
        queryClient.invalidateQueries({ queryKey: ["providerPayments"] });
    },
    onError: (error: Error) => {
        toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const handleSearch = () => {
    setCurrentPage(1);
    setActiveSearch(searchInput);
  };

  const handleSelectProvider = (providerId: string) => {
    setSelectedProviders(prev =>
        prev.includes(providerId)
            ? prev.filter(id => id !== providerId)
            : [...prev, providerId]
    );
  };

  const handleProcessPayouts = () => {
    if (selectedProviders.length > 0) {
        processPayoutsMutation.mutate(selectedProviders);
    } else {
        toast({ title: "No providers selected", description: "Please select at least one provider to process payouts.", variant: "destructive" });
    }
  };


  if (isLoading) return <div className="flex items-center justify-center h-[calc(100vh-8rem)]"><Loader /></div>;
  if (isError) return <div className="flex items-center justify-center h-[calc(100vh-8rem)]"><ErrorMessage message="Failed to load provider payments." retry={refetch} /></div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Provider Payments</CardTitle>
          <CardDescription>Manage and process payouts for service providers.</CardDescription>
           <div className="flex items-center gap-2 pt-4">
              <Input
                  placeholder="Search by provider name or email..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="max-w-sm"
              />
              <Button onClick={handleSearch}><Search className="h-4 w-4 mr-2" />Search</Button>
          </div>
        </CardHeader>
        <CardContent>
           <div className="mb-4 flex justify-end">
              <Button onClick={handleProcessPayouts} disabled={selectedProviders.length === 0 || processPayoutsMutation.isPending}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {processPayoutsMutation.isPending ? 'Processing...' : `Process Payouts (${selectedProviders.length})`}
              </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead></TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Total Earnings</TableHead>
                <TableHead>Pending Payouts</TableHead>
                <TableHead>Last Payout</TableHead>
                <TableHead>Schedule</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {providerPayments && providerPayments.length > 0 ? (
                providerPayments.map((payment) => (
                  <TableRow key={payment._id}>
                     <TableCell>
                        <Input
                            type="checkbox"
                            checked={selectedProviders.includes(payment._id)}
                            onChange={() => handleSelectProvider(payment._id)}
                            className="h-4 w-4"
                        />
                    </TableCell>
                    <TableCell>
                        <div className="font-medium">{payment.provider.userName}</div>
                        <div className="text-sm text-muted-foreground">{payment.provider.email}</div>
                    </TableCell>
                    <TableCell>
                        <Badge variant="secondary" className="text-base">
                            <DollarSign className="h-4 w-4 mr-1" />
                            {payment.totalEarnings.toFixed(2)}
                        </Badge>
                    </TableCell>
                    <TableCell>
                         <Badge variant="outline" className="text-base text-red-600">
                            <DollarSign className="h-4 w-4 mr-1" />
                            {payment.pendingPayouts.toFixed(2)}
                        </Badge>
                    </TableCell>
                    <TableCell>{payment.lastPayoutDate ? new Date(payment.lastPayoutDate).toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell>{payment.payoutSchedule}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    No provider payments found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {totalPages > 1 && (
        <div className="flex items-center justify-end space-x-2 py-4">
            <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
            >
                Previous
            </Button>
            <span>
                Page {currentPage} of {totalPages}
            </span>
            <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
            >
                Next
            </Button>
        </div>
      )}
    </div>
  );
}