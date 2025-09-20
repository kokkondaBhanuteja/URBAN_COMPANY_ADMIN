import { getAllCategoriesWithServices } from "@/services/admin/categoryService";
import { NextRequest, NextResponse } from "next/server";
import { adminMiddleware } from "@/middlewares/adminMiddleware";
import { connectDb } from "@/lib/dbConnect";
import logger from "@/lib/logger";

export async function GET(req: NextRequest) {
    const connection = await connectDb();
    if (!connection) {
        return NextResponse.json({ message: "Database connection failed" }, { status: 500 });
    }
    const { db, session } = connection;
    try {
        session.startTransaction();
        logger.info("GET /api/categories-with-services transaction started");
        const adminAuthResponse = await adminMiddleware(req);
        if (adminAuthResponse.status !== 200) {
            await session.abortTransaction();
            return adminAuthResponse;
        }
      // In a real app, fetch from database
      const categories = await getAllCategoriesWithServices();
      await session.commitTransaction();
      logger.info("GET /api/categories-with-services transaction committed");
      return NextResponse.json(categories)
    } catch (error) {
        await session.abortTransaction();
        logger.error("Error in GET /api/categories-with-services:", {
            message: (error as Error).message,
            stack: (error as Error).stack,
        });
      return NextResponse.json({ error: "Failed to fetch categories with services" }, { status: 500 })
    } finally {
        session.endSession();
        logger.info("GET /api/categories-with-services session ended");
    }
}