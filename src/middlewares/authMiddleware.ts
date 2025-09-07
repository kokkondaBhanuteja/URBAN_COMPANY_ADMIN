import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export function middleware(req: NextRequest) {
  const authHeader = req.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ message: "Not authorized, no token" }, { status: 401 });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);

    // ✅ Attach decoded user to headers (since req.user is not allowed)
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-user", JSON.stringify(decoded));

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    return NextResponse.json({ message: "Not authorized, token failed" }, { status: 401 });
  }
}
