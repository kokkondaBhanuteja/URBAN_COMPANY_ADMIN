"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Edit, MoreHorizontal, Calendar } from "lucide-react";
import Loader from "@/components/shared/Loader";
import ErrorMessage from "@/components/shared/ErrorMessage";
import { useToast } from "@/hooks/use-toast";

const ITEMS_PER_PAGE = 5;

interface IService {
  _id: string;
  serviceName: string;
}

interface ICategory {
  _id: string;
  categoryName: string;
  services?: IService[];
}

interface IDiscount {
  _id: string;
  promoCode: string;
  description?: string;
  discountType: "Category Specific" | "Service Specific" | "Global";
  discountValue: number;
  discountValueType: "percentage" | "flat";
  category?: { _id: string; categoryName: string };
  service?: { _id: string; serviceName: string };
  validFrom: string;
  validUntil: string;
  isActive: boolean;
}

async function fetchDiscounts(page: number, search: string): Promise<{ discounts: IDiscount[], totalDiscounts: number }> {
  const token = localStorage.getItem('admin_token');
  const url = new URL('/api/discounts', window.location.origin);
  url.searchParams.append('page', page.toString());
  url.searchParams.append('limit', ITEMS_PER_PAGE.toString());
  if (search) {
    url.searchParams.append('search', search);
  }
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error('Failed to fetch discounts');
  }
  return res.json();
}

async function fetchCategoriesWithServices(): Promise<ICategory[]> {
  const token = localStorage.getItem("admin_token");
  const res = await fetch("/api/categories-with-services", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch categories with services");
  return res.json();
}


async function addDiscount(discountData: Partial<IDiscount>) {
  const token = localStorage.getItem('admin_token');
  const res = await fetch('/api/discounts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(discountData),
  });
  if (!res.ok) {
    throw new Error('Failed to add discount');
  }
  return res.json();
}

async function updateDiscount(discountData: Partial<IDiscount>) {
  const token = localStorage.getItem('admin_token');
  const res = await fetch('/api/discounts', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(discountData),
  });
  if (!res.ok) {
    throw new Error('Failed to update discount');
  }
  return res.json();
}

async function deleteDiscount(id: string) {
  const token = localStorage.getItem('admin_token');
  const res = await fetch('/api/discounts', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) {
    throw new Error('Failed to delete discount');
  }
  return res.json();
}


