"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Loader from '@/components/shared/Loader';
import ErrorMessage from '@/components/shared/ErrorMessage';
import StatCard from '@/components/shared/StatCard';
import { Users, UserCheck, UserX, MoreHorizontal, CheckCircle2, XCircle, Star } from 'lucide-react';
import { useState } from 'react';

// Updated interface to perfectly match the provided ProviderModel.ts schema
interface IProvider {
  _id: string;
  userId: {
    userName: string;
    email: string;
    mobileNumber: string; // Add this line
  };
  isVerified: boolean; // Using the correct boolean field
  averageRating: number;
  servicesOffered: { serviceName: string }[]; // Assuming populated service data
}

interface IProviderData {
    providers: IProvider[];
    totalProviders: number;
}

// Stats will be calculated on the client side based on the isVerified boolean
interface IProviderStats {
    total: number;
    verified: number;
    rejected: number;
}

const PROVIDERS_PER_PAGE = 10;

async function fetchProviders(page: number): Promise<IProviderData> {
  const token = localStorage.getItem('admin_token');
  const res = await fetch(`/api/providers?page=${page}&limit=${PROVIDERS_PER_PAGE}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error('Failed to fetch providers');
  }
  return res.json();
}

// This API call needs to be adapted in your backend to send a boolean `isVerified`
async function updateProviderVerification({ providerId, isVerified }: { providerId: string, isVerified: boolean }) {
    const token = localStorage.getItem('admin_token');
    // Note: The backend PATCH endpoint needs to accept `{ id: string, isVerified: boolean }`
    const res = await fetch(`/api/providers`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: providerId, isVerified }),
    });
    if (!res.ok) {
        throw new Error('Failed to update provider status');
    }
    return res.json();
}

const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
}

const getMockAvailability = (id: string) => {
    const statuses = ["Available", "Busy", "Unavailable"];
    return statuses[id.charCodeAt(id.length - 1) % 3];
};

const getMockEarnings = (id: string) => {
    const amount = (id.charCodeAt(0) * 97) % 15000;
    return `$${amount.toLocaleString()}`;
}

export default function ProvidersPage() {
    const queryClient = useQueryClient();
    const [currentPage, setCurrentPage] = useState(1);

    const { data, isLoading, isError, refetch } = useQuery<IProviderData>({
        queryKey: ['providers', currentPage],
        queryFn: () => fetchProviders(currentPage),
        keepPreviousData: true
    });

    // Calculate stats on the client-side from the fetched data
    const stats: IProviderStats | undefined = data ? {
        total: data.totalProviders,
        verified: data.providers.filter(p => p.isVerified).length,
        rejected: data.providers.filter(p => !p.isVerified).length
    } : undefined;

    const mutation = useMutation({
        mutationFn: updateProviderVerification,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['providers', currentPage] });
        },
    });

  const handleVerificationChange = (providerId: string, isVerified: boolean) => {
    mutation.mutate({ providerId, isVerified });
  };

  const totalPages = data ? Math.ceil(data.totalProviders / PROVIDERS_PER_PAGE) : 0;

  if (isLoading) return (
    <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
      <Loader />
    </div>
  );
  if (isError) return (
    <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
      <ErrorMessage message="Failed to load providers." retry={refetch} />
    </div>
  );

  return (
    <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <StatCard title="Total Providers" value={stats?.total ?? 0} icon={Users} />
            <StatCard title="Verified Providers" value={stats?.verified ?? 0} icon={UserCheck} />
            <StatCard title="Rejected Providers" value={stats?.rejected ?? 0} icon={UserX} />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Service Providers</CardTitle>
            <CardDescription>Review and manage all service providers on the platform.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead>Provider Number</TableHead>
                  <TableHead>Services</TableHead>
                  <TableHead>Verification</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Availability</TableHead>
                  <TableHead>Earnings</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.providers?.map((provider) => {
                  const availability = getMockAvailability(provider._id);
                  const statusText = provider.isVerified ? "Verified" : "Rejected";

                  return (
                    <TableRow key={provider._id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                            <Avatar>
                                <AvatarImage src={`https://api.dicebear.com/8.x/initials/svg?seed=${provider.userId.userName}`} alt={provider.userId.userName} />
                                <AvatarFallback>{getInitials(provider.userId.userName)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <div>{provider.userId.userName}</div>
                                <div className="text-xs text-muted-foreground">{provider.userId.email}</div>
                            </div>
                        </div>
                      </TableCell>
                      <TableCell>{provider.userId.mobileNumber}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{provider.servicesOffered?.[0]?.serviceName || 'General Service'}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={provider.isVerified ? 'default' : 'destructive'} className={provider.isVerified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {provider.isVerified ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                            {statusText}
                        </Badge>
                      </TableCell>
                       <TableCell>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-400" />
                            {provider.averageRating.toFixed(1)}
                          </div>
                      </TableCell>
                      <TableCell>
                          <Badge variant="secondary" className={
                              availability === 'Available' ? 'bg-green-100 text-green-800' :
                              availability === 'Busy' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                          }>
                            {availability}
                          </Badge>
                      </TableCell>
                      <TableCell>{getMockEarnings(provider._id)}</TableCell>
                      <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                    onClick={() => handleVerificationChange(provider._id, true)}
                                    disabled={provider.isVerified || mutation.isPending}
                                >
                                    Mark as Verified
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => handleVerificationChange(provider._id, false)}
                                    disabled={!provider.isVerified || mutation.isPending}
                                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                >
                                    Mark as Rejected
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {totalPages > 1 && (
            <div className="flex items-center justify-end space-x-2 py-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                >
                    Previous
                </Button>
                <span className="text-sm">
                    Page {currentPage} of {totalPages}
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                >
                    Next
                </Button>
            </div>
        )}
    </div>
  );
}
