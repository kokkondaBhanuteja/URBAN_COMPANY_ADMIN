import { NextRequest, NextResponse } from "next/server";
import { adminMiddleware } from "@/middlewares/adminMiddleware";
import { getAllProviders, deleteProvider, searchProviders, updateProviderVerification, getProviderStats } from "@/services/admin/providerService";
import { connectDb } from "@/lib/dbConnect";

export async function GET(req: NextRequest) {
  await connectDb();
  const adminAuthResponse = await adminMiddleware(req);
  if (adminAuthResponse.status !== 200) return adminAuthResponse;

  const { searchParams } = new URL(req.url);
  const searchQuery = searchParams.get('search');
  const getStats = searchParams.get('stats');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);

  try {
    if(getStats) {
        const stats = await getProviderStats();
        return NextResponse.json(stats);
    }
    if (searchQuery) {
        const providers = await searchProviders(searchQuery);
        return NextResponse.json({ providers, totalProviders: providers.length });
    }
    
    const { providers, totalProviders } = await getAllProviders(page, limit);
    return NextResponse.json({ providers, totalProviders });

  } catch (error) {
    return NextResponse.json({ message: "An error occurred" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
    await connectDb();
    const adminAuthResponse = await adminMiddleware(req);
    if (adminAuthResponse.status !== 200) return adminAuthResponse;

    try {
        const { id } = await req.json();
        await deleteProvider(id);
        return NextResponse.json({ message: "Provider deleted successfully" });
    } catch (error) {
        return NextResponse.json({ message: "An error occurred" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    await connectDb();
    const adminAuthResponse = await adminMiddleware(req);
    if(adminAuthResponse.status !== 200) return adminAuthResponse;

    try {
        const { id, isVerified } = await req.json();
        if (typeof isVerified !== 'boolean') {
            return NextResponse.json({ message: "Invalid 'isVerified' value provided" }, { status: 400 });
        }
        const updatedProvider = await updateProviderVerification(id, isVerified);
        return NextResponse.json(updatedProvider);
    } catch (error) {
        return NextResponse.json({ message: "An error occurred" }, { status: 500 });
    }
}