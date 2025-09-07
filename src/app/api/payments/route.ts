import { NextRequest, NextResponse } from "next/server";
import { adminMiddleware } from "@/middlewares/adminMiddleware";
import { getAllPayments } from "@/services/admin/paymentService";
import { connectDb } from "@/lib/dbConnect";

export async function GET(req: NextRequest) {
  await connectDb();
  const adminAuthResponse = await adminMiddleware(req);
  if (adminAuthResponse.status !== 200) return adminAuthResponse;

  try {
    const { payments, totalRevenue } = await getAllPayments();
    return NextResponse.json({ payments, totalRevenue });
  } catch (error) {
    return NextResponse.json({ message: "An error occurred" }, { status: 500 });
  }
}
