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

export async function GET(req: NextRequest) {
  await connectDb();
  const adminAuthResponse = await adminMiddleware(req);
  if (adminAuthResponse.status !== 200) return adminAuthResponse;
  try {
    const { searchParams } = new URL(req.url);
    const searchQuery = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    if (searchQuery) {
      const discounts = await searchDiscounts(searchQuery);
      return NextResponse.json({ discounts, totalDiscounts: discounts.length });
    }

    const { discounts, totalDiscounts } = await getAllDiscounts(page, limit);
    return NextResponse.json({ discounts, totalDiscounts });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch discounts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  await connectDb();
  const adminAuthResponse = await adminMiddleware(request);
  if (adminAuthResponse.status !== 200) return adminAuthResponse;
  try {
    const body = await request.json();
    console.log(body);

    const { discountType, category, service, ...rest } = body;
    let payload: any = { ...rest, discountType };

    if (discountType === 'Category Specific') {
      if (!category) {
        return NextResponse.json({ error: "Category ID is required for Category Specific discount" }, { status: 400 });
      }
      payload.category = category;
    } else if (discountType === 'Service Specific') {
      if ( !service) {
        return NextResponse.json({ error: "Category and Service IDs are required for Service Specific discount" }, { status: 400 });
      }
      payload.category = category;
      payload.service = service;
    }
    // For 'Global' type, the category and service fields are correctly omitted from the payload

    const newDiscount = await addDiscount(payload);

    return NextResponse.json(newDiscount, { status: 201 });
  } catch (error) {
    console.error("Failed to create discount:", error);
    return NextResponse.json(
      { error: "Failed to create discount. " + error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  await connectDb();
  const adminAuthResponse = await adminMiddleware(request);
  if (adminAuthResponse.status !== 200) return adminAuthResponse;
  try {
    const body = await request.json();
    const { _id, ...rest } = body;

    if (!_id) {
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
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update discount:", error);
    return NextResponse.json(
      { error: "Failed to update discount. " + error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  await connectDb();
  const adminAuthResponse = await adminMiddleware(request);
  if (adminAuthResponse.status !== 200) return adminAuthResponse;
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Discount ID is required" },
        { status: 400 }
      );
    }

    await deleteDiscount(id);
    return NextResponse.json({ message: "Discount deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete discount" },
      { status: 500 }
    );
  }
}