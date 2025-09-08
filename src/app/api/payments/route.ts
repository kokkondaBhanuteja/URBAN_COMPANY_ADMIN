import { NextRequest, NextResponse } from "next/server";
import { adminMiddleware } from "@/middlewares/adminMiddleware";
import { getAllPayments, getPaymentStats } from "@/services/admin/paymentService";
import { connectDb } from "@/lib/dbConnect";

export async function GET(req: NextRequest) {
  await connectDb();
  const adminAuthResponse = await adminMiddleware(req);
  if (adminAuthResponse.status !== 200) return adminAuthResponse;

  const { searchParams } = new URL(req.url);
  const searchQuery = searchParams.get('search');
  const statusFilter = searchParams.get('status');
  const dateFilter = searchParams.get('date');
  const getStats = searchParams.get('stats');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '5', 10);

  try {
    if (getStats) {
      const stats = await getPaymentStats();
      return NextResponse.json(stats);
    }
    const { payments, totalPayments, totalRevenue } = await getAllPayments(page, limit, searchQuery, statusFilter, dateFilter);
    return NextResponse.json({ payments, totalPayments, totalRevenue });
  } catch (error) {
    return NextResponse.json({ message: "An error occurred" }, { status: 500 });
  }
}