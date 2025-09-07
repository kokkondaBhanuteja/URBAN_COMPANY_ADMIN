import { NextRequest, NextResponse } from 'next/server';
import { loginUser } from '@/services/authService';
import { connectDb } from '@/lib/dbConnect';

export async function POST(req: NextRequest) {
  await connectDb();
  try {
    const { email, password } = await req.json();
    // Enforce that only an 'admin' can log in through this route
    const { token, user } = await loginUser(email, password, 'admin');
    
    return NextResponse.json({ token, user: { id: user._id, fullName: user.userName, email: user.email } });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ message: errorMessage }, { status: 401 });
  }
}
