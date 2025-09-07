"use client";

import type React from "react";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Trash2,
  Edit,
  MoreHorizontal,
  Percent,
  Calendar,
} from "lucide-react";
import Loader from "@/components/shared/Loader";
import ErrorMessage from "@/components/shared/ErrorMessage";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";

const ITEMS_PER_PAGE = 5;
interface IDiscount {
  _id: string;
  promoCode: string;
  description?: string;
  discountPercentage: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
}

interface IDiscountData {
  discounts: IDiscount[];
  totalDiscounts: number;
}
async function fetchDiscounts(
  search: string,
  page: number
): Promise<IDiscountData> {
  const token = localStorage.getItem("admin_token");
  const url = new URL("/api/discounts", window.location.origin);
  if (search) url.searchParams.append("search", search);
  url.searchParams.append("page", page.toString());
  url.searchParams.append("limit", ITEMS_PER_PAGE.toString());

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch discounts");
  return res.json();
}

async function addDiscount(newDiscount: Omit<IDiscount, "_id" | "isActive">) {
  const token = localStorage.getItem("admin_token");
  const res = await fetch("/api/discounts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(newDiscount),
  });
  if (!res.ok)
    throw new Error((await res.json()).error || "Failed to add discount");
  return res.json();
}

async function updateDiscount(
  discount: Partial<IDiscount> & { _id: string }
) {
  const token = localStorage.getItem("admin_token");
  const res = await fetch("/api/discounts", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(discount),
  });
  if (!res.ok) throw new Error("Failed to update discount");
  return res.json();
}

async function deleteDiscount(discountId: string) {
  const token = localStorage.getItem("admin_token");
  const res = await fetch("/api/discounts", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ id: discountId }),
  });
  if (!res.ok) throw new Error("Failed to delete discount");
  return res.json();
}

