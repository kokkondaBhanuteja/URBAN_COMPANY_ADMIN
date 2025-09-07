"use client";

import { useQuery } from '@tanstack/react-query';
import StatCard from '@/components/shared/StatCard';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, UserCheck, Calendar, DollarSign } from 'lucide-react';
import Loader from '@/components/shared/Loader';
import ErrorMessage from '@/components/shared/ErrorMessage';

async function fetchReports() {
  const token = localStorage.getItem('admin_token');
  const res = await fetch('/api/reports', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error('Failed to fetch reports');
  }
  return res.json();
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function DashboardPage() {
    const { data: reports, isLoading, isError, refetch } = useQuery({
        queryKey: ['reports'],
        queryFn: fetchReports,
    });


  if (isLoading) return (
    <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
      <Loader />
    </div>
  );
  if (isError) return (
    <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
      <ErrorMessage message="Failed to load dashboard data." retry={refetch} />
    </div>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Consumers" value={reports?.totalUsers ?? 0} icon={Users} />
        <StatCard title="Service Providers" value={reports?.totalProviders ?? 0} icon={UserCheck} />
        <StatCard title="Total Bookings" value={reports?.totalBookings ?? 0} icon={Calendar} />
        <StatCard title="Revenue" value={`$${reports?.totalRevenue.toFixed(2) ?? '0.00'}`} icon={DollarSign} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
            <CardHeader>
              <CardTitle>Bookings by Service Category</CardTitle>
              <CardDescription>Number of bookings per service category this month</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reports?.bookingsByCategory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="bookings" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>Distribution of payment methods used by customers</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={reports?.paymentMethods}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label
                  >
                    {reports?.paymentMethods.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
    </div>
  );
}