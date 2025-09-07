"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Loader from "@/components/shared/Loader";
import ErrorMessage from "@/components/shared/ErrorMessage";
import StatCard from "@/components/shared/StatCard";
import {
  Users,
  UserCheck,
  UserX,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  Star,
} from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";

const PROVIDERS_PER_PAGE = 5;

interface IProvider {
  _id: string;
  userId: {
    userName: string;
    email: string;
    mobileNumber: string;
  };
  servicesOffered: { serviceName: string }[];
  isVerified: boolean;
  averageRating?: number;
}

interface IProviderData {
  providers: IProvider[];
  totalProviders: number;
}

interface IProviderStats {
  total: number;
  verified: number;
  rejected: number;
}

async function fetchProviders(
  page: number,
  search: string
): Promise<IProviderData> {
  const token = localStorage.getItem("admin_token");
  const url = new URL("/api/providers", window.location.origin);
  url.searchParams.append("page", page.toString());
  url.searchParams.append("limit", PROVIDERS_PER_PAGE.toString());
  if (search) {
    url.searchParams.append("search", search);
  }
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error("Failed to fetch providers");
  }
  return res.json();
}

async function fetchProviderStats(): Promise<IProviderStats> {
  const token = localStorage.getItem("admin_token");
  const url = new URL("/api/providers", window.location.origin);
  url.searchParams.append("stats", "true");
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error("Failed to fetch provider stats");
  }
  return res.json();
}

async function updateProviderVerification({
  providerId,
  isVerified,
}: {
  providerId: string;
  isVerified: boolean;
}) {
  const token = localStorage.getItem("admin_token");
  const res = await fetch(`/api/providers`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ id: providerId, isVerified }),
  });

  if (!res.ok) {
    throw new Error("Failed to update provider verification");
  }

  return res.json();
}

const getMockAvailability = (id: string) => {
  const hash = id
    .split("")
    .reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
  const statuses = ["Available", "Busy", "Offline"];
  return statuses[Math.abs(hash) % statuses.length];
};

const getMockEarnings = (id: string) => {
  const hash = id
    .split("")
    .reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
  return `$${(Math.abs(hash) % 10000).toFixed(2)}`;
};

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
};

export default function ProvidersPage() {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState("");

  const { data, isLoading, isError, refetch } = useQuery<IProviderData>({
    queryKey: ["providers", currentPage, activeSearch],
    queryFn: () => fetchProviders(currentPage, activeSearch),
    keepPreviousData: true,
  });

  const { data: stats, isLoading: statsLoading } = useQuery<IProviderStats>({
    queryKey: ["providerStats"],
    queryFn: fetchProviderStats,
  });

  const { providers, totalProviders } = data || { providers: [], totalProviders: 0 };

  const mutation = useMutation({
    mutationFn: updateProviderVerification,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["providers"],
      });
      queryClient.invalidateQueries({
        queryKey: ["providerStats"],
      });
    },
  });

  const handleVerificationChange = (providerId: string, isVerified: boolean) => {
    mutation.mutate({ providerId, isVerified });
  };

  const totalPages = Math.ceil(totalProviders / PROVIDERS_PER_PAGE);

  const handleSearch = () => {
    setCurrentPage(1);
    setActiveSearch(searchInput);
  };

  if (isLoading || statsLoading)
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <Loader />
      </div>
    );
  if (isError)
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <ErrorMessage message="Failed to load providers." retry={refetch} />
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Providers"
          value={stats?.total ?? 0}
          icon={Users}
        />
        <StatCard
          title="Verified Providers"
          value={stats?.verified ?? 0}
          icon={UserCheck}
        />
        <StatCard
          title="Unverified Providers"
          value={stats?.rejected ?? 0}
          icon={UserX}
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Service Providers</CardTitle>
          <CardDescription>
            Review and manage all service providers on the platform.
          </CardDescription>
          <div className="flex items-center gap-2 pt-4">
            <Input
              placeholder="Search by name or email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
              className="max-w-sm"
            />
            <Button onClick={handleSearch}>Search</Button>
          </div>
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
              {providers.map((provider) => {
                const availability = getMockAvailability(provider._id);
                const statusText = provider.isVerified
                  ? "Verified"
                  : "Unverified";

                return (
                  <TableRow key={provider._id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage
                            src={`https://api.dicebear.com/8.x/initials/svg?seed=${provider.userId.userName}`}
                            alt={provider.userId.userName}
                          />
                          <AvatarFallback>
                            {getInitials(provider.userId.userName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div>{provider.userId.userName}</div>
                          <div className="text-xs text-muted-foreground">
                            {provider.userId.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{provider.userId.mobileNumber}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {provider.servicesOffered?.[0]?.serviceName || "General"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={provider.isVerified ? "default" : "destructive"}
                        className={
                          provider.isVerified
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }
                      >
                        {provider.isVerified ? (
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                        ) : (
                          <XCircle className="h-3 w-3 mr-1" />
                        )}
                        {statusText}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-400" />
                        {typeof provider.averageRating === "number"
                          ? provider.averageRating.toFixed(1)
                          : "N/A"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          availability === "Available"
                            ? "bg-green-100 text-green-800"
                            : availability === "Busy"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }
                      >
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
                            onClick={() =>
                              handleVerificationChange(provider._id, true)
                            }
                            disabled={provider.isVerified || mutation.isPending}
                          >
                            Mark as Verified
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleVerificationChange(provider._id, false)
                            }
                            disabled={!provider.isVerified || mutation.isPending}
                            className="text-red-600 focus:text-red-600 focus:bg-red-50"
                          >
                            Mark as Unverified
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