import { NextRequest, NextResponse } from "next/server";
import { adminMiddleware } from "@/middlewares/adminMiddleware";
import { connectDb } from "@/lib/dbConnect";
import ServiceCategory from "@/database/serviceCategoryModel";

export async function GET(req: NextRequest) {
    await connectDb();
    const adminAuthResponse = await adminMiddleware(req);
    if (adminAuthResponse.status !== 200) return adminAuthResponse;

    try {
        const categories = await ServiceCategory.find({});
        return NextResponse.json(categories);
    } catch (error) {
        return NextResponse.json({ message: "An error occurred" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    await connectDb();
    const adminAuthResponse = await adminMiddleware(req);
    if (adminAuthResponse.status !== 200) return adminAuthResponse;

    try {
        const { categoryName, description } = await req.json();
        const newCategory = new ServiceCategory({ categoryName, description });
        await newCategory.save();
        return NextResponse.json(newCategory, { status: 201 });
    } catch (error) {
        return NextResponse.json({ message: "An error occurred" }, { status: 500 });
    }
}
