"use client";

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

async function updateProfile(profileData: { userName: string, email: string }) {
    console.log('Updating profile with:', profileData);
    await new Promise(resolve => setTimeout(resolve, 1000));
    alert('Profile updated!');
    return { success: true };
}

async function changePassword(passwordData: { currentPassword?: string, newPassword?: string }) {
    // Mock API call for password change
    console.log('Changing password...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    alert('Password changed successfully!');
    return { success: true };
}

export default function SettingsPage() {
  const [adminProfile, setAdminProfile] = useState({ userName: 'Admin User', email: 'admin@example.com' });
  const [password, setPassword] = useState({ currentPassword: '', newPassword: ''});

  const profileUpdateMutation = useMutation({
    mutationFn: updateProfile,
  });

  const passwordChangeMutation = useMutation({
    mutationFn: changePassword,
  });

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    profileUpdateMutation.mutate(adminProfile);
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    passwordChangeMutation.mutate(password);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Admin Profile</CardTitle>
          <CardDescription>Update your profile information.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div>
              <Label htmlFor="userName">Name</Label>
              <Input id="userName" value={adminProfile.userName} onChange={(e) => setAdminProfile({...adminProfile, userName: e.target.value})} />
            </div>
            <div>
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
            <div>
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input id="currentPassword" type="password" value={password.currentPassword} onChange={(e) => setPassword({...password, currentPassword: e.target.value})} />
            </div>
            <div>
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
