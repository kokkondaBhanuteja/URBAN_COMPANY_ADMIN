import { type NextRequest, NextResponse } from "next/server";
import { getAllBookings, searchBookings } from "@/services/admin/bookingService";
import { connectDb } from "@/lib/dbConnect";
import { adminMiddleware } from "@/middlewares/adminMiddleware";

export async function GET(req: NextRequest) {
  await connectDb();
  const adminAuthResponse = await adminMiddleware(req);
  if (adminAuthResponse.status !== 200) return adminAuthResponse;
  try {
    const { searchParams } = new URL(req.url);
    const searchQuery = searchParams.get("search");

    if (searchQuery) {
      const bookings = await searchBookings(searchQuery);
      return NextResponse.json(bookings);
    }
    const bookings = await getAllBookings();
    return NextResponse.json(bookings);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}