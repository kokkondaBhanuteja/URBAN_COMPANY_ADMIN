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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  CreditCard,
  Building2,
  Wallet,
  MoreHorizontal,
  Edit,
  CheckCircle2,
  XCircle,
  DollarSign,
  Users,
  AlertCircle,
} from "lucide-react"
import Loader from "@/components/shared/Loader"
import ErrorMessage from "@/components/shared/ErrorMessage"
import StatCard from "@/components/shared/StatCard"

interface IPaymentMethod {
  _id: string
  type: "bank" | "paypal" | "stripe" | "venmo"
  accountDetails: {
    accountNumber?: string
    routingNumber?: string
    accountHolderName?: string
    email?: string
    stripeAccountId?: string
  }
  isVerified: boolean
  isDefault: boolean
}

interface IProviderPayment {
  _id: string
  providerId: string
  provider: {
    userName: string
    email: string
    avatar?: string
  }
  paymentMethods: IPaymentMethod[]
  totalEarnings: number
  pendingPayouts: number
  lastPayoutDate?: string
  payoutSchedule: "weekly" | "biweekly" | "monthly"
}

async function fetchProviderPayments(): Promise<IProviderPayment[]> {
  const token = localStorage.getItem("admin_token")
  const res = await fetch("/api/provider-payments", {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error("Failed to fetch provider payments")
  return res.json()
}

async function updatePaymentMethod(data: {
  providerId: string
  paymentMethodId: string
  updates: Partial<IPaymentMethod>
}) {
  const token = localStorage.getItem("admin_token")
  const res = await fetch("/api/provider-payments/payment-method", {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Failed to update payment method")
  return res.json()
}

async function addPaymentMethod(data: {
  providerId: string
  type: string
  accountDetails: any
}) {
  const token = localStorage.getItem("admin_token")
  const res = await fetch("/api/provider-payments/payment-method", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error("Failed to add payment method")
  return res.json()
}

async function processPayouts(providerIds: string[]) {
  const token = localStorage.getItem("admin_token")
  const res = await fetch("/api/provider-payments/process-payouts", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ providerIds }),
  })
  if (!res.ok) throw new Error("Failed to process payouts")
  return res.json()
}

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
}

const getPaymentMethodIcon = (type: string) => {
  switch (type) {
    case "bank":
      return <Building2 className="h-4 w-4" />
    case "paypal":
      return <Wallet className="h-4 w-4" />
    case "stripe":
      return <CreditCard className="h-4 w-4" />
    case "venmo":
      return <DollarSign className="h-4 w-4" />
    default:
      return <CreditCard className="h-4 w-4" />
  }
}

const getPaymentMethodLabel = (type: string) => {
  switch (type) {
    case "bank":
      return "Bank Account"
    case "paypal":
      return "PayPal"
    case "stripe":
      return "Stripe"
    case "venmo":
      return "Venmo"
    default:
      return "Unknown"
  }
}

export default function ProviderPaymentsPage() {
  const queryClient = useQueryClient()
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)
  const [showAddPayment, setShowAddPayment] = useState(false)
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<string | null>(null)

  const [paymentForm, setPaymentForm] = useState({
    type: "bank",
    accountHolderName: "",
    accountNumber: "",
    routingNumber: "",
    email: "",
    stripeAccountId: "",
  })

  const {
    data: providerPayments,
    isLoading,
    isError,
    refetch,
  } = useQuery<IProviderPayment[]>({
    queryKey: ["provider-payments"],
    queryFn: fetchProviderPayments,
  })

  const updatePaymentMutation = useMutation({
    mutationFn: updatePaymentMethod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provider-payments"] })
      setEditingPaymentMethod(null)
    },
  })

  const addPaymentMutation = useMutation({
    mutationFn: addPaymentMethod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provider-payments"] })
      setShowAddPayment(false)
      resetPaymentForm()
    },
  })

  const processPayoutsMutation = useMutation({
    mutationFn: processPayouts,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provider-payments"] })
    },
  })

  const resetPaymentForm = () => {
    setPaymentForm({
      type: "bank",
      accountHolderName: "",
      accountNumber: "",
      routingNumber: "",
      email: "",
      stripeAccountId: "",
    })
  }

  const handleVerifyPaymentMethod = (providerId: string, paymentMethodId: string) => {
    updatePaymentMutation.mutate({
      providerId,
      paymentMethodId,
      updates: { isVerified: true },
    })
  }

  const handleSetDefaultPaymentMethod = (providerId: string, paymentMethodId: string) => {
    updatePaymentMutation.mutate({
      providerId,
      paymentMethodId,
      updates: { isDefault: true },
    })
  }

  const handleAddPaymentMethod = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProvider) return

    const accountDetails: any = {
      accountHolderName: paymentForm.accountHolderName,
    }

    if (paymentForm.type === "bank") {
      accountDetails.accountNumber = paymentForm.accountNumber
      accountDetails.routingNumber = paymentForm.routingNumber
    } else if (paymentForm.type === "paypal" || paymentForm.type === "venmo") {
      accountDetails.email = paymentForm.email
    } else if (paymentForm.type === "stripe") {
      accountDetails.stripeAccountId = paymentForm.stripeAccountId
    }

    addPaymentMutation.mutate({
      providerId: selectedProvider,
      type: paymentForm.type,
      accountDetails,
    })
  }

  const handleProcessPayouts = (providerIds: string[]) => {
    processPayoutsMutation.mutate(providerIds)
  }

  // Calculate stats
  const stats = providerPayments
    ? {
        totalProviders: providerPayments.length,
        totalEarnings: providerPayments.reduce((sum, p) => sum + p.totalEarnings, 0),
        pendingPayouts: providerPayments.reduce((sum, p) => sum + p.pendingPayouts, 0),
        unverifiedMethods: providerPayments.reduce(
          (sum, p) => sum + p.paymentMethods.filter((m) => !m.isVerified).length,
          0,
        ),
      }
    : null

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <Loader />
      </div>
    )

  if (isError)
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <ErrorMessage message="Failed to load provider payment data." retry={refetch} />
      </div>
    )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Provider Payment Management</h2>
        <Button
          onClick={() => handleProcessPayouts(providerPayments?.map((p) => p.providerId) || [])}
          disabled={processPayoutsMutation.isPending || !stats?.pendingPayouts}
        >
          {processPayoutsMutation.isPending ? "Processing..." : "Process All Payouts"}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Providers" value={stats?.totalProviders || 0} icon={Users} />
        <StatCard title="Total Earnings" value={`$${stats?.totalEarnings.toLocaleString() || "0"}`} icon={DollarSign} />
        <StatCard title="Pending Payouts" value={`$${stats?.pendingPayouts.toLocaleString() || "0"}`} icon={Wallet} />
        <StatCard title="Unverified Methods" value={stats?.unverifiedMethods || 0} icon={AlertCircle} />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Payment Overview</TabsTrigger>
          <TabsTrigger value="methods">Payment Methods</TabsTrigger>
          <TabsTrigger value="payouts">Payout History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Provider Payment Overview</CardTitle>
              <CardDescription>Overview of all provider payment configurations and earnings</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Provider</TableHead>
                    <TableHead>Payment Methods</TableHead>
                    <TableHead>Total Earnings</TableHead>
                    <TableHead>Pending Payout</TableHead>
                    <TableHead>Payout Schedule</TableHead>
                    <TableHead>Last Payout</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {providerPayments?.map((provider) => (
                    <TableRow key={provider._id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage
                              src={
                                provider.provider.avatar ||
                                `https://api.dicebear.com/8.x/initials/svg?seed=${provider.provider.userName}`
                              }
                              alt={provider.provider.userName}
                            />
                            <AvatarFallback>{getInitials(provider.provider.userName)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div>{provider.provider.userName}</div>
                            <div className="text-xs text-muted-foreground">{provider.provider.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {provider.paymentMethods.map((method) => (
                            <Badge
                              key={method._id}
                              variant={method.isVerified ? "default" : "secondary"}
                              className="flex items-center gap-1"
                            >
                              {getPaymentMethodIcon(method.type)}
                              {getPaymentMethodLabel(method.type)}
                              {method.isDefault && <span className="text-xs">•Default</span>}
                            </Badge>
                          ))}
                          {provider.paymentMethods.length === 0 && <Badge variant="destructive">No methods</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>${provider.totalEarnings.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={provider.pendingPayouts > 0 ? "default" : "secondary"}>
                          ${provider.pendingPayouts.toLocaleString()}
                        </Badge>
                      </TableCell>
                      <TableCell className="capitalize">{provider.payoutSchedule}</TableCell>
                      <TableCell>
                        {provider.lastPayoutDate ? new Date(provider.lastPayoutDate).toLocaleDateString() : "Never"}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedProvider(provider.providerId)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Manage Payment Methods
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleProcessPayouts([provider.providerId])}
                              disabled={provider.pendingPayouts === 0 || processPayoutsMutation.isPending}
                            >
                              <DollarSign className="h-4 w-4 mr-2" />
                              Process Payout
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
        </TabsContent>

        <TabsContent value="methods" className="space-y-4">
          {selectedProvider && (
            <Card>
              <CardHeader>
                <CardTitle>Add Payment Method</CardTitle>
                <CardDescription>Add a new payment method for the selected provider</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddPaymentMethod} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="paymentType">Payment Method Type</Label>
                      <Select
                        value={paymentForm.type}
                        onValueChange={(value) => setPaymentForm({ ...paymentForm, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bank">Bank Account</SelectItem>
                          <SelectItem value="paypal">PayPal</SelectItem>
                          <SelectItem value="stripe">Stripe</SelectItem>
                          <SelectItem value="venmo">Venmo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="accountHolderName">Account Holder Name</Label>
                      <Input
                        id="accountHolderName"
                        value={paymentForm.accountHolderName}
                        onChange={(e) => setPaymentForm({ ...paymentForm, accountHolderName: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  {paymentForm.type === "bank" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="accountNumber">Account Number</Label>
                        <Input
                          id="accountNumber"
                          value={paymentForm.accountNumber}
                          onChange={(e) => setPaymentForm({ ...paymentForm, accountNumber: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="routingNumber">Routing Number</Label>
                        <Input
                          id="routingNumber"
                          value={paymentForm.routingNumber}
                          onChange={(e) => setPaymentForm({ ...paymentForm, routingNumber: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                  )}

                  {(paymentForm.type === "paypal" || paymentForm.type === "venmo") && (
                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={paymentForm.email}
                        onChange={(e) => setPaymentForm({ ...paymentForm, email: e.target.value })}
                        required
                      />
                    </div>
                  )}

                  {paymentForm.type === "stripe" && (
                    <div>
                      <Label htmlFor="stripeAccountId">Stripe Account ID</Label>
                      <Input
                        id="stripeAccountId"
                        value={paymentForm.stripeAccountId}
                        onChange={(e) => setPaymentForm({ ...paymentForm, stripeAccountId: e.target.value })}
                        required
                      />
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button type="submit" disabled={addPaymentMutation.isPending}>
                      {addPaymentMutation.isPending ? "Adding..." : "Add Payment Method"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setSelectedProvider(null)
                        resetPaymentForm()
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>All Payment Methods</CardTitle>
              <CardDescription>Manage and verify provider payment methods</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Provider</TableHead>
                    <TableHead>Method Type</TableHead>
                    <TableHead>Account Details</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Default</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {providerPayments?.flatMap((provider) =>
                    provider.paymentMethods.map((method) => (
                      <TableRow key={`${provider.providerId}-${method._id}`}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={
                                  provider.provider.avatar ||
                                  `https://api.dicebear.com/8.x/initials/svg?seed=${provider.provider.userName}`
                                }
                                alt={provider.provider.userName}
                              />
                              <AvatarFallback className="text-xs">
                                {getInitials(provider.provider.userName)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="text-sm">{provider.provider.userName}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getPaymentMethodIcon(method.type)}
                            {getPaymentMethodLabel(method.type)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {method.type === "bank" && method.accountDetails.accountNumber && (
                              <div>****{method.accountDetails.accountNumber.slice(-4)}</div>
                            )}
                            {(method.type === "paypal" || method.type === "venmo") && method.accountDetails.email && (
                              <div>{method.accountDetails.email}</div>
                            )}
                            {method.type === "stripe" && method.accountDetails.stripeAccountId && (
                              <div>{method.accountDetails.stripeAccountId}</div>
                            )}
                            <div className="text-xs text-muted-foreground">
                              {method.accountDetails.accountHolderName}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={method.isVerified ? "default" : "secondary"}>
                            {method.isVerified ? (
                              <>
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Verified
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3 w-3 mr-1" />
                                Unverified
                              </>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>{method.isDefault && <Badge variant="outline">Default</Badge>}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {!method.isVerified && (
                                <DropdownMenuItem
                                  onClick={() => handleVerifyPaymentMethod(provider.providerId, method._id)}
                                  disabled={updatePaymentMutation.isPending}
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Verify Method
                                </DropdownMenuItem>
                              )}
                              {!method.isDefault && (
                                <DropdownMenuItem
                                  onClick={() => handleSetDefaultPaymentMethod(provider.providerId, method._id)}
                                  disabled={updatePaymentMutation.isPending}
                                >
                                  <CreditCard className="h-4 w-4 mr-2" />
                                  Set as Default
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )),
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payout History</CardTitle>
              <CardDescription>Track all processed payouts to service providers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Payout History Coming Soon</h3>
                <p>Detailed payout tracking and history will be available here.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
