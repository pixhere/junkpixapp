import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    const { data, error } = await supabase
      .from("quote_requests")
      .insert(body)
      .select()
      .single();

    if (error) {
      console.error("Submit quote error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fire webhook if operator has one enabled
    if (data) {
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/webhook/fire`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operatorId: body.operator_id,
          event: "quote.submitted",
          data: {
            quote_id: data.id,
            customer_name: data.customer_name,
            customer_phone: data.customer_phone,
            customer_email: data.customer_email,
            customer_address: data.customer_address,
            ai_description: data.ai_description,
            estimated_min: data.estimated_min,
            estimated_max: data.estimated_max,
            status: data.status,
            photo_urls: data.photo_urls,
            created_at: data.created_at,
          }
        }),
      }).catch(() => {}); // fire and forget
    }

    return NextResponse.json({ quote: data });
  } catch (err: any) {
    console.error("Submit quote error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}