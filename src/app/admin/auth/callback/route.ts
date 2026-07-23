import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams, hash } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL(`/admin/login?error=${error}`, req.url));
  }

  if (code) {
    // Redirect to a client-side page that handles the session
    return NextResponse.redirect(new URL(`/admin/auth/exchange?code=${code}`, req.url));
  }

  return NextResponse.redirect(new URL("/admin/login?error=no_code", req.url));
}
