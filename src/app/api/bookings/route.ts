import { type NextRequest, NextResponse } from "next/server";
import { getAllBookings, getBookingStats } from "@/services/admin/bookingService";
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
    logger.info("GET /api/bookings transaction started");
    const adminAuthResponse = await adminMiddleware(req);
    if (adminAuthResponse.status !== 200) {
      await session.abortTransaction();
      return adminAuthResponse;
    }
    const { searchParams } = new URL(req.url);
    const searchQuery = searchParams.get("search");
    const getStats = searchParams.get('stats');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '5', 10);
    const statusFilter = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const paymentStatusFilter = searchParams.get('paymentStatus');
    const specialInstructionsSearch = searchParams.get('specialInstructions');

    if (getStats) {
        const stats = await getBookingStats();
        await session.commitTransaction();
        logger.info("GET /api/bookings transaction committed");
        return NextResponse.json(stats);
    }
    
    const { bookings, totalBookings } = await getAllBookings(
        page, 
        limit, 
        searchQuery, 
        statusFilter, 
        startDate, 
        endDate,
        paymentStatusFilter,
        specialInstructionsSearch
    );
    await session.commitTransaction();
    logger.info("GET /api/bookings transaction committed");
    return NextResponse.json({ bookings, totalBookings });
  } catch (error) {
    await session.abortTransaction();
    logger.error("Error in GET /api/bookings:", {
        message: (error as Error).message,
        stack: (error as Error).stack,
    });
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  } finally {
    session.endSession();
    logger.info("GET /api/bookings session ended");
  }
}