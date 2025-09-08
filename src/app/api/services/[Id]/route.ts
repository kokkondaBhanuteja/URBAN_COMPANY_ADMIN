import { NextRequest, NextResponse } from "next/server";
import { adminMiddleware } from "@/middlewares/adminMiddleware";
import { connectDb } from "@/lib/dbConnect";
import Service from "@/database/serviceModel";

export async function GET(req: NextRequest) {
    await connectDb();
    const adminAuthResponse = await adminMiddleware(req);
    if (adminAuthResponse.status !== 200) return adminAuthResponse;
  
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId');
  
    try {
      const services = await Service.find({ category: categoryId });
      return NextResponse.json(services);
    } catch (error) {
      return NextResponse.json({ message: "An error occurred" }, { status: 500 });
    }
  }