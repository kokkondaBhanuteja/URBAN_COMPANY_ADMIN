import { getProviderPayments } from "@/services/admin/paymentService";
import { NextRequest, NextResponse } from "next/server";
import { adminMiddleware } from "@/middlewares/adminMiddleware";
import { connectDb } from "@/lib/dbConnect";

const PAYMENTS_PER_PAGE = 5;

export async function GET(req: NextRequest) {
    await connectDb();
    const adminAuthResponse = await adminMiddleware(req);
    if (adminAuthResponse.status !== 200) return adminAuthResponse;

    try {
      const { searchParams } = new URL(req.url);
      const searchQuery = searchParams.get('search') || "";
      const page = parseInt(searchParams.get('page') || '1', 10);
      const limit = parseInt(searchParams.get('limit') || PAYMENTS_PER_PAGE.toString(), 10);
      
      const { providerPayments, totalProviders } = await getProviderPayments(page, limit, searchQuery);

      return NextResponse.json({ providerPayments, totalProviders });
    } catch (error) {
      return NextResponse.json({ error: "Failed to fetch provider payments" }, { status: 500 })
    }
}