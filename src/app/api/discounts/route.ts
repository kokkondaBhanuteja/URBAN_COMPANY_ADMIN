import { type NextRequest, NextResponse } from "next/server";
import {
  addDiscount,
  deleteDiscount,
  getAllDiscounts,
  updateDiscount,
} from "@/services/admin/discountService";
import { connectDb } from "@/lib/dbConnect";
import { adminMiddleware } from "@/middlewares/adminMiddleware";

export async function GET(req: NextRequest) {
  await connectDb();
  const adminAuthResponse = await adminMiddleware(req);
  if (adminAuthResponse.status !== 200) return adminAuthResponse;
  try {
    const discounts = await getAllDiscounts();
    return NextResponse.json(discounts);
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

    const newDiscount = await addDiscount(body);

    return NextResponse.json(newDiscount, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create discount" },
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
    const { _id, ...updates } = body;

    if (!_id) {
      return NextResponse.json(
        { error: "Discount ID is required" },
        { status: 400 }
      );
    }

    const updated = await updateDiscount(_id, updates);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update discount" },
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
