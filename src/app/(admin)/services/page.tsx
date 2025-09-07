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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Edit, MoreHorizontal, Plus, Folder } from "lucide-react";
import Loader from "@/components/shared/Loader";
import ErrorMessage from "@/components/shared/ErrorMessage";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ITEMS_PER_PAGE = 5;

interface IService {
  _id: string;
  serviceName: string;
  basePrice: number;
  description?: string;
  category: {
    _id: string;
    categoryName: string;
  };
}

interface ICategory {
  _id: string;
  categoryName: string;
  description?: string;
  services?: IService[];
}

// All API functions are now defined here
async function fetchCategoriesWithServices(): Promise<ICategory[]> {
  const token = localStorage.getItem("admin_token");
  const res = await fetch("/api/categories-with-services", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch categories with services");
  return res.json();
}

async function addCategory(newCategory: {
  categoryName: string;
  description: string;
}) {
  const token = localStorage.getItem("admin_token");
  const res = await fetch("/api/categories", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(newCategory),
  });
  if (!res.ok) throw new Error("Failed to add category");
  return res.json();
}

async function updateCategory(category: {
  _id: string;
  categoryName: string;
  description: string;
}) {
  const token = localStorage.getItem("admin_token");
  const res = await fetch("/api/categories", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(category),
  });
  if (!res.ok) throw new Error("Failed to update category");
  return res.json();
}

async function deleteCategory(categoryId: string) {
  const token = localStorage.getItem("admin_token");
  const res = await fetch("/api/categories", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ id: categoryId }),
  });
  if (!res.ok) throw new Error("Failed to delete category");
  return res.json();
}

async function addService(newService: {
  serviceName: string;
  basePrice: number;
  category: string;
  description?: string;
}) {
  const token = localStorage.getItem("admin_token");
  const res = await fetch("/api/services", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(newService),
  });
  if (!res.ok) throw new Error("Failed to add service");
  return res.json();
}

async function updateService(service: {
  _id: string;
  serviceName: string;
  basePrice: number;
  description?: string;
}) {
  const token = localStorage.getItem("admin_token");
  const res = await fetch("/api/services", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(service),
  });
  if (!res.ok) throw new Error("Failed to update service");
  return res.json();
}

async function removeService(serviceId: string) {
  const token = localStorage.getItem("admin_token");
  const res = await fetch("/api/services", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ id: serviceId }),
  });
  if (!res.ok) throw new Error("Failed to remove service");
  return res.json();
}

