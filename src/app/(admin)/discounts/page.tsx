"use client"

import type React from "react"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Trash2, Edit, MoreHorizontal, Percent, DollarSign } from "lucide-react"
import Loader from "@/components/shared/Loader"
import ErrorMessage from "@/components/shared/ErrorMessage"

interface IDiscount {
  _id: string
  title: string
  code: string
  discountType: "percentage" | "fixed"
  discountValue: number
  startDate: string
  endDate: string
  isActive: boolean
  usageCount: number
  maxUsage?: number
}

async function fetchDiscounts(): Promise<IDiscount[]> {
  const token = localStorage.getItem("admin_token")
  const res = await fetch("/api/discounts", {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error("Failed to fetch discounts")
  return res.json()
}

async function addDiscount(newDiscount: {
  title: string
  code: string
  discountType: "percentage" | "fixed"
  discountValue: number
  startDate: string
  endDate: string
  maxUsage?: number
}) {
  const token = localStorage.getItem("admin_token")
  const res = await fetch("/api/discounts", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(newDiscount),
  })
  if (!res.ok) throw new Error("Failed to add discount")
  return res.json()
}

async function updateDiscount(discount: Partial<IDiscount> & { _id: string }) {
  const token = localStorage.getItem("admin_token")
  const res = await fetch("/api/discounts", {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(discount),
  })
  if (!res.ok) throw new Error("Failed to update discount")
  return res.json()
}

async function deleteDiscount(discountId: string) {
  const token = localStorage.getItem("admin_token")
  const res = await fetch("/api/discounts", {
    method: "DELETE",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ id: discountId }),
  })
  if (!res.ok) throw new Error("Failed to delete discount")
  return res.json()
}

export default function DiscountsPage() {
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    code: "",
    discountType: "percentage" as "percentage" | "fixed",
    discountValue: "",
    startDate: "",
    endDate: "",
    maxUsage: "",
  })

  const {
    data: discounts,
    isLoading,
    isError,
    refetch,
  } = useQuery<IDiscount[]>({
    queryKey: ["discounts"],
    queryFn: fetchDiscounts,
  })

  const addMutation = useMutation({
    mutationFn: addDiscount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discounts"] })
      resetForm()
    },
  })

  const updateMutation = useMutation({
    mutationFn: updateDiscount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discounts"] })
      setIsEditing(null)
      resetForm()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteDiscount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discounts"] })
    },
  })

  const resetForm = () => {
    setFormData({
      title: "",
      code: "",
      discountType: "percentage",
      discountValue: "",
      startDate: "",
      endDate: "",
      maxUsage: "",
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const discountData = {
      title: formData.title,
      code: formData.code.toUpperCase(),
      discountType: formData.discountType,
      discountValue: Number.parseFloat(formData.discountValue),
      startDate: formData.startDate,
      endDate: formData.endDate,
      maxUsage: formData.maxUsage ? Number.parseInt(formData.maxUsage) : undefined,
    }

    if (isEditing) {
      updateMutation.mutate({ ...discountData, _id: isEditing })
    } else {
      addMutation.mutate(discountData)
    }
  }

  const handleEdit = (discount: IDiscount) => {
    setIsEditing(discount._id)
    setFormData({
      title: discount.title,
      code: discount.code,
      discountType: discount.discountType,
      discountValue: discount.discountValue.toString(),
      startDate: discount.startDate.split("T")[0],
      endDate: discount.endDate.split("T")[0],
      maxUsage: discount.maxUsage?.toString() || "",
    })
  }

  const handleCancel = () => {
    setIsEditing(null)
    resetForm()
  }

  const toggleDiscountStatus = (discount: IDiscount) => {
    updateMutation.mutate({ _id: discount._id, isActive: !discount.isActive })
  }

  const isDiscountActive = (discount: IDiscount) => {
    const now = new Date()
    const start = new Date(discount.startDate)
    const end = new Date(discount.endDate)
    return discount.isActive && now >= start && now <= end
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
        <ErrorMessage message="Failed to load discounts." retry={refetch} />
      </div>
    )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Discount Management</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? "Edit Discount" : "Add New Discount"}</CardTitle>
          <CardDescription>
            {isEditing ? "Update discount details" : "Create a new discount code for customers"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Discount Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Summer Sale"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="code">Discount Code</Label>
                <Input
                  id="code"
                  placeholder="e.g., SUMMER20"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="discountType">Discount Type</Label>
                <Select
                  value={formData.discountType}
                  onValueChange={(value: "percentage" | "fixed") => setFormData({ ...formData, discountType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="discountValue">
                  {formData.discountType === "percentage" ? "Percentage" : "Amount ($)"}
                </Label>
                <Input
                  id="discountValue"
                  type="number"
                  placeholder={formData.discountType === "percentage" ? "20" : "10.00"}
                  value={formData.discountValue}
                  onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="maxUsage">Max Usage (Optional)</Label>
                <Input
                  id="maxUsage"
                  type="number"
                  placeholder="100"
                  value={formData.maxUsage}
                  onChange={(e) => setFormData({ ...formData, maxUsage: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={addMutation.isPending || updateMutation.isPending}>
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
          <CardDescription>Manage all discount codes and their status</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Valid Period</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {discounts?.map((discount) => (
                <TableRow key={discount._id}>
                  <TableCell className="font-medium">{discount.title}</TableCell>
                  <TableCell>
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm">{discount.code}</code>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {discount.discountType === "percentage" ? (
                        <Percent className="h-4 w-4" />
                      ) : (
                        <DollarSign className="h-4 w-4" />
                      )}
                      {discount.discountValue}
                      {discount.discountType === "percentage" ? "%" : ""}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{new Date(discount.startDate).toLocaleDateString()}</div>
                      <div className="text-muted-foreground">to {new Date(discount.endDate).toLocaleDateString()}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {discount.usageCount}
                    {discount.maxUsage && ` / ${discount.maxUsage}`}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={isDiscountActive(discount) ? "default" : "secondary"}
                      className={
                        isDiscountActive(discount) ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                      }
                    >
                      {isDiscountActive(discount) ? "Active" : "Inactive"}
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
                        <DropdownMenuItem
                          onClick={() => toggleDiscountStatus(discount)}
                          disabled={updateMutation.isPending}
                        >
                          {discount.isActive ? "Deactivate" : "Activate"}
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
