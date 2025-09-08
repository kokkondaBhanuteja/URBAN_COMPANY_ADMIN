"use client";

import { useState, useMemo, useRef, useEffect } from "react";
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
import { Trash2, Edit, MoreHorizontal, Calendar, X, ChevronDown, FilterX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Simple, self-contained components to replace external imports
const Loader = () => (
  <div className="flex flex-col items-center justify-center p-8">
    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
    <div className="mt-4 text-lg text-gray-600">Loading...</div>
  </div>
);

const ErrorMessage = ({ message, retry }: { message: string; retry: () => void }) => (
  <div className="flex flex-col items-center justify-center p-8 text-center">
    <div className="text-red-500 text-lg font-semibold">{message}</div>
    <Button onClick={retry} className="mt-4">
      Try Again
    </Button>
  </div>
);

const ITEMS_PER_PAGE = 5;

// Interfaces (unchanged)
interface IService {
  _id: string;
  serviceName: string;
  category: { _id: string; categoryName: string };
}

interface ICategory {
  _id: string;
  categoryName: string;
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

// --- API Functions (unchanged) ---
async function fetchDiscounts(page: number, search: string, status: string): Promise<{ discounts: IDiscount[], totalDiscounts: number }> {
  const token = localStorage.getItem('admin_token');
  const url = new URL('/api/discounts', window.location.origin);
  url.searchParams.append('page', page.toString());
  url.searchParams.append('limit', ITEMS_PER_PAGE.toString());
  if (search) {
    url.searchParams.append('search', search);
  }
  if (status && status !== 'all') {
    url.searchParams.append('status', status);
  }
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error('Failed to fetch discounts');
  }
  return res.json();
}

async function fetchCategories(): Promise<ICategory[]> {
  const token = localStorage.getItem("admin_token");
  const res = await fetch("/api/categories", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch categories");
  const data = await res.json();
  return Array.isArray(data) ? data : data.categories;
}

async function fetchServices(): Promise<IService[]> {
  const token = localStorage.getItem("admin_token");
  const res = await fetch("/api/services", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch services");
  const data = await res.json();
  return Array.isArray(data) ? data : data.services;
}

async function addDiscount(discountData: Partial<IDiscount>) {
  const token = localStorage.getItem('admin_token');
  const res = await fetch('/api/discounts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(discountData),
  });
  if (!res.ok) throw new Error('Failed to add discount');
  return res.json();
}

async function updateDiscount(discountData: Partial<IDiscount>) {
  const token = localStorage.getItem('admin_token');
  const res = await fetch('/api/discounts', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(discountData),
  });
  if (!res.ok) throw new Error('Failed to update discount');
  return res.json();
}

async function deleteDiscount(id: string) {
  const token = localStorage.getItem('admin_token');
  const res = await fetch('/api/discounts', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error('Failed to delete discount');
  return res.json();
}

export default function DiscountsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeSearch, setActiveSearch] = useState('');
  const [activeStatus, setActiveStatus] = useState('all');
  const [editingDiscount, setEditingDiscount] = useState<IDiscount | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [discountToDelete, setDiscountToDelete] = useState<string | null>(null);

  const [formState, setFormState] = useState({
    discountType: "Category Specific" as "Category Specific" | "Service Specific" | "Global",
    category: "",
    service: "",
    promoCode: "",
    discountValue: "",
    discountValueType: "percentage" as "percentage" | "flat",
    validFrom: "",
    validUntil: "",
    isActive: true,
    description: "",
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selection, setSelection] = useState<{ name: string; type: string } | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["discounts", currentPage, activeSearch, activeStatus],
    queryFn: () => fetchDiscounts(currentPage, activeSearch, activeStatus),
    keepPreviousData: true,
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({ queryKey: ['categories'], queryFn: fetchCategories });
  const { data: services = [], isLoading: servicesLoading } = useQuery({ queryKey: ['services'], queryFn: fetchServices });

  const searchableItems = useMemo(() => {
    const categoryItems = categories.map(cat => ({
      id: cat._id,
      name: cat.categoryName,
      type: 'Category Specific' as const,
      displayText: cat.categoryName,
      searchText: cat.categoryName.toLowerCase(),
    }));
    const serviceItems = services.map(srv => ({
      id: srv._id,
      name: srv.serviceName,
      type: 'Service Specific' as const,
      categoryId: srv.category._id,
      categoryName: srv.category.categoryName,
      displayText: srv.serviceName,
      searchText: `${srv.serviceName} ${srv.category.categoryName}`.toLowerCase(),
    }));
    return { 'Category Specific': categoryItems, 'Service Specific': serviceItems };
  }, [categories, services]);
  
  const searchResults = useMemo(() => {
    if (formState.discountType === 'Global') return [];
    const itemsToSearch = searchableItems[formState.discountType] || [];
    if (!searchQuery) return itemsToSearch; // Show all when empty
    return itemsToSearch.filter(item => item.searchText.includes(searchQuery.toLowerCase()));
  }, [searchQuery, formState.discountType, searchableItems]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { discounts = [], totalDiscounts = 0 } = data || {};
  const totalPages = Math.ceil(totalDiscounts / ITEMS_PER_PAGE);

  const mutationOptions = {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
      setEditingDiscount(null);
      resetForm();
      toast({ title: "Success", description: "Discount saved successfully." });
    },
    onError: (error: Error) => toast({ title: "Error", description: error.message, variant: 'destructive' })
  };

  const addMutation = useMutation({ mutationFn: addDiscount, ...mutationOptions });
  const updateMutation = useMutation({ mutationFn: updateDiscount, ...mutationOptions });
  const deleteMutation = useMutation({ mutationFn: deleteDiscount, ...mutationOptions });

  const handleSearch = () => {
    setCurrentPage(1);
    setActiveSearch(searchInput);
    setActiveStatus(statusFilter);
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setStatusFilter('all');
    setActiveSearch('');
    setActiveStatus('all');
    setCurrentPage(1);
  };

  const resetForm = () => {
    setFormState({
      discountType: "Category Specific", category: "", service: "", promoCode: "",
      discountValue: "", discountValueType: "percentage", validFrom: "", validUntil: "",
      isActive: true, description: "",
    });
    setSearchQuery('');
    setSelection(null);
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
    if (discount.discountType === 'Service Specific' && discount.service) {
      setSelection({ name: discount.service.serviceName, type: 'Service' });
    } else if (discount.discountType === 'Category Specific' && discount.category) {
      setSelection({ name: discount.category.categoryName, type: 'Category' });
    } else {
      setSelection(null);
    }
  }
  
  const handleSelection = (item: any) => {
    setSearchQuery('');
    setIsSearchOpen(false);
    if(item.type === 'Category Specific') {
        setFormState(prev => ({ ...prev, category: item.id, service: '' }));
        setSelection({ name: item.name, type: 'Category' });
    } else if (item.type === 'Service Specific') {
        setFormState(prev => ({ ...prev, category: item.categoryId, service: item.id }));
        setSelection({ name: item.name, type: 'Service' });
    }
  }

  const clearSelection = () => {
    setFormState(prev => ({ ...prev, category: '', service: '' }));
    setSelection(null);
    setSearchQuery('');
  }
  
  const handleDiscountTypeChange = (value: "Category Specific" | "Service Specific" | "Global") => {
    clearSelection();
    setFormState(prev => ({ ...prev, discountType: value }));
  }

  const handleDelete = (id: string) => {
    setDiscountToDelete(id);
    setShowDeleteModal(true);
  }

  const confirmDelete = () => {
    if (discountToDelete) {
      deleteMutation.mutate(discountToDelete);
      setDiscountToDelete(null);
      setShowDeleteModal(false);
    }
  }

  const cancelDelete = () => {
    setDiscountToDelete(null);
    setShowDeleteModal(false);
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

  if (isLoading || categoriesLoading || servicesLoading) return <div className="flex items-center justify-center h-screen"><Loader /></div>;
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discountType">Discount Type</Label>
                <Select value={formState.discountType} onValueChange={handleDiscountTypeChange}>
                  <SelectTrigger id="discountType"><SelectValue placeholder="Select a type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Global">Global</SelectItem>
                    <SelectItem value="Category Specific">Category Specific</SelectItem>
                    <SelectItem value="Service Specific">Service Specific</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <AnimatePresence>
                {formState.discountType !== 'Global' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-2"
                  >
                    <Label>Apply To</Label>
                    {selection ? (
                       <div className="flex items-center gap-2 p-3 border rounded-md bg-secondary/50">
                          <Badge variant="default" className="text-xs">
                            {selection.type === 'Category' ? 'Category' : 'Service'}
                          </Badge>
                          <span className="font-medium flex-1">{selection.name}</span>
                          <Button 
                            type="button" variant="ghost" size="sm" 
                            className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive" 
                            onClick={clearSelection}
                          ><X className="h-4 w-4" /></Button>
                       </div>
                    ) : (
                      <div className="relative" ref={searchContainerRef}>
                        <div className="relative">
                          <Input
                            placeholder={`Search for a ${formState.discountType === 'Category Specific' ? 'category' : 'service'}...`}
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            onFocus={() => setIsSearchOpen(true)}
                            autoComplete="off"
                            className="pr-10"
                          />
                          <ChevronDown className={`absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 transition-transform duration-200 ${isSearchOpen ? 'rotate-180' : ''}`} />
                        </div>
                        
                        {isSearchOpen && (
                          <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                            {searchResults.length > 0 ? (
                              <>
                                <div className="px-3 py-2 text-xs text-gray-500 border-b bg-gray-50">
                                  {searchResults.length} {formState.discountType === 'Category Specific' ? 'categories' : 'services'} available
                                </div>
                                {searchResults.map((item) => (
                                  <div 
                                    key={item.id} 
                                    className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0 transition-colors duration-150"
                                    onClick={() => handleSelection(item)}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1">
                                        <div className="font-medium text-gray-900">{item.name}</div>
                                        {item.type === 'Service Specific' && (
                                          <div className="text-xs text-gray-500 mt-1">
                                            Category: {item.categoryName}
                                          </div>
                                        )}
                                      </div>
                                      <Badge variant="outline" className="text-xs ml-2">
                                        {item.type === 'Service Specific' ? 'Service' : 'Category'}
                                      </Badge>
                                    </div>
                                  </div>
                                ))}
                              </>
                            ) : (
                              <div className="p-4 text-center text-gray-500">
                                {searchQuery 
                                  ? `No results for "${searchQuery}"`
                                  : `No ${formState.discountType === 'Category Specific' ? 'categories' : 'services'} available`
                                }
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="promoCode">Promo Code</Label>
                <Input id="promoCode" value={formState.promoCode} onChange={e => setFormState({ ...formState, promoCode: e.target.value })} placeholder="e.g., SAVE15" required />
              </div>

              <div className="flex gap-2">
                <div className="space-y-2 flex-1">
                  <Label htmlFor="discountValue">Discount Value</Label>
                  <Input id="discountValue" type="number" min="0" step="0.01" value={formState.discountValue} onChange={e => setFormState({ ...formState, discountValue: e.target.value })} placeholder="e.g., 15 or 250" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discountValueType">Type</Label>
                  <Select value={formState.discountValueType} onValueChange={(value: "percentage" | "flat") => setFormState({ ...formState, discountValueType: value })}>
                    <SelectTrigger id="discountValueType" className="w-[100px]"><SelectValue /></SelectTrigger>
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
              <Textarea id="description" value={formState.description || ''} onChange={e => setFormState({ ...formState, description: e.target.value })} placeholder="A brief description for the discount." rows={3} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input id="startDate" type="date" value={formState.validFrom} onChange={e => setFormState({ ...formState, validFrom: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input id="endDate" type="date" value={formState.validUntil} onChange={e => setFormState({ ...formState, validUntil: e.target.value })} required />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch id="status-toggle" checked={formState.isActive} onCheckedChange={(checked) => setFormState({ ...formState, isActive: checked })} />
              <Label htmlFor="status-toggle" className="text-sm font-medium">
                Active {formState.isActive ? '(Discount is currently active)' : '(Discount is inactive)'}
              </Label>
            </div>

            <div className="flex flex-col md:flex-row gap-2 pt-4">
              <Button type="submit" className="w-full md:w-auto" disabled={addMutation.isPending || updateMutation.isPending}>
                {(addMutation.isPending || updateMutation.isPending) && (<div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>)}
                {editingDiscount ? 'Update Discount' : 'Save Discount'}
              </Button>
              <Button type="button" variant="secondary" className="w-full md:w-auto" onClick={() => { setEditingDiscount(null); resetForm(); }}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Existing Discounts Table (unchanged) */}
      <Card>
        <CardHeader>
          <CardTitle>Existing Discounts</CardTitle>
          <CardDescription>Manage all discount codes and their status.</CardDescription>
          <div className="flex items-center gap-2 pt-4">
            <Input
              placeholder="Search by promo code..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="max-w-sm"
            />
            <Select onValueChange={setStatusFilter} value={statusFilter}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
            </Select>
            <Button onClick={handleSearch}>Search & Filter</Button>
            <Button variant="outline" onClick={handleClearFilters}><FilterX className="h-4 w-4 mr-2"/>Clear Filters</Button>
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
                    <TableCell className="font-medium">{discount.promoCode}</TableCell>
                    <TableCell className="max-w-xs truncate">{discount.description || 'N/A'}</TableCell>
                    <TableCell><Badge variant="outline">{discount.discountType}</Badge></TableCell>
                    <TableCell>{discount.discountType === 'Service Specific' ? discount.service?.serviceName : discount.discountType === 'Category Specific' ? discount.category?.categoryName : 'All Services'}</TableCell>
                    <TableCell><Badge variant="secondary">{discount.discountValueType === 'flat' ? `₹${discount.discountValue}` : `${discount.discountValue}%`}</Badge></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{new Date(discount.validFrom).toLocaleDateString()} - {new Date(discount.validUntil).toLocaleDateString()}</span>
                      </div>
                    </TableCell>
                    <TableCell><Badge className={discount.isActive ? "bg-green-100 text-green-800 hover:bg-green-100" : "bg-gray-100 text-gray-800 hover:bg-gray-100"}>{discount.isActive ? 'Active' : 'Inactive'}</Badge></TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(discount)}><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(discount._id)} className="text-red-600 focus:text-red-600 focus:bg-red-50"><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {discounts.length === 0 && !isLoading && (<div className="text-center py-8 text-gray-500">No discounts found. Create your first discount above.</div>)}
          {totalPages > 1 && (
            <div className="flex items-center justify-between space-x-2 py-4">
              <div className="text-sm text-gray-700">Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, totalDiscounts)} of {totalDiscounts} discounts</div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1}>Previous</Button>
                <span className="text-sm">Page {currentPage} of {totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal (unchanged) */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm mx-4"
          >
            <h3 className="text-lg font-semibold mb-2">Confirm Deletion</h3>
            <p className="text-sm text-gray-600 mb-4">Are you sure you want to delete this discount? This action cannot be undone and will permanently remove the discount code.</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={cancelDelete}>Cancel</Button>
              <Button variant="destructive" onClick={confirmDelete} disabled={deleteMutation.isPending}>
                {deleteMutation.isPending && (<div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>)}
                Delete
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}