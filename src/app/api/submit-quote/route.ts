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

    return NextResponse.json({ quote: data });
  } catch (err: any) {
    console.error("Submit quote error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}