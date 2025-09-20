import { NextRequest, NextResponse } from "next/server";
import { adminMiddleware } from "@/middlewares/adminMiddleware";
import { updateUser, getUserById } from "@/services/admin/userService";
import { connectDb } from "@/lib/dbConnect";
import logger from "@/lib/logger";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const connection = await connectDb();
    if (!connection) {
        return NextResponse.json({ message: "Database connection failed" }, { status: 500 });
    }
    const { db, session } = connection;
  try {
    session.startTransaction();
    logger.info("GET /api/users/[id] transaction started");
    const adminAuthResponse = await adminMiddleware(req);
    if (adminAuthResponse.status !== 200) {
        await session.abortTransaction();
        return adminAuthResponse;
    }

    const user = await getUserById(params.id);
    if (!user) {
        await session.abortTransaction();
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    await session.commitTransaction();
    logger.info("GET /api/users/[id] transaction committed");
    return NextResponse.json(user);
  } catch (error) {
    await session.abortTransaction();
    logger.error("Error in GET /api/users/[id]:", {
        message: (error as Error).message,
        stack: (error as Error).stack,
    });
    return NextResponse.json({ message: "An error occurred" }, { status: 500 });
  } finally {
    session.endSession();
    logger.info("GET /api/users/[id] session ended");
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const connection = await connectDb();
    if (!connection) {
        return NextResponse.json({ message: "Database connection failed" }, { status: 500 });
    }
    const { db, session } = connection;
    try {
        session.startTransaction();
        logger.info("PATCH /api/users/[id] transaction started");
        const adminAuthResponse = await adminMiddleware(req);
        if (adminAuthResponse.status !== 200) {
            await session.abortTransaction();
            return adminAuthResponse;
        }

        const { id } = params;
        const body = await req.json();
        
        const updatedUser = await updateUser(id, body);
        if (!updatedUser) {
            await session.abortTransaction();
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }
        await session.commitTransaction();
        logger.info("PATCH /api/users/[id] transaction committed");
        return NextResponse.json(updatedUser);
    } catch (error) {
        await session.abortTransaction();
        logger.error("Error in PATCH /api/users/[id]:", {
            message: (error as Error).message,
            stack: (error as Error).stack,
        });
        return NextResponse.json({ message: "An error occurred" }, { status: 500 });
    } finally {
        session.endSession();
        logger.info("PATCH /api/users/[id] session ended");
    }
}