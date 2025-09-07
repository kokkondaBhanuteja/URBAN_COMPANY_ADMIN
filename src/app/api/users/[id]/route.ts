import { NextRequest, NextResponse } from "next/server";
import { adminMiddleware } from "@/middlewares/adminMiddleware";
import { updateUser, getUserById } from "@/services/admin/userService";
import { connectDb } from "@/lib/dbConnect";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  await connectDb();
  const adminAuthResponse = await adminMiddleware(req);
  if (adminAuthResponse.status !== 200) return adminAuthResponse;

  try {
    const user = await getUserById(params.id);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ message: "An error occurred" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    await connectDb();
    const adminAuthResponse = await adminMiddleware(req);
    if (adminAuthResponse.status !== 200) return adminAuthResponse;

    try {
        const { id } = params;
        const body = await req.json();
        
        const updatedUser = await updateUser(id, body);
        if (!updatedUser) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }
        return NextResponse.json(updatedUser);
    } catch (error) {
        return NextResponse.json({ message: "An error occurred" }, { status: 500 });
    }
}