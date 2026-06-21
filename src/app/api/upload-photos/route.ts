import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { images } = await req.json();
    const urls: string[] = [];

    for (let i = 0; i < images.length; i++) {
      const base64 = images[i].includes(",") ? images[i].split(",")[1] : images[i];
      const byteString = atob(base64);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let j = 0; j < byteString.length; j++) ia[j] = byteString.charCodeAt(j);
      const blob = new Blob([ia], { type: "image/jpeg" });

      const fileName = `${Date.now()}-${i}.jpg`;

      const { data, error } = await supabase.storage
        .from("quote-photos")
        .upload(fileName, blob, { contentType: "image/jpeg", upsert: true });

      if (error) {
        console.error("Upload error:", error);
        continue;
      }

      const { data: urlData } = supabase.storage
        .from("quote-photos")
        .getPublicUrl(data.path);

      if (urlData?.publicUrl) urls.push(urlData.publicUrl);
    }

    return NextResponse.json({ urls });
  } catch (err: any) {
    console.error("upload-photos error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}