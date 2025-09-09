import { NextRequest, NextResponse } from "next/server";
import { adminMiddleware } from "@/middlewares/adminMiddleware";
import { connectDb } from "@/lib/dbConnect";
import ServiceCategory from "@/database/serviceCategoryModel";
import Service from "@/database/serviceModel";

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
        const { categoryName, description, imageUrl } = await req.json();
        const newCategory = new ServiceCategory({ categoryName, description, imageUrl });
        await newCategory.save();
        return NextResponse.json(newCategory, { status: 201 });
    } catch (error) {
        return NextResponse.json({ message: "An error occurred" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    await connectDb();
    const adminAuthResponse = await adminMiddleware(req);
    if (adminAuthResponse.status !== 200) return adminAuthResponse;
    try {
        const { _id, ...updateData } = await req.json();
        if (!_id) {
            return NextResponse.json({ message: "Category ID is required" }, { status: 400 });
        }
        const updatedCategory = await ServiceCategory.findByIdAndUpdate(_id, updateData, { new: true });
        if (!updatedCategory) {
            return NextResponse.json({ message: "Category not found" }, { status: 404 });
        }
        return NextResponse.json(updatedCategory);
    } catch (error) {
        return NextResponse.json({ message: "An error occurred during update" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    await connectDb();
    const adminAuthResponse = await adminMiddleware(req);
    if (adminAuthResponse.status !== 200) return adminAuthResponse;

    try {
        const { id } = await req.json();
        if (!id) {
            return NextResponse.json({ message: "Category ID is required" }, { status: 400 });
        }

        // Optional: Check if any services are using this category before deleting
        const servicesCount = await Service.countDocuments({ category: id });
        if (servicesCount > 0) {
            return NextResponse.json({ message: `Cannot delete category as it is associated with ${servicesCount} service(s).` }, { status: 400 });
        }

        await ServiceCategory.findByIdAndDelete(id);
        return NextResponse.json({ message: "Category deleted successfully" });
    } catch (error) {
        return NextResponse.json({ message: "An error occurred" }, { status: 500 });
    }
}