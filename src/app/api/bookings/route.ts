import { type NextRequest, NextResponse } from "next/server";
import { getAllBookings, getBookingStats } from "@/services/admin/bookingService";
import { connectDb } from "@/lib/dbConnect";
import { adminMiddleware } from "@/middlewares/adminMiddleware";

export async function GET(req: NextRequest) {
  await connectDb();
  const adminAuthResponse = await adminMiddleware(req);
  if (adminAuthResponse.status !== 200) return adminAuthResponse;
  try {
    const { searchParams } = new URL(req.url);
    const searchQuery = searchParams.get("search");
    const getStats = searchParams.get('stats');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '5', 10);
    const statusFilter = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (getStats) {
        const stats = await getBookingStats();
        return NextResponse.json(stats);
    }
    
    const { bookings, totalBookings } = await getAllBookings(page, limit, searchQuery, statusFilter, startDate, endDate);
    return NextResponse.json({ bookings, totalBookings });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}