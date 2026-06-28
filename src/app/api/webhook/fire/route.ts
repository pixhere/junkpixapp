import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { operatorId, event, data } = await req.json();

    // Get operator webhook settings
    const { data: operator } = await supabase
      .from("operators")
      .select("webhook_url, webhook_enabled, business_name, owner_name")
      .eq("id", operatorId)
      .single();

    if (!operator?.webhook_enabled || !operator?.webhook_url) {
      return NextResponse.json({ skipped: true, reason: "Webhook not enabled" });
    }

    // Build payload
    const payload = {
      event,
      timestamp: new Date().toISOString(),
      operator: {
        id: operatorId,
        business_name: operator.business_name,
        owner_name: operator.owner_name,
      },
      data,
    };

    // Fire webhook
    const response = await fetch(operator.webhook_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-JunkPix-Event": event,
        "X-JunkPix-Timestamp": new Date().toISOString(),
      },
      body: JSON.stringify(payload),
    });

    return NextResponse.json({ 
      success: response.ok, 
      status: response.status,
      event 
    });

  } catch (err: any) {
    console.error("Webhook fire error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}