export default function DiscountsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [activeFilters, setActiveFilters] = useState({ search: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({
    promoCode: "",
    description: "",
    discountPercentage: "",
    validFrom: "",
    validUntil: "",
  });

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery<IDiscountData>({
    queryKey: ["discounts", activeFilters, currentPage],
    queryFn: () => fetchDiscounts(activeFilters.search, currentPage),
  });

  const handleMutationSuccess = (message: string) => {
    toast({ title: "Success", description: message });
    queryClient.invalidateQueries({
      queryKey: ["discounts", activeFilters, currentPage],
    });
  };

  const handleMutationError = (error: Error, defaultMessage: string) => {
    toast({
      title: "Error",
      description: error.message || defaultMessage,
      variant: "destructive",
    });
  };

  const addMutation = useMutation({
    mutationFn: addDiscount,
    onSuccess: () => {
      handleMutationSuccess("Discount added successfully.");
      resetForm();
    },
    onError: (error: Error) =>
      handleMutationError(error, "Failed to add discount."),
  });

  const updateMutation = useMutation({
    mutationFn: updateDiscount,
    onSuccess: () => {
      handleMutationSuccess("Discount updated successfully.");
      setIsEditing(null);
      resetForm();
    },
    onError: (error: Error) =>
      handleMutationError(error, "Failed to update discount."),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDiscount,
    onSuccess: () => handleMutationSuccess("Discount deleted successfully."),
    onError: (error: Error) =>
      handleMutationError(error, "Failed to delete discount."),
  });

  const resetForm = () => {
    setFormData({
      promoCode: "",
      description: "",
      discountPercentage: "",
      validFrom: "",
      validUntil: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const discountData = {
      promoCode: formData.promoCode.toUpperCase(),
      description: formData.description,
      discountPercentage: Number.parseFloat(formData.discountPercentage),
      validFrom: formData.validFrom,
      validUntil: formData.validUntil,
    };

    if (isEditing) {
      updateMutation.mutate({ ...discountData, _id: isEditing });
    } else {
      addMutation.mutate(discountData);
    }
  };

  const handleEdit = (discount: IDiscount) => {
    setIsEditing(discount._id);
    setFormData({
      promoCode: discount.promoCode,
      description: discount.description || "",
      discountPercentage: discount.discountPercentage.toString(),
      validFrom: discount.validFrom.split("T")[0],
      validUntil: discount.validUntil.split("T")[0],
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancel = () => {
    setIsEditing(null);
    resetForm();
  };

  const toggleDiscountStatus = (discount: IDiscount) => {
    updateMutation.mutate({ _id: discount._id, isActive: !discount.isActive });
  };

  const isDateActive = (startDate: string, endDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    return now >= start && now <= end;
  };

  const handleSearchAndFilter = () => {
    setCurrentPage(1);
    setActiveFilters({ search: searchInput });
  };

  const totalPages = data
    ? Math.ceil(data.totalDiscounts / ITEMS_PER_PAGE)
    : 0;

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <Loader />
      </div>
    );

  if (isError)
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <ErrorMessage message="Failed to load discounts." retry={refetch} />
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">
          Discount Management
        </h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {isEditing ? "Edit Discount" : "Add New Discount"}
          </CardTitle>
          <CardDescription>
            {isEditing
              ? "Update discount details"
              : "Create a new discount code for customers"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="promoCode">Discount Code</Label>
                <Input
                  id="promoCode"
                  placeholder="e.g., SUMMER20"
                  value={formData.promoCode}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      promoCode: e.target.value.toUpperCase(),
                    })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discountPercentage">Percentage (%)</Label>
                <Input
                  id="discountPercentage"
                  type="number"
                  placeholder="20"
                  value={formData.discountPercentage}
                  onChange={(e) =>
                    setFormData({ ...formData, discountPercentage: e.target.value })
                  }
                  required
                  min="0"
                  max="100"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                placeholder="e.g., 20% off on all summer services"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="validFrom">Start Date</Label>
                <Input
                  id="validFrom"
                  type="date"
                  value={formData.validFrom}
                  onChange={(e) =>
                    setFormData({ ...formData, validFrom: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="validUntil">End Date</Label>
                <Input
                  id="validUntil"
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) =>
                    setFormData({ ...formData, validUntil: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={addMutation.isPending || updateMutation.isPending}
              >
                {isEditing
                  ? updateMutation.isPending
                    ? "Updating..."
                    : "Update Discount"
                  : addMutation.isPending
                  ? "Adding..."
                  : "Add Discount"}
              </Button>
              {isEditing && (
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Discounts</CardTitle>
          <CardDescription>
            Manage all discount codes and their status
          </CardDescription>
          <div className="flex items-center gap-2 pt-4">
            <Input
              placeholder="Search by promo code..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearchAndFilter()}
              className="max-w-sm"
            />
            <Button onClick={handleSearchAndFilter}>Search</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Validity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.discounts.map((discount) => {
                const dateActive = isDateActive(
                  discount.validFrom,
                  discount.validUntil
                );
                const fullyActive = discount.isActive && dateActive;

                let statusText = "Inactive";
                if (fullyActive) statusText = "Active";
                else if (!discount.isActive) statusText = "Disabled";
                else if (!dateActive) statusText = "Expired/Pending";

                return (
                  <TableRow key={discount._id}>
                    <TableCell>
                      <Badge variant="secondary">{discount.promoCode}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Percent className="h-4 w-4 text-muted-foreground" />
                        {discount.discountPercentage}%
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {new Date(discount.validFrom).toLocaleDateString()}{" "}
                          to {new Date(discount.validUntil).toLocaleDateString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          fullyActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }
                      >
                        {statusText}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Switch
                          checked={discount.isActive}
                          onCheckedChange={() => toggleDiscountStatus(discount)}
                          aria-label="Toggle discount status"
                        />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleEdit(discount)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => deleteMutation.mutate(discount._id)}
                              disabled={deleteMutation.isPending}
                              className="text-red-600 focus:text-red-600 focus:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
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
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, totalPages))
                }
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}