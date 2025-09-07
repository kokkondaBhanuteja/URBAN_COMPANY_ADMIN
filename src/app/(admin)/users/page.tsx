"use client";

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Trash2, Users } from 'lucide-react';
import Loader from '@/components/shared/Loader';
import ErrorMessage from '@/components/shared/ErrorMessage';
import StatCard from '@/components/shared/StatCard';

interface IUser {
  _id: string;
  userName: string;
  email: string;
  mobileNumber: string;
  userType: "consumer" | "provider" | "admin";
  createdAt: string;
}

const ITEMS_PER_PAGE = 5;

async function fetchUsers(search: string, date: string) {
    const token = localStorage.getItem('admin_token');
    const url = new URL('/api/users', window.location.origin);
    if (search) url.searchParams.append('search', search);
    if (date) url.searchParams.append('date', date);
    const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
        throw new Error('Failed to fetch users');
    }
    return res.json();
}

async function deleteUser(userId: string) {
    const token = localStorage.getItem('admin_token');
    const res = await fetch(`/api/users`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: userId }),
    });
    if (!res.ok) {
        throw new Error('Failed to delete user');
    }
    return res.json();
}

export default function ConsumersPage() {
    const queryClient = useQueryClient();
    const [searchInput, setSearchInput] = useState('');
    const [dateInput, setDateInput] = useState('');
    const [activeFilters, setActiveFilters] = useState({ search: '', date: '' });
    const [currentPage, setCurrentPage] = useState(1);
    
    const { data: users, isLoading, isError, refetch } = useQuery<IUser[]>({ 
        queryKey: ['users', activeFilters], 
        queryFn: () => fetchUsers(activeFilters.search, activeFilters.date),
    });

    const mutation = useMutation({
        mutationFn: deleteUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users', activeFilters] });
        },
    });

    const handleDelete = (userId: string) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            mutation.mutate(userId);
        }
    };
    
    const consumers = useMemo(() => users?.filter(user => user.userType === 'consumer') || [], [users]);

    const totalPages = Math.ceil(consumers.length / ITEMS_PER_PAGE);
    const paginatedConsumers = consumers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const handleSearchAndFilter = () => {
        setCurrentPage(1);
        setActiveFilters({ search: searchInput, date: dateInput });
    };

    if (isLoading) return <div className="flex items-center justify-center h-[calc(100vh-8rem)]"><Loader /></div>;
    if (isError) return <div className="flex items-center justify-center h-[calc(100vh-8rem)]"><ErrorMessage message="Failed to load consumers." retry={refetch} /></div>;

  return (
    <div className="space-y-6">
        <StatCard title="Total Consumers" value={consumers.length} icon={Users} />
        <Card>
        <CardHeader>
            <CardTitle>Consumers</CardTitle>
            <CardDescription>Manage all platform consumers.</CardDescription>
             <div className="flex items-center gap-2 pt-4">
                <Input 
                    placeholder="Search by name, email, or phone..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchAndFilter()}
                    className="max-w-sm"
                />
                <Input 
                    type="date"
                    value={dateInput}
                    onChange={(e) => setDateInput(e.target.value)}
                    className="max-w-sm"
                />
                <Button onClick={handleSearchAndFilter}>Search / Filter</Button>
            </div>
        </CardHeader>
        <CardContent>
            <Table>
            <TableHeader>
                <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone Number</TableHead>
                <TableHead>Joined On</TableHead>
                <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {paginatedConsumers.map((user) => (
                <TableRow key={user._id}>
                    <TableCell>{user.userName}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.mobileNumber}</TableCell>
                    <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(user._id)} disabled={mutation.isPending}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                    </TableCell>
                </TableRow>
                ))}
            </TableBody>
            </Table>
             {totalPages > 1 && (
                <div className="flex items-center justify-end space-x-2 py-4">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>Previous</Button>
                    <span>Page {currentPage} of {totalPages}</span>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>Next</Button>
                </div>
            )}
        </CardContent>
        </Card>
    </div>
  );
}