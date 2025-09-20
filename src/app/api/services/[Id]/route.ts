import { NextRequest, NextResponse } from "next/server";
import { adminMiddleware } from "@/middlewares/adminMiddleware";
import { connectDb } from "@/lib/dbConnect";
import Service from "@/database/serviceModel";
import logger from "@/lib/logger";

export async function GET(req: NextRequest) {
    const connection = await connectDb();
    if (!connection) {
        return NextResponse.json({ message: "Database connection failed" }, { status: 500 });
    }
    const { db, session } = connection;
  try {
    session.startTransaction();
    logger.info("GET /api/services/[Id] transaction started");
    const adminAuthResponse = await adminMiddleware(req);
    if (adminAuthResponse.status !== 200) {
        await session.abortTransaction();
        return adminAuthResponse;
    }
  
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId');
  
    const services = await Service.find({ category: categoryId }).session(session);
    await session.commitTransaction();
    logger.info("GET /api/services/[Id] transaction committed");
    return NextResponse.json(services);
  } catch (error) {
    await session.abortTransaction();
    logger.error("Error in GET /api/services/[Id]:", {
        message: (error as Error).message,
        stack: (error as Error).stack,
    });
    return NextResponse.json({ message: "An error occurred" }, { status: 500 });
  } finally {
    session.endSession();
    logger.info("GET /api/services/[Id] session ended");
  }
}