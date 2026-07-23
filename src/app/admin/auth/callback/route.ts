import { NextRequest, NextResponse } from "next/server";

const ADMIN_EMAIL = "junkpixapp@gmail.com";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/admin/login?error=no_code", req.url));
  }

  try {
    // Exchange code for session via Supabase REST API
    const tokenRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=pkce`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ auth_code: code }),
    });

    if (!tokenRes.ok) {
      // Try standard code exchange
      const tokenRes2 = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=authorization_code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ code }),
      });
      
      if (!tokenRes2.ok) {
        const err = await tokenRes2.text();
        return NextResponse.redirect(new URL(`/admin/login?error=${encodeURIComponent(err)}`, req.url));
      }

      const session = await tokenRes2.json();
      if (session.user?.email !== ADMIN_EMAIL) {
        return NextResponse.redirect(new URL("/admin/login?error=unauthorized", req.url));
      }

      const response = NextResponse.redirect(new URL("/admin", req.url));
      response.cookies.set("admin_session", session.access_token, {
        httpOnly: true, secure: true, sameSite: "lax", maxAge: 60 * 60 * 8, path: "/",
      });
      return response;
    }

    const session = await tokenRes.json();
    if (session.user?.email !== ADMIN_EMAIL) {
      return NextResponse.redirect(new URL("/admin/login?error=unauthorized", req.url));
    }

    const response = NextResponse.redirect(new URL("/admin", req.url));
    response.cookies.set("admin_session", session.access_token, {
      httpOnly: true, secure: true, sameSite: "lax", maxAge: 60 * 60 * 8, path: "/",
    });
    return response;

  } catch (err: any) {
    return NextResponse.redirect(new URL(`/admin/login?error=${encodeURIComponent(err.message)}`, req.url));
  }
}
