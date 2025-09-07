import { NextRequest, NextResponse } from 'next/server';
import { connectDb } from '@/lib/dbConnect';
import User from '@/database/userModel';
import { adminMiddleware } from '@/middlewares/adminMiddleware';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  await connectDb();
  const adminAuthResponse = await adminMiddleware(req);
  if (adminAuthResponse.status !== 200) return adminAuthResponse;

  try {
    const { userId, currentPassword, newPassword } = await req.json();

    if (!userId || !currentPassword || !newPassword) {
      return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    
    if(!user.password) {
        return NextResponse.json({ message: 'Password is not set for this user.' }, { status: 400 });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return NextResponse.json({ message: 'Invalid current password' }, { status: 401 });
    }

    user.password = newPassword;
    await user.save();

    return NextResponse.json({ message: 'Password changed successfully' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}