import { type NextRequest, NextResponse } from "next/server";
import {
  addDiscount,
  deleteDiscount,
  getAllDiscounts,
  updateDiscount,
  searchDiscounts,
} from "@/services/admin/discountService";
import { connectDb } from "@/lib/dbConnect";
import { adminMiddleware } from "@/middlewares/adminMiddleware";
import logger from "@/lib/logger";

export async function GET(req: NextRequest) {
  const connection = await connectDb();
  if (!connection) {
    return NextResponse.json({ message: "Database connection failed" }, { status: 500 });
  }
  const { db, session } = connection;
  try {
    session.startTransaction();
    logger.info("GET /api/discounts transaction started");
    const adminAuthResponse = await adminMiddleware(req);
    if (adminAuthResponse.status !== 200) {
        await session.abortTransaction();
        return adminAuthResponse;
    }
    const { searchParams } = new URL(req.url);
    const searchQuery = searchParams.get("search");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    if (searchQuery || status) {
      const discounts = await searchDiscounts(searchQuery, status);
      await session.commitTransaction();
      logger.info("GET /api/discounts transaction committed");
      return NextResponse.json({ discounts, totalDiscounts: discounts.length });
    }

    const { discounts, totalDiscounts } = await getAllDiscounts(page, limit);
    await session.commitTransaction();
    logger.info("GET /api/discounts transaction committed");
    return NextResponse.json({ discounts, totalDiscounts });
  } catch (error) {
    await session.abortTransaction();
    logger.error("Error in GET /api/discounts:", {
        message: (error as Error).message,
        stack: (error as Error).stack,
    });
    return NextResponse.json(
      { error: "Failed to fetch discounts" },
      { status: 500 }
    );
  } finally {
    session.endSession();
    logger.info("GET /api/discounts session ended");
  }
}

export async function POST(request: NextRequest) {
    const connection = await connectDb();
    if (!connection) {
        return NextResponse.json({ message: "Database connection failed" }, { status: 500 });
    }
    const { db, session } = connection;
  try {
    session.startTransaction();
    logger.info("POST /api/discounts transaction started");
    const adminAuthResponse = await adminMiddleware(request);
    if (adminAuthResponse.status !== 200) {
        await session.abortTransaction();
        return adminAuthResponse;
    }
    const body = await request.json();
    console.log(body);

    const { discountType, category, service, ...rest } = body;
    let payload: any = { ...rest, discountType };

    if (discountType === 'Category Specific') {
      if (!category) {
        await session.abortTransaction();
        return NextResponse.json({ error: "Category ID is required for Category Specific discount" }, { status: 400 });
      }
      payload.category = category;
    } else if (discountType === 'Service Specific') {
      if ( !service) {
        await session.abortTransaction();
        return NextResponse.json({ error: "Category and Service IDs are required for Service Specific discount" }, { status: 400 });
      }
      payload.category = category;
      payload.service = service;
    }
    // For 'Global' type, the category and service fields are correctly omitted from the payload

    const newDiscount = await addDiscount(payload);
    await session.commitTransaction();
    logger.info("POST /api/discounts transaction committed");

    return NextResponse.json(newDiscount, { status: 201 });
  } catch (error) {
    await session.abortTransaction();
    logger.error("Failed to create discount:", {
        message: (error as Error).message,
        stack: (error as Error).stack,
    });
    return NextResponse.json(
      { error: "Failed to create discount. " + (error as Error).message },
      { status: 500 }
    );
  } finally {
    session.endSession();
    logger.info("POST /api/discounts session ended");
  }
}

export async function PATCH(request: NextRequest) {
    const connection = await connectDb();
    if (!connection) {
        return NextResponse.json({ message: "Database connection failed" }, { status: 500 });
    }
    const { db, session } = connection;
  try {
    session.startTransaction();
    logger.info("PATCH /api/discounts transaction started");
    const adminAuthResponse = await adminMiddleware(request);
    if (adminAuthResponse.status !== 200) {
        await session.abortTransaction();
        return adminAuthResponse;
    }
    const body = await request.json();
    const { _id, ...rest } = body;

    if (!_id) {
        await session.abortTransaction();
      return NextResponse.json(
        { error: "Discount ID is required" },
        { status: 400 }
      );
    }
    
    // Construct the payload to prevent Mongoose CastError on empty strings
    let updates: any = {};
    for (const key in rest) {
        // Exclude empty category and service IDs for Global discounts
        if (rest.discountType === 'Global' && (key === 'category' || key === 'service')) {
            updates[key] = null; // Explicitly set to null to clear the field in the database
        } else if (rest[key] !== "") {
            updates[key] = rest[key];
        }
    }
    
    const updated = await updateDiscount(_id, updates);
    await session.commitTransaction();
    logger.info("PATCH /api/discounts transaction committed");
    return NextResponse.json(updated);
  } catch (error) {
    await session.abortTransaction();
    logger.error("Failed to update discount:", {
        message: (error as Error).message,
        stack: (error as Error).stack,
    });
    return NextResponse.json(
      { error: "Failed to update discount. " + (error as Error).message },
      { status: 500 }
    );
  } finally {
    session.endSession();
    logger.info("PATCH /api/discounts session ended");
  }
}

export async function DELETE(request: NextRequest) {
    const connection = await connectDb();
    if (!connection) {
        return NextResponse.json({ message: "Database connection failed" }, { status: 500 });
    }
    const { db, session } = connection;
  try {
    session.startTransaction();
    logger.info("DELETE /api/discounts transaction started");
    const adminAuthResponse = await adminMiddleware(request);
    if (adminAuthResponse.status !== 200) {
        await session.abortTransaction();
        return adminAuthResponse;
    }
    const body = await request.json();
    const { id } = body;

    if (!id) {
        await session.abortTransaction();
      return NextResponse.json(
        { error: "Discount ID is required" },
        { status: 400 }
      );
    }

    await deleteDiscount(id);
    await session.commitTransaction();
    logger.info("DELETE /api/discounts transaction committed");
    return NextResponse.json({ message: "Discount deleted successfully" });
  } catch (error) {
    await session.abortTransaction();
    logger.error("Failed to delete discount:", {
        message: (error as Error).message,
        stack: (error as Error).stack,
    });
    return NextResponse.json(
      { error: "Failed to delete discount" },
      { status: 500 }
    );
  } finally {
    session.endSession();
    logger.info("DELETE /api/discounts session ended");
  }
}