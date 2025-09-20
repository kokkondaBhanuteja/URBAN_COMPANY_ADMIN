import { NextRequest, NextResponse } from "next/server";
import { adminMiddleware } from "@/middlewares/adminMiddleware";
import { getAllPayments, getPaymentStats } from "@/services/admin/paymentService";
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
    logger.info("GET /api/payments transaction started");
    const adminAuthResponse = await adminMiddleware(req);
    if (adminAuthResponse.status !== 200) {
        await session.abortTransaction();
        return adminAuthResponse;
    }

    const { searchParams } = new URL(req.url);
    const searchQuery: string | null = searchParams.get('search');
    const statusFilter = searchParams.get('status');
    const dateFilter = searchParams.get('date');
    const getStats = searchParams.get('stats');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '5', 10);

    if (getStats) {
      const stats = await getPaymentStats();
      await session.commitTransaction();
      logger.info("GET /api/payments transaction committed");
      return NextResponse.json(stats);
    }
    const { payments, totalPayments, totalRevenue } = await getAllPayments(page, limit, searchQuery, statusFilter, dateFilter);
    await session.commitTransaction();
    logger.info("GET /api/payments transaction committed");
    return NextResponse.json({ payments, totalPayments, totalRevenue });
  } catch (error) {
    await session.abortTransaction();
    logger.error("Error in GET /api/payments:", {
        message: (error as Error).message,
        stack: (error as Error).stack,
    });
    return NextResponse.json({ message: "An error occurred" }, { status: 500 });
  } finally {
    session.endSession();
    logger.info("GET /api/payments session ended");
  }
}