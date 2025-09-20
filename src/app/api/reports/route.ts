import { NextRequest, NextResponse } from "next/server";
import { adminMiddleware } from "@/middlewares/adminMiddleware";
import { getReports } from "@/services/admin/reportService";
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
    logger.info("GET /api/reports transaction started");
    const adminAuthResponse = await adminMiddleware(req);
    if (adminAuthResponse.status !== 200) {
        await session.abortTransaction();
        return adminAuthResponse;
    }

    const { totalUsers, totalBookings, totalRevenue, totalProviders, bookingsByCategory, paymentMethods } = await getReports();
    await session.commitTransaction();
    logger.info("GET /api/reports transaction committed");
    return NextResponse.json({ totalUsers, totalBookings, totalRevenue, totalProviders, bookingsByCategory, paymentMethods });
  } catch (error) {
    await session.abortTransaction();
    logger.error("Error in GET /api/reports:", {
        message: (error as Error).message,
        stack: (error as Error).stack,
    });
    return NextResponse.json({ message: "An error occurred" }, { status: 500 });
  } finally {
    session.endSession();
    logger.info("GET /api/reports session ended");
  }
}