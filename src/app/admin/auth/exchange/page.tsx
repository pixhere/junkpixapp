"use client";
import { useEffect, Suspense } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter, useSearchParams } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ADMIN_EMAIL = "junkpixapp@gmail.com";

function ExchangeInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleExchange = async () => {
      const code = searchParams.get("code");
      if (!code) {
        router.push("/admin/login?error=no_code");
        return;
      }

      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error || !data.user) {
        router.push(`/admin/login?error=${encodeURIComponent(error?.message || "auth_failed")}`);
        return;
      }

      if (data.user.email !== ADMIN_EMAIL) {
        router.push("/admin/login?error=unauthorized");
        return;
      }

      await fetch("/api/admin-set-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: data.session.access_token }),
      });

      router.push("/admin");
    };

    handleExchange();
  }, []);

  return (
    <div style={{ minHeight:"100vh", background:"#0F172A", display:"flex", alignItems:"center", justifyContent:"center", color:"#94A3B8", fontFamily:"system-ui" }}>
      Verifying your account...
    </div>
  );
}

export default function Exchange() {
  return (
    <Suspense fallback={
      <div style={{ minHeight:"100vh", background:"#0F172A", display:"flex", alignItems:"center", justifyContent:"center", color:"#94A3B8", fontFamily:"system-ui" }}>
        Loading...
      </div>
    }>
      <ExchangeInner />
    </Suspense>
  );
}
