import { getProviderPayments } from "@/services/admin/paymentService";
import { NextRequest, NextResponse } from "next/server";
import { adminMiddleware } from "@/middlewares/adminMiddleware";
import { connectDb } from "@/lib/dbConnect";
import logger from "@/lib/logger";

const PAYMENTS_PER_PAGE = 5;

export async function GET(req: NextRequest) {
    const connection = await connectDb();
    if (!connection) {
        return NextResponse.json({ message: "Database connection failed" }, { status: 500 });
    }
    const { db, session } = connection;
    try {
        session.startTransaction();
        logger.info("GET /api/provider-payments transaction started");
      const adminAuthResponse = await adminMiddleware(req);
      if (adminAuthResponse.status !== 200) {
          await session.abortTransaction();
          return adminAuthResponse;
      }

      const { searchParams } = new URL(req.url);
      const searchQuery = searchParams.get('search') || "";
      const page = parseInt(searchParams.get('page') || '1', 10);
      const limit = parseInt(searchParams.get('limit') || PAYMENTS_PER_PAGE.toString(), 10);
      
      const { providerPayments, totalProviders } = await getProviderPayments(page, limit, searchQuery);
      await session.commitTransaction();
      logger.info("GET /api/provider-payments transaction committed");

      return NextResponse.json({ providerPayments, totalProviders });
    } catch (error) {
        await session.abortTransaction();
        logger.error("Error in GET /api/provider-payments:", {
            message: (error as Error).message,
            stack: (error as Error).stack,
        });
      return NextResponse.json({ error: "Failed to fetch provider payments" }, { status: 500 })
    } finally {
        session.endSession();
        logger.info("GET /api/provider-payments session ended");
    }
}