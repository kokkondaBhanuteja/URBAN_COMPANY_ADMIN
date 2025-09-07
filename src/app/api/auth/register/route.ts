import { NextRequest, NextResponse } from 'next/server';
import { registerUser } from '@/services/authService';
import { connectDb } from '@/lib/dbConnect';

export async function POST(req: NextRequest) {
  await connectDb();
  try {
    const { userName, email, password, mobileNumber, userType } = await req.json();
    console.log(userName, email, password, mobileNumber, userType);
    const user = await registerUser({ userName, email, password, mobileNumber, userType });
    console.log(user);
    return NextResponse.json({ message: 'User registered successfully', userId: user._id }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: error }, { status: 400 });
  }
}
