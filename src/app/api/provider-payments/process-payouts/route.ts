import { processPayoutsForProviders } from "@/services/admin/paymentService";
import { type NextRequest, NextResponse } from "next/server"
import { adminMiddleware } from "@/middlewares/adminMiddleware";
import { connectDb } from "@/lib/dbConnect";
import logger from "@/lib/logger";

export async function POST(request: NextRequest) {
    const connection = await connectDb();
    if (!connection) {
        return NextResponse.json({ message: "Database connection failed" }, { status: 500 });
    }
    const { db, session } = connection;
  try {
    session.startTransaction();
    logger.info("POST /api/provider-payments/process-payouts transaction started");
    const adminAuthResponse = await adminMiddleware(request);
    if (adminAuthResponse.status !== 200) {
        await session.abortTransaction();
        return adminAuthResponse;
    }
    const body = await request.json()
    const { providerIds } = body

    if (!providerIds || !Array.isArray(providerIds)) {
        await session.abortTransaction();
      return NextResponse.json({ error: "Provider IDs array is required" }, { status: 400 })
    }
    const result = await processPayoutsForProviders(providerIds);
    await session.commitTransaction();
    logger.info("POST /api/provider-payments/process-payouts transaction committed");

    return NextResponse.json(result)
  } catch (error) {
    await session.abortTransaction();
    logger.error("Error in POST /api/provider-payments/process-payouts:", {
        message: (error as Error).message,
        stack: (error as Error).stack,
    });
    return NextResponse.json({ error: "Failed to process payouts" }, { status: 500 })
  } finally {
    session.endSession();
    logger.info("POST /api/provider-payments/process-payouts session ended");
  }
}