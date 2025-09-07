import { NextRequest, NextResponse } from "next/server";
import { adminMiddleware } from "@/middlewares/adminMiddleware";
import { getReports } from "@/services/admin/reportService";
import { connectDb } from "@/lib/dbConnect";

export async function GET(req: NextRequest) {
  await connectDb();
  const adminAuthResponse = await adminMiddleware(req);
  if (adminAuthResponse.status !== 200) return adminAuthResponse;

  try {
    const { totalUsers, totalBookings, totalRevenue, totalProviders, bookingsByCategory, paymentMethods } = await getReports();
    return NextResponse.json({ totalUsers, totalBookings, totalRevenue, totalProviders, bookingsByCategory, paymentMethods });
  } catch (error) {
    return NextResponse.json({ message: "An error occurred" }, { status: 500 });
  }
}