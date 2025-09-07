"use client"

import type React from "react"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import { Trash2, Edit, MoreHorizontal, Plus, DollarSign, Folder, Settings } from "lucide-react"
import Loader from "@/components/shared/Loader"
import ErrorMessage from "@/components/shared/ErrorMessage"

interface IService {
  _id: string
  serviceName: string
  basePrice: number
  description?: string
  category: {
    _id: string
    categoryName: string
  }
}

interface ICategory {
  _id: string
  categoryName: string
  description?: string
  services?: IService[]
}

async function fetchCategoriesWithServices(): Promise<ICategory[]> {
  const token = localStorage.getItem("admin_token")
  const res = await fetch("/api/categories-with-services", {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error("Failed to fetch categories with services")
  return res.json()
}

async function fetchCategories(): Promise<ICategory[]> {
  const token = localStorage.getItem("admin_token")
  const res = await fetch("/api/categories", {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error("Failed to fetch categories")
  return res.json()
}

async function addCategory(newCategory: { categoryName: string; description: string }) {
  const token = localStorage.getItem("admin_token")
  const res = await fetch("/api/categories", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(newCategory),
  })
  if (!res.ok) throw new Error("Failed to add category")
  return res.json()
}

async function updateCategory(category: { _id: string; categoryName: string; description: string }) {
  const token = localStorage.getItem("admin_token")
  const res = await fetch("/api/categories", {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(category),
  })
  if (!res.ok) throw new Error("Failed to update category")
  return res.json()
}

async function deleteCategory(categoryId: string) {
  const token = localStorage.getItem("admin_token")
  const res = await fetch("/api/categories", {
    method: "DELETE",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ id: categoryId }),
  })
  if (!res.ok) throw new Error("Failed to delete category")
  return res.json()
}

async function addService(newService: {
  serviceName: string
  basePrice: number
  category: string
  description?: string
}) {
  const token = localStorage.getItem("admin_token")
  const res = await fetch("/api/services", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(newService),
  })
  if (!res.ok) throw new Error("Failed to add service")
  return res.json()
}

async function updateService(service: { _id: string; serviceName: string; basePrice: number; description?: string }) {
  const token = localStorage.getItem("admin_token")
  const res = await fetch("/api/services", {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(service),
  })
  if (!res.ok) throw new Error("Failed to update service")
  return res.json()
}

async function removeService(serviceId: string) {
  const token = localStorage.getItem("admin_token")
  const res = await fetch("/api/services", {
    method: "DELETE",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ id: serviceId }),
  })
  if (!res.ok) throw new Error("Failed to remove service")
  return res.json()
}

