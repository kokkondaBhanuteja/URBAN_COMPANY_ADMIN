import { getProviderPayments, searchProviderPayments } from "@/services/admin/paymentService";
import { NextRequest, NextResponse } from "next/server";
import { adminMiddleware } from "@/middlewares/adminMiddleware";
import { connectDb } from "@/lib/dbConnect";

export async function GET(req: NextRequest) {
    await connectDb();
    const adminAuthResponse = await adminMiddleware(req);
    if (adminAuthResponse.status !== 200) return adminAuthResponse;
  try {
    const { searchParams } = new URL(req.url);
    const searchQuery = searchParams.get('search');
    
    const providerPayments = searchQuery 
        ? await searchProviderPayments(searchQuery) 
        : await getProviderPayments();

    return NextResponse.json(providerPayments)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch provider payments" }, { status: 500 })
  }
}