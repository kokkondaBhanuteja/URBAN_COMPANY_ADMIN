import { NextRequest, NextResponse } from 'next/server';
import { connectDb } from '@/lib/dbConnect';
import User from '@/database/userModel';
import { adminMiddleware } from '@/middlewares/adminMiddleware';
import bcrypt from 'bcryptjs';
import logger from '@/lib/logger';

export async function POST(req: NextRequest) {
  const connection = await connectDb();
  if (!connection) {
    return NextResponse.json({ message: "Database connection failed" }, { status: 500 });
  }
  const { db, session } = connection;
  try {
    session.startTransaction();
    logger.info("POST /api/auth/change-password transaction started");

    const adminAuthResponse = await adminMiddleware(req);
    if (adminAuthResponse.status !== 200) {
      await session.abortTransaction();
      return adminAuthResponse;
    }

    const { userId, currentPassword, newPassword } = await req.json();

    if (!userId || !currentPassword || !newPassword) {
      await session.abortTransaction();
      return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
    }

    const user = await User.findById(userId).session(session);
    if (!user) {
      await session.abortTransaction();
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    
    if(!user.password) {
        await session.abortTransaction();
        return NextResponse.json({ message: 'Password is not set for this user.' }, { status: 400 });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      await session.abortTransaction();
      return NextResponse.json({ message: 'Invalid current password' }, { status: 401 });
    }

    user.password = newPassword;
    await user.save({ session });

    await session.commitTransaction();
    logger.info("POST /api/auth/change-password transaction committed");

    return NextResponse.json({ message: 'Password changed successfully' });
  } catch (error) {
    await session.abortTransaction();
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    logger.error("Error in POST /api/auth/change-password:", {
        message: (error as Error).message,
        stack: (error as Error).stack,
    });
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  } finally {
    session.endSession();
    logger.info("POST /api/auth/change-password session ended");
  }
}