export default function ServicesPage() {
  const queryClient = useQueryClient()

  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [editingService, setEditingService] = useState<string | null>(null)
  const [showAddService, setShowAddService] = useState<string | null>(null)

  const [categoryForm, setCategoryForm] = useState({
    categoryName: "",
    description: "",
  })

  const [serviceForm, setServiceForm] = useState({
    serviceName: "",
    basePrice: "",
    description: "",
    category: "",
  })

  const {
    data: categoriesWithServices,
    isLoading,
    isError,
    refetch,
  } = useQuery<ICategory[]>({
    queryKey: ["categories-with-services"],
    queryFn: fetchCategoriesWithServices,
  })

  const { data: categories } = useQuery<ICategory[]>({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  })

  const addCategoryMutation = useMutation({
    mutationFn: addCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories-with-services"] })
      queryClient.invalidateQueries({ queryKey: ["categories"] })
      resetCategoryForm()
    },
  })

  const updateCategoryMutation = useMutation({
    mutationFn: updateCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories-with-services"] })
      queryClient.invalidateQueries({ queryKey: ["categories"] })
      setEditingCategory(null)
      resetCategoryForm()
    },
  })

  const deleteCategoryMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories-with-services"] })
      queryClient.invalidateQueries({ queryKey: ["categories"] })
    },
  })

  const addServiceMutation = useMutation({
    mutationFn: addService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories-with-services"] })
      setShowAddService(null)
      resetServiceForm()
    },
  })

  const updateServiceMutation = useMutation({
    mutationFn: updateService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories-with-services"] })
      setEditingService(null)
      resetServiceForm()
    },
  })

  const removeServiceMutation = useMutation({
    mutationFn: removeService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories-with-services"] })
    },
  })

  const resetCategoryForm = () => {
    setCategoryForm({ categoryName: "", description: "" })
  }

  const resetServiceForm = () => {
    setServiceForm({ serviceName: "", basePrice: "", description: "", category: "" })
  }

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault()
    addCategoryMutation.mutate(categoryForm)
  }

  const handleUpdateCategory = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingCategory) {
      updateCategoryMutation.mutate({ _id: editingCategory, ...categoryForm })
    }
  }

  const handleEditCategory = (category: ICategory) => {
    setEditingCategory(category._id)
    setCategoryForm({
      categoryName: category.categoryName,
      description: category.description || "",
    })
  }

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault()
    if (showAddService) {
      addServiceMutation.mutate({ ...serviceForm, category: showAddService })
    }
  }

  const handleUpdateService = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingService) {
      updateServiceMutation.mutate({
        _id: editingService,
        serviceName: serviceForm.serviceName,
        basePrice: Number.parseFloat(serviceForm.basePrice),
        description: serviceForm.description,
      })
    }
  }

  const handleEditService = (service: IService) => {
    setEditingService(service._id)
    setServiceForm({
      serviceName: service.serviceName,
      basePrice: service.basePrice.toString(),
      description: service.description || "",
      category: service.category._id,
    })
  }

  const startAddingService = (categoryId: string) => {
    setShowAddService(categoryId)
    setServiceForm({ ...serviceForm, category: categoryId })
  }

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <Loader />
      </div>
    )

  if (isError)
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <ErrorMessage message="Failed to load services and categories." retry={refetch} />
      </div>
    )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Services & Categories</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5" />
            {editingCategory ? "Edit Category" : "Add New Category"}
          </CardTitle>
          <CardDescription>
            {editingCategory ? "Update category details" : "Create a new service category to organize your services"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={editingCategory ? handleUpdateCategory : handleAddCategory} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="categoryName">Category Name</Label>
                <Input
                  id="categoryName"
                  placeholder="e.g., Salon Services"
                  value={categoryForm.categoryName}
                  onChange={(e) => setCategoryForm({ ...categoryForm, categoryName: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="categoryDescription">Description</Label>
                <Input
                  id="categoryDescription"
                  placeholder="Brief description of the category"
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={addCategoryMutation.isPending || updateCategoryMutation.isPending}>
                {editingCategory
                  ? updateCategoryMutation.isPending
                    ? "Updating..."
                    : "Update Category"
                  : addCategoryMutation.isPending
                    ? "Adding..."
                    : "Add Category"}
              </Button>
              {editingCategory && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingCategory(null)
                    resetCategoryForm()
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
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Services by Category
          </CardTitle>
          <CardDescription>
            Manage services organized by categories. Click on a category to view and manage its services.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {categoriesWithServices && categoriesWithServices.length > 0 ? (
            <Accordion type="multiple" className="w-full">
              {categoriesWithServices.map((category) => (
                <AccordionItem key={category._id} value={category._id}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center gap-3">
                        <Folder className="h-4 w-4" />
                        <div className="text-left">
                          <div className="font-medium">{category.categoryName}</div>
                          {category.description && (
                            <div className="text-sm text-muted-foreground">{category.description}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{category.services?.length || 0} services</Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditCategory(category)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Category
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => deleteCategoryMutation.mutate(category._id)}
                              disabled={deleteCategoryMutation.isPending}
                              className="text-red-600 focus:text-red-600 focus:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Category
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-4">
                      {/* Add Service Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startAddingService(category._id)}
                        className="mb-4"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Service to {category.categoryName}
                      </Button>

                      {/* Add Service Form */}
                      {showAddService === category._id && (
                        <Card className="mb-4">
                          <CardHeader>
                            <CardTitle className="text-lg">Add New Service</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <form onSubmit={handleAddService} className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="serviceName">Service Name</Label>
                                  <Input
                                    id="serviceName"
                                    placeholder="e.g., Men's Haircut"
                                    value={serviceForm.serviceName}
                                    onChange={(e) => setServiceForm({ ...serviceForm, serviceName: e.target.value })}
                                    required
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="basePrice">Base Price ($)</Label>
                                  <Input
                                    id="basePrice"
                                    type="number"
                                    step="0.01"
                                    placeholder="25.00"
                                    value={serviceForm.basePrice}
                                    onChange={(e) => setServiceForm({ ...serviceForm, basePrice: e.target.value })}
                                    required
                                  />
                                </div>
                              </div>
                              <div>
                                <Label htmlFor="serviceDescription">Description (Optional)</Label>
                                <Textarea
                                  id="serviceDescription"
                                  placeholder="Brief description of the service"
                                  value={serviceForm.description}
                                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button type="submit" disabled={addServiceMutation.isPending}>
                                  {addServiceMutation.isPending ? "Adding..." : "Add Service"}
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => {
                                    setShowAddService(null)
                                    resetServiceForm()
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </form>
                          </CardContent>
                        </Card>
                      )}

                      {/* Edit Service Form */}
                      {editingService && category.services?.some((s) => s._id === editingService) && (
                        <Card className="mb-4">
                          <CardHeader>
                            <CardTitle className="text-lg">Edit Service</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <form onSubmit={handleUpdateService} className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="editServiceName">Service Name</Label>
                                  <Input
                                    id="editServiceName"
                                    value={serviceForm.serviceName}
                                    onChange={(e) => setServiceForm({ ...serviceForm, serviceName: e.target.value })}
                                    required
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="editBasePrice">Base Price ($)</Label>
                                  <Input
                                    id="editBasePrice"
                                    type="number"
                                    step="0.01"
                                    value={serviceForm.basePrice}
                                    onChange={(e) => setServiceForm({ ...serviceForm, basePrice: e.target.value })}
                                    required
                                  />
                                </div>
                              </div>
                              <div>
                                <Label htmlFor="editServiceDescription">Description</Label>
                                <Textarea
                                  id="editServiceDescription"
                                  value={serviceForm.description}
                                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button type="submit" disabled={updateServiceMutation.isPending}>
                                  {updateServiceMutation.isPending ? "Updating..." : "Update Service"}
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingService(null)
                                    resetServiceForm()
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </form>
                          </CardContent>
                        </Card>
                      )}

                      {/* Services List */}
                      {category.services && category.services.length > 0 ? (
                        <div className="grid gap-3">
                          {category.services.map((service) => (
                            <div
                              key={service._id}
                              className="flex items-center justify-between p-4 border rounded-lg bg-gray-50"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-3">
                                  <h4 className="font-medium">{service.serviceName}</h4>
                                  <Badge variant="outline" className="flex items-center gap-1">
                                    <DollarSign className="h-3 w-3" />
                                    {service.basePrice.toFixed(2)}
                                  </Badge>
                                </div>
                                {service.description && (
                                  <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                                )}
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEditService(service)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Service
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => removeServiceMutation.mutate(service._id)}
                                    disabled={removeServiceMutation.isPending}
                                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Service
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No services in this category yet.</p>
                          <p className="text-sm">Click "Add Service" to get started.</p>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Folder className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No categories yet</h3>
              <p>Create your first service category to get started organizing your services.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
