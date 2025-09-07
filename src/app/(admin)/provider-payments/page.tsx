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

async function fetchProviderPayments(searchQuery: string): Promise<IProviderPayment[]> {
  const token = localStorage.getItem("admin_token");
  const url = new URL("/api/provider-payments", window.location.origin);
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
  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);

  const { data: providerPayments, isLoading, isError, refetch } = useQuery<IProviderPayment[]>({
    queryKey: ["providerPayments", activeSearch],
    queryFn: () => fetchProviderPayments(activeSearch),
  });

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
              {providerPayments?.map((payment) => (
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}