export default function DiscountsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [editingDiscount, setEditingDiscount] = useState<IDiscount | null>(null);

  const [formState, setFormState] = useState({
    discountType: "Category Specific",
    category: "",
    service: "",
    promoCode: "",
    discountValue: "",
    discountValueType: "percentage",
    validFrom: "",
    validUntil: "",
    isActive: true,
    description: "",
  });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["discounts", currentPage, activeSearch],
    queryFn: () => fetchDiscounts(currentPage, activeSearch),
    keepPreviousData: true,
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categoriesWithServices'],
    queryFn: fetchCategoriesWithServices
  });

  const { discounts = [], totalDiscounts = 0 } = data || {};
  const totalPages = Math.ceil(totalDiscounts / ITEMS_PER_PAGE);

  const mutationOptions = {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
      setEditingDiscount(null);
      resetForm();
      toast({ title: "Success", description: "Discount saved successfully." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: 'destructive' });
    }
  };

  const addMutation = useMutation({ mutationFn: addDiscount, ...mutationOptions });
  const updateMutation = useMutation({ mutationFn: updateDiscount, ...mutationOptions });
  const deleteMutation = useMutation({ mutationFn: deleteDiscount, ...mutationOptions });


  const handleSearch = () => {
    setCurrentPage(1);
    setActiveSearch(searchInput);
  };

  const resetForm = () => {
    setFormState({
      discountType: "Category Specific",
      category: "",
      service: "",
      promoCode: "",
      discountValue: "",
      discountValueType: "percentage",
      validFrom: "",
      validUntil: "",
      isActive: true,
      description: "",
    });
  }

  const handleEdit = (discount: IDiscount) => {
    setEditingDiscount(discount);
    setFormState({
      ...discount,
      discountValue: discount.discountValue.toString(),
      category: discount.category?._id || "",
      service: discount.service?._id || "",
      validFrom: new Date(discount.validFrom).toISOString().split('T')[0],
      validUntil: new Date(discount.validUntil).toISOString().split('T')[0]
    });
  }

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this discount?")) {
      deleteMutation.mutate(id);
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formState, discountValue: parseFloat(formState.discountValue) };
    if (editingDiscount) {
      updateMutation.mutate({ _id: editingDiscount._id, ...payload });
    } else {
      addMutation.mutate(payload);
    }
  }

  const selectedCategoryData = useMemo(() => {
    return categories?.find(cat => cat._id === formState.category);
  }, [categories, formState.category]);


  if (isLoading || categoriesLoading) return <div className="flex items-center justify-center h-screen"><Loader /></div>;
  if (isError) return <ErrorMessage message="Failed to load data" retry={refetch} />;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{editingDiscount ? 'Edit Discount' : 'Create New Discount'}</CardTitle>
          <CardDescription>
            {editingDiscount ? 'Update the details for this discount.' : 'Create a new discount code for your services.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discountType">Discount Type</Label>
                <Select
                  value={formState.discountType}
                  onValueChange={(value) => setFormState({ ...formState, discountType: value, category: "", service: "" })}
                >
                  <SelectTrigger id="discountType">
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Global">Global</SelectItem>
                    <SelectItem value="Category Specific">Category Specific</SelectItem>
                    <SelectItem value="Service Specific">Service Specific</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <AnimatePresence>
                {formState.discountType !== "Global" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={formState.category}
                        onValueChange={(value) => setFormState({ ...formState, category: value, service: "" })}
                      >
                        <SelectTrigger id="category">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories?.map((category) => (
                            <SelectItem key={category._id} value={category._id}>
                              {category.categoryName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {formState.discountType === "Service Specific" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="service">Service</Label>
                      <Select
                        value={formState.service}
                        onValueChange={(value) => setFormState({ ...formState, service: value })}
                        disabled={!formState.category}
                      >
                        <SelectTrigger id="service">
                          <SelectValue placeholder="Select a service" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedCategoryData?.services?.map((service) => (
                            <SelectItem key={service._id} value={service._id}>
                              {service.serviceName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="promoCode">Promo Code</Label>
                <Input id="promoCode" value={formState.promoCode} onChange={e => setFormState({...formState, promoCode: e.target.value})} placeholder="e.g., SAVE15" />
              </div>

              <div className="flex gap-2">
                <div className="space-y-2 flex-1">
                  <Label htmlFor="discountValue">Discount Value</Label>
                  <Input id="discountValue" type="number" value={formState.discountValue} onChange={e => setFormState({...formState, discountValue: e.target.value})} placeholder="e.g., 15 or 250" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discountValueType">Type</Label>
                  <Select value={formState.discountValueType} onValueChange={(value: "percentage" | "flat") => setFormState({...formState, discountValueType: value})}>
                    <SelectTrigger id="discountValueType" className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">%</SelectItem>
                      <SelectItem value="flat">₹</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={formState.description} onChange={e => setFormState({...formState, description: e.target.value})} placeholder="A brief description for the discount." />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input id="startDate" type="date" value={formState.validFrom} onChange={e => setFormState({...formState, validFrom: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input id="endDate" type="date" value={formState.validUntil} onChange={e => setFormState({...formState, validUntil: e.target.value})} />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch id="status-toggle" checked={formState.isActive} onCheckedChange={(checked) => setFormState({...formState, isActive: checked})} />
              <Label htmlFor="status-toggle">Active</Label>
            </div>

            <div className="flex flex-col md:flex-row gap-2 pt-4">
              <Button type="submit" className="w-full md:w-auto" disabled={addMutation.isPending || updateMutation.isPending}>
                {editingDiscount ? 'Update Discount' : 'Save Discount'}
              </Button>
              <Button type="button" variant="secondary" className="w-full md:w-auto" onClick={() => { setEditingDiscount(null); resetForm(); }}>
                Cancel
              </Button>
            </div>
          </form >
        </CardContent >
      </Card >

      <Card>
        <CardHeader>
          <CardTitle>Existing Discounts</CardTitle>
          <CardDescription>
            Manage all discount codes and their status.
          </CardDescription>
          <div className="pt-4">
            <Input
              placeholder="Search by promo code..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Promo Code</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Applies To</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Validity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {discounts.map((discount) => (
                  <TableRow key={discount._id}>
                    <TableCell>{discount.promoCode}</TableCell>
                    <TableCell>{discount.description || 'N/A'}</TableCell>
                    <TableCell>{discount.discountType}</TableCell>
                    <TableCell>
                      {discount.discountType === 'Service Specific' ? discount.service?.serviceName :
                        discount.discountType === 'Category Specific' ? discount.category?.categoryName : 'Global'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {discount.discountValueType === 'flat' ? `₹${discount.discountValue}` : `${discount.discountValue}%`}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {new Date(discount.validFrom).toLocaleDateString()} - {new Date(discount.validUntil).toLocaleDateString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          discount.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }
                      >
                        {discount.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(discount)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(discount._id)} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
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
    </div >
  );
}