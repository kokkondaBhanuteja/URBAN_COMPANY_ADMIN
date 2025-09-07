import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import User from "@/database/userModel";

export async function adminMiddleware(req: NextRequest) {
  const authHeader = req.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ message: "Not authorized, no token" }, { status: 401 });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };

    const user = await User.findById(decoded.id);

    if (!user || user.userType !== "admin") {
      return NextResponse.json({ message: "Not authorized as an admin" }, { status: 403 });
    }

    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-user", JSON.stringify(user));

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    return NextResponse.json({ message: "Not authorized, token failed", error }, { status: 401 });
  }
}
