"use client";

import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Loader from '@/components/shared/Loader';

const getAdminIdFromStorage = () => {
    if (typeof window === 'undefined') return null;
    const user = localStorage.getItem('admin_user');
    return user ? JSON.parse(user).id : null;
};

async function fetchAdminProfile(userId: string) {
    const token = localStorage.getItem('admin_token');
    const res = await fetch(`/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch admin data');
    return res.json();
}

async function updateProfile(profileData: { userId: string, userName: string, email: string }) {
    const token = localStorage.getItem('admin_token');
    const res = await fetch(`/api/users/${profileData.userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userName: profileData.userName, email: profileData.email }),
    });
    if (!res.ok) throw new Error((await res.json()).message || "Failed to update profile");
    return res.json();
}

async function changePassword(passwordData: { userId: string, currentPassword?: string, newPassword?: string }) {
    const token = localStorage.getItem('admin_token');
    const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(passwordData),
    });
    if (!res.ok) throw new Error((await res.json()).message || "Failed to change password");
    return res.json();
}

export default function SettingsPage() {
  const { toast } = useToast();
  const adminId = getAdminIdFromStorage();

  const [adminProfile, setAdminProfile] = useState({ userName: '', email: '' });
  const [password, setPassword] = useState({ currentPassword: '', newPassword: ''});

  const { data: profileData, isLoading: isProfileLoading } = useQuery({
      queryKey: ['adminProfile', adminId],
      queryFn: () => fetchAdminProfile(adminId!),
      enabled: !!adminId,
  });

  useEffect(() => {
    if (profileData) {
        setAdminProfile({ userName: profileData.userName, email: profileData.email });
    }
  }, [profileData]);

  const profileUpdateMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (data) => {
        toast({ title: "Success", description: "Profile updated successfully!" });
        // Update local storage as well
        const adminUser = JSON.parse(localStorage.getItem('admin_user') || '{}');
        adminUser.fullName = data.userName;
        adminUser.email = data.email;
        localStorage.setItem('admin_user', JSON.stringify(adminUser));
    },
    onError: (error: Error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const passwordChangeMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
        toast({ title: "Success", description: "Password changed successfully!" });
        setPassword({ currentPassword: '', newPassword: '' });
    },
    onError: (error: Error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminId) {
      profileUpdateMutation.mutate({ userId: adminId, ...adminProfile });
    }
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminId) {
      passwordChangeMutation.mutate({ userId: adminId, ...password });
    }
  };

  if (isProfileLoading) {
      return <div className="flex items-center justify-center h-full"><Loader /></div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Admin Profile</CardTitle>
          <CardDescription>Update your profile information.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userName">Name</Label>
              <Input id="userName" value={adminProfile.userName} onChange={(e) => setAdminProfile({...adminProfile, userName: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={adminProfile.email} onChange={(e) => setAdminProfile({...adminProfile, email: e.target.value})} />
            </div>
            <Button type="submit" disabled={profileUpdateMutation.isPending}>
                {profileUpdateMutation.isPending ? 'Updating...' : 'Update Profile'}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your account password.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input id="currentPassword" type="password" value={password.currentPassword} onChange={(e) => setPassword({...password, currentPassword: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input id="newPassword" type="password" value={password.newPassword} onChange={(e) => setPassword({...password, newPassword: e.target.value})} />
            </div>
            <Button type="submit" disabled={passwordChangeMutation.isPending}>
                {passwordChangeMutation.isPending ? 'Changing...' : 'Change Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}