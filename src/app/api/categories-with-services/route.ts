import { getAllCategoriesWithServices } from "@/services/admin/categoryService";
import { NextRequest, NextResponse } from "next/server";
import { adminMiddleware } from "@/middlewares/adminMiddleware";
import { connectDb } from "@/lib/dbConnect";

export async function GET(req: NextRequest) {
    await connectDb();
    const adminAuthResponse = await adminMiddleware(req);
    if (adminAuthResponse.status !== 200) return adminAuthResponse;
  try {
    // In a real app, fetch from database
    const categories = await getAllCategoriesWithServices();
    return NextResponse.json(categories)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch categories with services" }, { status: 500 })
  }
}