import { NextRequest, NextResponse } from "next/server";
import {
  getAllProviders,
  deleteProvider,
  updateProviderVerification,
  getProviderStats,
} from "@/services/admin/providerService";
import { connectDb } from "@/lib/dbConnect";
import { adminMiddleware } from "@/middlewares/adminMiddleware";
import logger from "@/lib/logger";

export async function GET(req: NextRequest) {
  const connection = await connectDb();
  if (!connection) {
    return NextResponse.json({ message: "Database connection failed" }, { status: 500 });
  }
  const { db, session } = connection;
  try {
    session.startTransaction();
    logger.info("GET /api/providers transaction started");
    const adminAuthResponse = await adminMiddleware(req);
    if (adminAuthResponse.status !== 200) {
        await session.abortTransaction();
        return adminAuthResponse;
    }

    const { searchParams } = new URL(req.url);
    const searchQuery = searchParams.get("search");
    const getStats = searchParams.get("stats");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "5", 10);
    const isVerified = searchParams.get("isVerified");
    const rating = searchParams.get("rating");

    if (getStats) {
      const stats = await getProviderStats();
      await session.commitTransaction();
      logger.info("GET /api/providers transaction committed");
      return NextResponse.json(stats);
    }

    const { providers, totalProviders } = await getAllProviders(
      page,
      limit,
      searchQuery,
      isVerified,
      rating
    );
    await session.commitTransaction();
    logger.info("GET /api/providers transaction committed");
    return NextResponse.json({ providers, totalProviders });
  } catch (error) {
    await session.abortTransaction();
    logger.error("Error in GET /api/providers:", {
        message: (error as Error).message,
        stack: (error as Error).stack,
    });
    return NextResponse.json(
      { message: "An error occurred" },
      { status: 500 }
    );
  } finally {
    session.endSession();
    logger.info("GET /api/providers session ended");
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
    logger.info("DELETE /api/providers transaction started");
    const adminAuthResponse = await adminMiddleware(req);
    if (adminAuthResponse.status !== 200) {
        await session.abortTransaction();
        return adminAuthResponse;
    }

    const { id } = await req.json();
    await deleteProvider(id);
    await session.commitTransaction();
    logger.info("DELETE /api/providers transaction committed");
    return NextResponse.json({ message: "Provider deleted successfully" });
  } catch (error) {
    await session.abortTransaction();
    logger.error("Error in DELETE /api/providers:", {
        message: (error as Error).message,
        stack: (error as Error).stack,
    });
    return NextResponse.json(
      { message: "An error occurred" },
      { status: 500 }
    );
  } finally {
    session.endSession();
    logger.info("DELETE /api/providers session ended");
  }
}

export async function PATCH(req: NextRequest) {
    const connection = await connectDb();
    if (!connection) {
        return NextResponse.json({ message: "Database connection failed" }, { status: 500 });
    }
    const { db, session } = connection;
  try {
    session.startTransaction();
    logger.info("PATCH /api/providers transaction started");
    const adminAuthResponse = await adminMiddleware(req);
    if (adminAuthResponse.status !== 200) {
        await session.abortTransaction();
        return adminAuthResponse;
    }

    const { id, isVerified } = await req.json();
    if (typeof isVerified !== "boolean") {
        await session.abortTransaction();
      return NextResponse.json(
        { message: "Invalid 'isVerified' value provided" },
        { status: 400 }
      );
    }
    const updatedProvider = await updateProviderVerification(id, isVerified);
    await session.commitTransaction();
    logger.info("PATCH /api/providers transaction committed");
    return NextResponse.json(updatedProvider);
  } catch (error) {
    await session.abortTransaction();
    logger.error("Error in PATCH /api/providers:", {
        message: (error as Error).message,
        stack: (error as Error).stack,
    });
    return NextResponse.json(
      { message: "An error occurred" },
      { status: 500 }
    );
  } finally {
    session.endSession();
    logger.info("PATCH /api/providers session ended");
  }
}