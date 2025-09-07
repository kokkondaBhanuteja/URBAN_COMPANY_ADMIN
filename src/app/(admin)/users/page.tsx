"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trash2 } from 'lucide-react';
import Loader from '@/components/shared/Loader';
import ErrorMessage from '@/components/shared/ErrorMessage';

interface IUser {
  _id: string;
  userName: string;
  email: string;
}

async function fetchUsers() {
    const token = localStorage.getItem('admin_token');
    const res = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
}

async function deleteUser(userId: string) {
    const token = localStorage.getItem('admin_token');
    const res = await fetch(`/api/users`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: userId }),
    });
    if (!res.ok) throw new Error('Failed to delete user');
    return res.json();
}

export default function UsersPage() {
    const queryClient = useQueryClient();
    const { data: users, isLoading, isError, refetch } = useQuery<IUser[]>({ queryKey: ['users'], queryFn: fetchUsers });

    const mutation = useMutation({
        mutationFn: deleteUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
    });

    const handleDelete = (userId: string) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            mutation.mutate(userId);
        }
    };


    if (isLoading) return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <Loader />
      </div>
    );
    if (isError) return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <ErrorMessage message="Failed to load users." retry={refetch} />
      </div>
    );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users</CardTitle>
        <CardDescription>Manage all platform users.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map((user) => (
              <TableRow key={user._id}>
                <TableCell>{user.userName}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(user._id)} disabled={mutation.isPending}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