export default function ServicesPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingService, setEditingService] = useState<string | null>(null);
  const [showAddServiceForCatId, setShowAddServiceForCatId] = useState<
    string | null
  >(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [categoryForm, setCategoryForm] = useState({
    categoryName: "",
    description: "",
  });
  const [serviceForm, setServiceForm] = useState({
    serviceName: "",
    basePrice: "",
    description: "",
    category: "",
  });

  const {
    data: categoriesWithServices,
    isLoading,
    isError,
    refetch,
  } = useQuery<ICategory[]>({
    queryKey: ["categories-with-services"],
    queryFn: fetchCategoriesWithServices,
  });

  const handleMutationSuccess = (message: string) => {
    toast({ title: "Success", description: message });
    queryClient.invalidateQueries({ queryKey: ["categories-with-services"] });
  };

  const handleMutationError = (error: Error, defaultMessage: string) => {
    toast({
      title: "Error",
      description: error.message || defaultMessage,
      variant: "destructive",
    });
  };

  const addCategoryMutation = useMutation({
    mutationFn: addCategory,
    onSuccess: () => {
      handleMutationSuccess("Category added successfully.");
      resetCategoryForm();
    },
    onError: (error: Error) =>
      handleMutationError(error, "Failed to add category."),
  });

  const updateCategoryMutation = useMutation({
    mutationFn: updateCategory,
    onSuccess: () => {
      handleMutationSuccess("Category updated successfully.");
      setEditingCategory(null);
      resetCategoryForm();
    },
    onError: (error: Error) =>
      handleMutationError(error, "Failed to update category."),
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => handleMutationSuccess("Category deleted successfully."),
    onError: (error: Error) =>
      handleMutationError(error, "Failed to delete category."),
  });

  const addServiceMutation = useMutation({
    mutationFn: addService,
    onSuccess: () => {
      handleMutationSuccess("Service added successfully.");
      setShowAddServiceForCatId(null);
      resetServiceForm();
    },
    onError: (error: Error) =>
      handleMutationError(error, "Failed to add service."),
  });

  const updateServiceMutation = useMutation({
    mutationFn: updateService,
    onSuccess: () => {
      handleMutationSuccess("Service updated successfully.");
      setEditingService(null);
      resetServiceForm();
    },
    onError: (error: Error) =>
      handleMutationError(error, "Failed to update service."),
  });

  const removeServiceMutation = useMutation({
    mutationFn: removeService,
    onSuccess: () => handleMutationSuccess("Service removed successfully."),
    onError: (error: Error) =>
      handleMutationError(error, "Failed to remove service."),
  });

  const resetCategoryForm = () =>
    setCategoryForm({ categoryName: "", description: "" });
  const resetServiceForm = () =>
    setServiceForm({
      serviceName: "",
      basePrice: "",
      description: "",
      category: "",
    });

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    addCategoryMutation.mutate(categoryForm);
  };
  const handleUpdateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      updateCategoryMutation.mutate({
        _id: editingCategory,
        ...categoryForm,
      });
    }
  };
  const handleEditCategory = (category: ICategory) => {
    setEditingCategory(category._id);
    setCategoryForm({
      categoryName: category.categoryName,
      description: category.description || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    if (showAddServiceForCatId) {
      addServiceMutation.mutate({
        ...serviceForm,
        basePrice: Number(serviceForm.basePrice),
        category: showAddServiceForCatId,
      });
    }
  };
  const handleUpdateService = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingService) {
      updateServiceMutation.mutate({
        _id: editingService,
        serviceName: serviceForm.serviceName,
        basePrice: Number.parseFloat(serviceForm.basePrice),
        description: serviceForm.description,
      });
    }
  };
  const handleEditService = (service: IService) => {
    setEditingService(service._id);
    setServiceForm({
      serviceName: service.serviceName,
      basePrice: service.basePrice.toString(),
      description: service.description || "",
      category: service.category._id,
    });
  };

  const totalPages = categoriesWithServices
    ? Math.ceil(categoriesWithServices.length / ITEMS_PER_PAGE)
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
        <ErrorMessage message="Failed to load data." retry={refetch} />
      </div>
    );

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">
        Services & Categories
      </h2>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5" />
            {editingCategory ? "Edit Category" : "Add New Category"}
          </CardTitle>
          <CardDescription>
            {editingCategory
              ? "Update category details"
              : "Create a new service category"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={editingCategory ? handleUpdateCategory : handleAddCategory}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="categoryName">Category Name</Label>
                <Input
                  id="categoryName"
                  placeholder="e.g., Cleaning Services"
                  value={categoryForm.categoryName}
                  onChange={(e) =>
                    setCategoryForm({
                      ...categoryForm,
                      categoryName: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoryDescription">Description</Label>
                <Input
                  id="categoryDescription"
                  placeholder="Brief description"
                  value={categoryForm.description}
                  onChange={(e) =>
                    setCategoryForm({
                      ...categoryForm,
                      description: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={
                  addCategoryMutation.isPending ||
                  updateCategoryMutation.isPending
                }
              >
                {editingCategory ? "Update Category" : "Add Category"}
              </Button>
              {editingCategory && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingCategory(null);
                    resetCategoryForm();
                  }}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manage Services</CardTitle>
          <CardDescription>
            View and manage services within each category.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {categoriesWithServices
              ?.slice(
                (currentPage - 1) * ITEMS_PER_PAGE,
                currentPage * ITEMS_PER_PAGE
              )
              .map((category) => (
                <AccordionItem value={category._id} key={category._id}>
                  <AccordionTrigger className="text-lg font-semibold">
                    {category.categoryName}
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditCategory(category)}
                      >
                        {" "}
                        <Edit className="h-4 w-4 mr-2" /> Edit Category
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          setShowAddServiceForCatId(category._id);
                          setServiceForm({
                            ...serviceForm,
                            category: category._id,
                          });
                        }}
                      >
                        {" "}
                        <Plus className="h-4 w-4 mr-2" /> Add Service
                      </Button>
                    </div>

                    {showAddServiceForCatId === category._id ||
                    (editingService &&
                      serviceForm.category === category._id) ? (
                      <Card className="my-4">
                        <CardHeader>
                          <CardTitle>
                            {editingService ? "Edit Service" : "Add Service"}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <form
                            onSubmit={
                              editingService
                                ? handleUpdateService
                                : handleAddService
                            }
                            className="space-y-4"
                          >
                            {/* Form fields for service */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="serviceName">Service Name</Label>
                                <Input
                                  id="serviceName"
                                  value={serviceForm.serviceName}
                                  onChange={(e) =>
                                    setServiceForm({
                                      ...serviceForm,
                                      serviceName: e.target.value,
                                    })
                                  }
                                  required
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="basePrice">Base Price</Label>
                                <Input
                                  id="basePrice"
                                  type="number"
                                  value={serviceForm.basePrice}
                                  onChange={(e) =>
                                    setServiceForm({
                                      ...serviceForm,
                                      basePrice: e.target.value,
                                    })
                                  }
                                  required
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="description">Description</Label>
                              <Textarea
                                id="description"
                                value={serviceForm.description}
                                onChange={(e) =>
                                  setServiceForm({
                                    ...serviceForm,
                                    description: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button type="submit">
                                {editingService ? "Update" : "Add"}
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setEditingService(null);
                                  setShowAddServiceForCatId(null);
                                  resetServiceForm();
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </form>
                        </CardContent>
                      </Card>
                    ) : null}

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Service</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {category.services?.map((service) => (
                          <TableRow key={service._id}>
                            <TableCell className="font-medium">
                              {service.serviceName}
                            </TableCell>
                            <TableCell>
                              ${service.basePrice.toFixed(2)}
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
                                    onClick={() => handleEditService(service)}
                                  >
                                    <Edit className="h-4 w-4 mr-2" /> Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      removeServiceMutation.mutate(service._id)
                                    }
                                    className="text-red-600 focus:text-red-500"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </AccordionContent>
                </AccordionItem>
              ))}
          </Accordion>
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