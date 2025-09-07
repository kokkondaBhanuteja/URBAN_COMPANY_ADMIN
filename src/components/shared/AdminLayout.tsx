"use client"

import type React from "react"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import {
  BarChart,
  Users,
  UserCheck,
  Calendar,
  DollarSign,
  Settings,
  LogOut,
  ClipboardList,
  Tag,
  CreditCard,
} from "lucide-react"
import Loader from "./Loader"

const sidebarItems = [
  { href: "/dashboard", icon: BarChart, label: "Dashboard" },
  { href: "/users", icon: Users, label: "Consumers" }, // Changed "Users" to "Consumers"
  { href: "/providers", icon: UserCheck, label: "Providers" },
  { href: "/bookings", icon: Calendar, label: "Bookings" },
  { href: "/payments", icon: DollarSign, label: "Payments" },
  { href: "/services", icon: ClipboardList, label: "Services" },
  { href: "/discounts", icon: Tag, label: "Discounts" },
  { href: "/provider-payments", icon: CreditCard, label: "Provider Payments" },
  { href: "/settings", icon: Settings, label: "Settings" },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem("admin_token")
    if (!token) {
      router.push("/login")
    } else {
      setIsLoading(false)
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("admin_token")
    localStorage.removeItem("admin_user") // Also clear user data
    router.push("/login")
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 bg-white text-gray-800 p-4 flex-col hidden sm:flex border-r">
        <h1 className="text-2xl font-bold mb-8 text-gray-900">Admin Panel</h1>
        <nav>
          <ul className="space-y-2">
            {sidebarItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 block py-2.5 px-4 rounded transition duration-200 ${
                    pathname === `${item.href}` ? "bg-gray-100 text-gray-900" : "hover:bg-gray-50"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-auto">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 block py-2.5 px-4 rounded transition duration-200 hover:bg-gray-50 w-full text-left"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  )
}