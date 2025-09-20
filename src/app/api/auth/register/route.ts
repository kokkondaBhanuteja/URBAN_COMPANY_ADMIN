import { NextRequest, NextResponse } from 'next/server';
import { registerUser } from '@/services/authService';
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
    logger.info("POST /api/auth/register transaction started");

    const { userName, email, password, mobileNumber, userType } = await req.json();
    console.log(userName, email, password, mobileNumber, userType);
    const user = await registerUser({ userName, email, password, mobileNumber, userType });
    console.log(user);

    await session.commitTransaction();
    logger.info("POST /api/auth/register transaction committed");

    return NextResponse.json({ message: 'User registered successfully', userId: user._id }, { status: 201 });
  } catch (error) {
    await session.abortTransaction();
    logger.error("Error in POST /api/auth/register:", {
        message: (error as Error).message,
        stack: (error as Error).stack,
    });
    return NextResponse.json({ message: error }, { status: 400 });
  } finally {
    session.endSession();
    logger.info("POST /api/auth/register session ended");
  }
}