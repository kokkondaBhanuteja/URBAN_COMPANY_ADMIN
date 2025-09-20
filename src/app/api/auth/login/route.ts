import { NextRequest, NextResponse } from 'next/server';
import { loginUser } from '@/services/authService';
import { connectDb } from '@/lib/dbConnect';
import logger from '@/lib/logger';

export async function POST(req: NextRequest) {
  const connection = await connectDb();
  if (!connection) {
    return NextResponse.json({ message: "Database connection failed" }, { status: 500 });
  }
  const { db, session } = connection;
  try {
    session.startTransaction();
    logger.info("POST /api/auth/login transaction started");

    const { email, password } = await req.json();
    // Enforce that only an 'admin' can log in through this route
    const { token, user } = await loginUser(email, password, 'admin');
    
    await session.commitTransaction();
    logger.info("POST /api/auth/login transaction committed");

    return NextResponse.json({ token, user: { id: user._id, fullName: user.userName, email: user.email } });
  } catch (error) {
    await session.abortTransaction();
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    logger.error("Error in POST /api/auth/login:", {
        message: (error as Error).message,
        stack: (error as Error).stack,
    });
    return NextResponse.json({ message: errorMessage }, { status: 401 });
  } finally {
    session.endSession();
    logger.info("POST /api/auth/login session ended");
  }
}