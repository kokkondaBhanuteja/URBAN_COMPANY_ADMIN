// src/app/api/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminMiddleware } from "@/middlewares/adminMiddleware";
import { getAllUsers, deleteUser, searchUsers } from "@/services/admin/userService";
import { connectDb } from "@/lib/dbConnect";
import logger from "@/lib/logger";

export async function GET(req: NextRequest) {
    const connection = await connectDb();
    if (!connection) {
        return NextResponse.json({ message: "Database connection failed" }, { status: 500 });
    }
    const { db, session } = connection;

    try {
        session.startTransaction();
        logger.info("GET /api/users transaction started");

        const adminAuthResponse = await adminMiddleware(req);
        if (adminAuthResponse.status !== 200) {
            await session.abortTransaction();
            return adminAuthResponse;
        }

        const { searchParams } = new URL(req.url);
        const searchQuery = searchParams.get('search');

        const users = searchQuery ? await searchUsers(searchQuery) : await getAllUsers();

        await session.commitTransaction();
        logger.info("GET /api/users transaction committed");

        return NextResponse.json(users);
    } catch (error) {
        await session.abortTransaction();
        logger.error("Error in GET /api/users:", {
            message: (error as Error).message,
            stack: (error as Error).stack,
        });
        return NextResponse.json({ message: "An error occurred" }, { status: 500 });
    } finally {
        session.endSession();
        logger.info("GET /api/users session ended");
    }
}

export async function DELETE(req: NextRequest) {
    const connection = await connectDb();
    if (!connection) {
        return NextResponse.json({ message: "Database connection failed" }, { status: 500 });
    }
    const { db, session } = connection;

    try {
        session.startTransaction();
        logger.info("DELETE /api/users transaction started");
        const adminAuthResponse = await adminMiddleware(req);
        if (adminAuthResponse.status !== 200) {
            await session.abortTransaction();
            return adminAuthResponse;
        }

        const { id } = await req.json();
        await deleteUser(id);

        await session.commitTransaction();
        logger.info("DELETE /api/users transaction committed");
        return NextResponse.json({ message: "User deleted successfully" });
    } catch (error) {
        await session.abortTransaction();
        logger.error("Error in DELETE /api/users:", {
            message: (error as Error).message,
            stack: (error as Error).stack,
        });
        return NextResponse.json({ message: "An error occurred" }, { status: 500 });
    } finally {
        session.endSession();
        logger.info("DELETE /api/users session ended");
    }
}