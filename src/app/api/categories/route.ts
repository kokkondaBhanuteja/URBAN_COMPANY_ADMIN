import { NextRequest, NextResponse } from "next/server";
import { adminMiddleware } from "@/middlewares/adminMiddleware";
import { connectDb } from "@/lib/dbConnect";
import ServiceCategory from "@/database/serviceCategoryModel";
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
        logger.info("GET /api/categories transaction started");
        const adminAuthResponse = await adminMiddleware(req);
        if (adminAuthResponse.status !== 200) {
            await session.abortTransaction();
            return adminAuthResponse;
        }

        const categories = await ServiceCategory.find({}).session(session);
        await session.commitTransaction();
        logger.info("GET /api/categories transaction committed");
        return NextResponse.json(categories);
    } catch (error) {
        await session.abortTransaction();
        logger.error("Error in GET /api/categories:", {
            message: (error as Error).message,
            stack: (error as Error).stack,
        });
        return NextResponse.json({ message: "An error occurred" }, { status: 500 });
    } finally {
        session.endSession();
        logger.info("GET /api/categories session ended");
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
        logger.info("POST /api/categories transaction started");
        const adminAuthResponse = await adminMiddleware(req);
        if (adminAuthResponse.status !== 200) {
            await session.abortTransaction();
            return adminAuthResponse;
        }

        const { categoryName, description, imageUrl } = await req.json();
        const newCategory = new ServiceCategory({ categoryName, description, imageUrl });
        await newCategory.save({ session });
        await session.commitTransaction();
        logger.info("POST /api/categories transaction committed");
        return NextResponse.json(newCategory, { status: 201 });
    } catch (error) {
        await session.abortTransaction();
        logger.error("Error in POST /api/categories:", {
            message: (error as Error).message,
            stack: (error as Error).stack,
        });
        return NextResponse.json({ message: "An error occurred" }, { status: 500 });
    } finally {
        session.endSession();
        logger.info("POST /api/categories session ended");
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
        logger.info("PATCH /api/categories transaction started");
        const adminAuthResponse = await adminMiddleware(req);
        if (adminAuthResponse.status !== 200) {
            await session.abortTransaction();
            return adminAuthResponse;
        }
        const { id, ...updateData } = await req.json();
        if (!id) {
            await session.abortTransaction();
            return NextResponse.json({ message: "Category ID is required" }, { status: 400 });
        }
        const updatedCategory = await ServiceCategory.findByIdAndUpdate(id, updateData, { new: true, session });
        if (!updatedCategory) {
            await session.abortTransaction();
            return NextResponse.json({ message: "Category not found" }, { status: 404 });
        }
        await session.commitTransaction();
        logger.info("PATCH /api/categories transaction committed");
        return NextResponse.json(updatedCategory);
    } catch (error) {
        await session.abortTransaction();
        logger.error("Error in PATCH /api/categories:", {
            message: (error as Error).message,
            stack: (error as Error).stack,
        });
        return NextResponse.json({ message: "An error occurred during update" }, { status: 500 });
    } finally {
        session.endSession();
        logger.info("PATCH /api/categories session ended");
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
        logger.info("DELETE /api/categories transaction started");
        const adminAuthResponse = await adminMiddleware(req);
        if (adminAuthResponse.status !== 200) {
            await session.abortTransaction();
            return adminAuthResponse;
        }

        const { id } = await req.json();
        if (!id) {
            await session.abortTransaction();
            return NextResponse.json({ message: "Category ID is required" }, { status: 400 });
        }

        // Optional: Check if any services are using this category before deleting
        const servicesCount = await Service.countDocuments({ category: id }).session(session);
        if (servicesCount > 0) {
            await session.abortTransaction();
            return NextResponse.json({ message: `Cannot delete category as it is associated with ${servicesCount} service(s).` }, { status: 400 });
        }

        await ServiceCategory.findByIdAndDelete(id).session(session);
        await session.commitTransaction();
        logger.info("DELETE /api/categories transaction committed");
        return NextResponse.json({ message: "Category deleted successfully" });
    } catch (error) {
        await session.abortTransaction();
        logger.error("Error in DELETE /api/categories:", {
            message: (error as Error).message,
            stack: (error as Error).stack,
        });
        return NextResponse.json({ message: "An error occurred" }, { status: 500 });
    } finally {
        session.endSession();
        logger.info("DELETE /api/categories session ended");
    }
}