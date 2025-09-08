"use client";

import { useState } from "react";
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
import { Trash2, Edit, MoreHorizontal, Percent, Calendar } from "lucide-react";

// --- DUMMY DATA ---
const dummyCategories = [
  { id: "salon", name: "Salon" },
  { id: "cleaning", name: "Cleaning" },
  { id: "repairs", name: "Repairs" },
];

const dummyServices = {
  salon: [
    { id: "haircut", name: "Haircut" },
    { id: "manicure", name: "Manicure" },
  ],
  cleaning: [
    { id: "deep-cleaning", name: "Deep Cleaning" },
    { id: "sofa-cleaning", name: "Sofa Cleaning" },
  ],
  repairs: [
    { id: "ac-repair", name: "AC Repair" },
    { id: "plumbing", name: "Plumbing" },
  ],
};

const dummyDiscounts = [
  {
    id: "1",
    discountType: "Category Specific",
    category: "Salon",
    service: null,
    value: "15%",
    validity: "2024-01-01 to 2024-12-31",
    status: "Active",
  },
  {
    id: "2",
    discountType: "Service Specific",
    category: "Cleaning",
    service: "Deep Cleaning",
    value: "₹250",
    validity: "2024-03-15 to 2024-09-15",
    status: "Active",
  },
  {
    id: "3",
    discountType: "Category Specific",
    category: "Repairs",
    service: null,
    value: "10%",
    validity: "2024-06-01 to 2024-08-31",
    status: "Inactive",
  },
    {
    id: "4",
    discountType: "Service Specific",
    category: "Salon",
    service: "Manicure",
    value: "₹100",
    validity: "2024-07-01 to 2024-07-31",
    status: "Active",
  },
  {
    id: "5",
    discountType: "Category Specific",
    category: "Cleaning",
    service: null,
    value: "20%",
    validity: "2023-11-01 to 2024-01-31",
    status: "Expired",
  },
  {
    id: "6",
    discountType: "Service Specific",
    category: "Repairs",
    service: "AC Repair",
    value: "₹500",
    validity: "2024-05-01 to 2024-06-30",
    status: "Active",
  },
];
// --------------------

const ITEMS_PER_PAGE = 5;

export default function DiscountsPage() {
  const [discountType, setDiscountType] = useState("Category Specific");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(dummyDiscounts.length / ITEMS_PER_PAGE);
  const paginatedDiscounts = dummyDiscounts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Discount Management</h2>

      <Card>
        <CardHeader>
          <CardTitle>Add New Discount</CardTitle>
          <CardDescription>Create a new discount code for customers.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discountType">Discount Type</Label>
                <Select onValueChange={setDiscountType} defaultValue={discountType}>
                  <SelectTrigger id="discountType">
                    <SelectValue placeholder="Select discount type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Category Specific">Category Specific</SelectItem>
                    <SelectItem value="Service Specific">Service Specific</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select onValueChange={setSelectedCategory}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {dummyCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <AnimatePresence>
              {discountType === "Service Specific" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-2 pt-4">
                    <Label htmlFor="service">Service</Label>
                    <Select disabled={!selectedCategory}>
                      <SelectTrigger id="service">
                        <SelectValue placeholder="Select a service" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedCategory &&
                          dummyServices[selectedCategory as keyof typeof dummyServices]?.map((service) => (
                            <SelectItem key={service.id} value={service.id}>
                              {service.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="discountValue">Discount Value</Label>
                    <Input id="discountValue" type="number" placeholder="e.g., 15 or 250" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="discountValueType">Discount Value Type</Label>
                     <Select defaultValue="percentage">
                       <SelectTrigger id="discountValueType">
                         <SelectValue />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="percentage">% Percentage</SelectItem>
                         <SelectItem value="flat">₹ Flat</SelectItem>
                       </SelectContent>
                     </Select>
                </div>
            </div>


            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input id="startDate" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input id="endDate" type="date" />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
                <Switch id="status-toggle" />
                <Label htmlFor="status-toggle">Active</Label>
            </div>

            <div className="flex flex-col md:flex-row gap-2 pt-4">
              <Button type="submit" className="w-full md:w-auto">Save Discount</Button>
              <Button type="reset" variant="secondary" className="w-full md:w-auto">Reset</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Discounts</CardTitle>
          <CardDescription>
            Manage all discount codes and their status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Discount Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Validity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedDiscounts.map((discount) => (
                <TableRow key={discount.id}>
                  <TableCell>{discount.discountType}</TableCell>
                  <TableCell>{discount.category}</TableCell>
                  <TableCell>{discount.service || "N/A"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{discount.value}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{discount.validity}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        discount.status === "Active"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }
                    >
                      {discount.status}
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
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50">
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