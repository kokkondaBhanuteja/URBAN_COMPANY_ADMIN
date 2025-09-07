import { processPayoutsForProviders } from "@/services/admin/paymentService";
import { type NextRequest, NextResponse } from "next/server"
import { adminMiddleware } from "@/middlewares/adminMiddleware";
import { connectDb } from "@/lib/dbConnect";

export async function POST(request: NextRequest) {
    await connectDb();
    const adminAuthResponse = await adminMiddleware(request);
    if (adminAuthResponse.status !== 200) return adminAuthResponse;
  try {
    const body = await request.json()
    const { providerIds } = body

    if (!providerIds || !Array.isArray(providerIds)) {
      return NextResponse.json({ error: "Provider IDs array is required" }, { status: 400 })
    }
    const result = await processPayoutsForProviders(providerIds);

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: "Failed to process payouts" }, { status: 500 })
  }
}