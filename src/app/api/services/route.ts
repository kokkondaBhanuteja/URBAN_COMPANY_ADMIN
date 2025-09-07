import { NextRequest, NextResponse } from "next/server";
import { adminMiddleware } from "@/middlewares/adminMiddleware";
import { addService, removeService, updateService } from "@/services/admin/serviceService";
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

export async function POST(req: NextRequest) {
    await connectDb();
    const adminAuthResponse = await adminMiddleware(req);
    if (adminAuthResponse.status !== 200) return adminAuthResponse;

    try {
        const { serviceName, basePrice, category, description } = await req.json();
        const newService = await addService({ serviceName, basePrice, category, description, priceUnit: 'fixed' });
        return NextResponse.json(newService, { status: 201 });
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
            return NextResponse.json({ message: "Service ID is required" }, { status: 400 });
        }
        const updatedService = await updateService(_id, updateData);
        if (!updatedService) {
            return NextResponse.json({ message: "Service not found" }, { status: 404 });
        }
        return NextResponse.json(updatedService);
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
        await removeService(id);
        return NextResponse.json({ message: "Service removed successfully" });
    } catch (error) {
        return NextResponse.json({ message: "An error occurred" }, { status: 500 });
    }
}