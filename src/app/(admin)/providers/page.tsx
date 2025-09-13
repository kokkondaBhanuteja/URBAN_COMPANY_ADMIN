// src/app/(admin)/providers/page.tsx
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
  FilterX,
} from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PROVIDERS_PER_PAGE = 5;

interface IProvider {
  _id: string;
  userId: {
    userName: string;
    email: string;
    mobileNumber: string;
  };
  bio: string;
  servicesOffered: { serviceName: string }[];
  isVerified: boolean;
  isActive: boolean;
  averageRating?: number;
  availability: {
    startTime: string;
    endTime: string;
  }[];
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
  search: string,
  verificationStatus: string,
  rating: string
): Promise<IProviderData> {
  const token = localStorage.getItem("admin_token");
  const url = new URL("/api/providers", window.location.origin);
  url.searchParams.append("page", page.toString());
  url.searchParams.append("limit", PROVIDERS_PER_PAGE.toString());
  if (search) {
    url.searchParams.append("search", search);
  }
  if (verificationStatus && verificationStatus !== "all") {
    url.searchParams.append("isVerified", verificationStatus);
  }
  if (rating && rating !== "all") {
    url.searchParams.append("rating", rating);
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
  const [verificationFilter, setVerificationFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [activeSearch, setActiveSearch] = useState("");
  const [activeVerification, setActiveVerification] = useState("all");
  const [activeRating, setActiveRating] = useState("all");

  const { data, isLoading, isError, refetch } = useQuery<IProviderData>({
    queryKey: [
      "providers",
      currentPage,
      activeSearch,
      activeVerification,
      activeRating,
    ],
    queryFn: () =>
      fetchProviders(
        currentPage,
        activeSearch,
        activeVerification,
        activeRating
      ),
    keepPreviousData: true,
  });

  const { data: stats, isLoading: statsLoading } = useQuery<IProviderStats>({
    queryKey: ["providerStats"],
    queryFn: fetchProviderStats,
  });

  const { providers, totalProviders } = data || {
    providers: [],
    totalProviders: 0,
  };

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

  const handleVerificationChange = (
    providerId: string,
    isVerified: boolean
  ) => {
    mutation.mutate({ providerId, isVerified });
  };

  const totalPages = Math.ceil(totalProviders / PROVIDERS_PER_PAGE);

  const handleSearch = () => {
    setCurrentPage(1);
    setActiveSearch(searchInput);
    setActiveVerification(verificationFilter);
    setActiveRating(ratingFilter);
  };

  const handleClearFilters = () => {
    setCurrentPage(1);
    setSearchInput("");
    setVerificationFilter("all");
    setRatingFilter("all");
    setActiveSearch("");
    setActiveVerification("all");
    setActiveRating("all");
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
          <div className="flex flex-wrap items-center gap-2 pt-4">
            <Input
              placeholder="Search by name or email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
              className="max-w-sm"
            />
            <Select
              onValueChange={setVerificationFilter}
              value={verificationFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Verification Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="true">Verified</SelectItem>
                <SelectItem value="false">Unverified</SelectItem>
              </SelectContent>
            </Select>
            <Select onValueChange={setRatingFilter} value={ratingFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="5">5 Stars</SelectItem>
                <SelectItem value="4">4 Stars & up</SelectItem>
                <SelectItem value="3">3 Stars & up</SelectItem>
                <SelectItem value="2">2 Stars & up</SelectItem>
                <SelectItem value="1">1 Star & up</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch}>Search & Filter</Button>
            <Button variant="outline" onClick={handleClearFilters}>
              <FilterX className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table className="w-full">
              <TableHeader>
                <TableRow>
                  <TableHead style={{ minWidth: '250px' }}>Provider</TableHead>
                  <TableHead style={{ minWidth: '200px' }}>Bio</TableHead>
                  <TableHead style={{ minWidth: '200px' }}>Services</TableHead>
                  <TableHead style={{ minWidth: '150px' }}>Verification</TableHead>
                  <TableHead style={{ minWidth: '120px' }}>Rating</TableHead>
                  <TableHead style={{ minWidth: '120px' }}>Availability</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {providers && providers.length > 0 ? (
                  providers.map((provider) => {
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
                            <div className="overflow-hidden">
                              <div className="truncate font-semibold">{provider.userId.userName}</div>
                              <div className="text-xs text-muted-foreground truncate">
                                {provider.userId.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="truncate">
                          {provider.bio || "N/A"}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {provider.servicesOffered.map(service => (
                              <Badge key={service.serviceName} variant="outline">{service.serviceName}</Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              provider.isVerified ? "default" : "destructive"
                            }
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
                          {provider.availability &&
                          provider.availability.length > 0 ? (
                            <Badge
                              variant="secondary"
                              className={
                                !provider.isActive
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }
                            >
                              {!provider.isActive
                                ? "Available"
                                : "Unavailable"}
                            </Badge>
                          ) : (
                            "N/A"
                          )}
                        </TableCell>
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
                                disabled={
                                  provider.isVerified || mutation.isPending
                                }
                              >
                                Mark as Verified
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleVerificationChange(provider._id, false)
                                }
                                disabled={
                                  !provider.isVerified || mutation.isPending
                                }
                                className="text-red-600 focus:text-red-600 focus:bg-red-50"
                              >
                                Mark as Unverified
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      No providers found.
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