// src/app/api/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminMiddleware } from "@/middlewares/adminMiddleware";
import { getAllUsers, deleteUser, searchUsers } from "@/services/admin/userService";
import { connectDb } from "@/lib/dbConnect";

export async function GET(req: NextRequest) {
  await connectDb();
  const adminAuthResponse = await adminMiddleware(req);
  if (adminAuthResponse.status !== 200) return adminAuthResponse;

  const { searchParams } = new URL(req.url);
  const searchQuery = searchParams.get('search');

  try {
    const users = searchQuery ? await searchUsers(searchQuery) : await getAllUsers();
    return NextResponse.json(users);
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
        await deleteUser(id);
        return NextResponse.json({ message: "User deleted successfully" });
    } catch (error) {
        return NextResponse.json({ message: "An error occurred" }, { status: 500 });
    }
}
