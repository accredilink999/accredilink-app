import { NextResponse } from "next/server";

const CANONICAL_HOST = "carecallai.co.uk";

export function middleware(request) {
  const host = request.headers.get("host") || "";

  // 301 redirect any non-canonical domain (e.g. accredilinkcare.co.uk) to carecallai.co.uk
  if (host && !host.includes(CANONICAL_HOST) && !host.includes("localhost") && !host.includes("vercel.app")) {
    const url = new URL(request.url);
    url.host = CANONICAL_HOST;
    url.protocol = "https:";
    return NextResponse.redirect(url, 301);
  }

  return NextResponse.next();
}

export const config = {
  // Run on all routes except static files and api routes
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif|ico|webp|avif|woff2?|ttf|css|js)).*)"],
};
