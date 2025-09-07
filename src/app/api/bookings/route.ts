// src/app/api/bookings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminMiddleware } from "@/middlewares/adminMiddleware";
import { getAllBookings, searchBookings } from "@/services/admin/bookingService";
import { connectDb } from "@/lib/dbConnect";

export async function GET(req: NextRequest) {
  await connectDb();
  const adminAuthResponse = await adminMiddleware(req);
  if (adminAuthResponse.status !== 200) return adminAuthResponse;

  const { searchParams } = new URL(req.url);
  const searchQuery = searchParams.get('search');

  try {
    const bookings = searchQuery ? await searchBookings(searchQuery) : await getAllBookings();
    return NextResponse.json(bookings);
  } catch (error) {
    return NextResponse.json({ message: "An error occurred" }, { status: 500 });
  }
}
