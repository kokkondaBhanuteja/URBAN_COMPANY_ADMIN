import { NextRequest, NextResponse } from "next/server";
import { adminMiddleware } from "@/middlewares/adminMiddleware";
import { addService, removeService, updateService } from "@/services/admin/serviceService";
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
    logger.info("GET /api/services transaction started");
    const adminAuthResponse = await adminMiddleware(req);
    if (adminAuthResponse.status !== 200) {
        await session.abortTransaction();
        return adminAuthResponse;
    }
    const services = await Service.find().session(session);
    await session.commitTransaction();
    logger.info("GET /api/services transaction committed");
    return NextResponse.json(services);
  } catch (error) {
    await session.abortTransaction();
    logger.error("Error in GET /api/services:", {
        message: (error as Error).message,
        stack: (error as Error).stack,
    });
    return NextResponse.json({ message: "An error occurred" }, { status: 500 });
  } finally {
    session.endSession();
    logger.info("GET /api/services session ended");
  }
}

export async function POST(req: NextRequest) {
    const connection = await connectDb();
    if (!connection) {
        return NextResponse.json({ message: "Database connection failed" }, { status: 500 });
    }
    const { db, session } = connection;
    try {
        session.startTransaction();
        logger.info("POST /api/services transaction started");
        const adminAuthResponse = await adminMiddleware(req);
        if (adminAuthResponse.status !== 200) {
            await session.abortTransaction();
            return adminAuthResponse;
        }

        const { serviceName, basePrice, category, description, imageUrl } = await req.json();
        const newService = await addService({ serviceName, basePrice, category, description, priceUnit: 'fixed', imageUrl });
        await session.commitTransaction();
        logger.info("POST /api/services transaction committed");
        return NextResponse.json(newService, { status: 201 });
    } catch (error) {
        await session.abortTransaction();
        logger.error("Error in POST /api/services:", {
            message: (error as Error).message,
            stack: (error as Error).stack,
        });
        return NextResponse.json({ message: "An error occurred" }, { status: 500 });
    } finally {
        session.endSession();
        logger.info("POST /api/services session ended");
    }
}

export async function PATCH(req: NextRequest) {
    const connection = await connectDb();
    if (!connection) {
        return NextResponse.json({ message: "Database connection failed" }, { status: 500 });
    }
    const { db, session } = connection;
    try {
        session.startTransaction();
        logger.info("PATCH /api/services transaction started");
        const adminAuthResponse = await adminMiddleware(req);
        if (adminAuthResponse.status !== 200) {
            await session.abortTransaction();
            return adminAuthResponse;
        }
        
        const { _id, ...updateData } = await req.json();
        if (!_id) {
            await session.abortTransaction();
            return NextResponse.json({ message: "Service ID is required" }, { status: 400 });
        }
        const updatedService = await updateService(_id, updateData);
        if (!updatedService) {
            await session.abortTransaction();
            return NextResponse.json({ message: "Service not found" }, { status: 404 });
        }
        await session.commitTransaction();
        logger.info("PATCH /api/services transaction committed");
        return NextResponse.json(updatedService);
    } catch (error) {
        await session.abortTransaction();
        logger.error("Error in PATCH /api/services:", {
            message: (error as Error).message,
            stack: (error as Error).stack,
        });
        return NextResponse.json({ message: "An error occurred during update" }, { status: 500 });
    } finally {
        session.endSession();
        logger.info("PATCH /api/services session ended");
    }
}


export async function DELETE(req: NextRequest) {
    const connection = await connectDb();
    if (!connection) {
        return NextResponse.json({ message: "Database connection failed" }, { status: 500 });
    }
    const { db, session } = connection;
    try {
        session.startTransaction();
        logger.info("DELETE /api/services transaction started");
        const adminAuthResponse = await adminMiddleware(req);
        if (adminAuthResponse.status !== 200) {
            await session.abortTransaction();
            return adminAuthResponse;
        }

        const { id } = await req.json();
        await removeService(id);
        await session.commitTransaction();
        logger.info("DELETE /api/services transaction committed");
        return NextResponse.json({ message: "Service removed successfully" });
    } catch (error) {
        await session.abortTransaction();
        logger.error("Error in DELETE /api/services:", {
            message: (error as Error).message,
            stack: (error as Error).stack,
        });
        return NextResponse.json({ message: "An error occurred" }, { status: 500 });
    } finally {
        session.endSession();
        logger.info("DELETE /api/services session ended");
    }
}