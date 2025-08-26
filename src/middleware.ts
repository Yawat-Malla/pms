import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  console.log("Middleware hit:", req.url);
  
  // Example: protect /dashboard
  if (req.nextUrl.pathname.startsWith("/dashboard")) {
    // do auth checks here
    // return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

// Optional: limit it to certain routes
export const config = {
  matcher: ["/dashboard/:path*"],
};
