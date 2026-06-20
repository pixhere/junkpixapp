import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const images = body.images;

    if (!images || images.length === 0) {
      return NextResponse.json({ error: "No images provided" }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "Missing API key" }, { status: 500 });
    }

    const imageBlocks = images.map((data: string) => ({
      type: "image",
      source: {
        type: "base64",
        media_type: "image/jpeg",
        data: data.includes(",") ? data.split(",")[1] : data,
      },
    }));

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 800,
        system: `You are a junk removal estimator. Analyze the photos and describe the job.

Return ONLY valid JSON with no markdown:
{
  "plainDescription": "description of what you see",
  "pricingMode": "itemized",
  "loadTier": "quarter",
  "estimatedMin": 150,
  "estimatedMax": 300,
  "confidence": "medium",
  "visibleHazardFlag": false
}`,
        messages: [{
          role: "user",
          content: [
            ...imageBlocks,
            { type: "text", text: "Describe this junk removal job and return JSON only." }
          ]
        }]
      }),
    });

    const raw = await response.text();

    if (!response.ok) {
      console.error("Anthropic error:", raw);
      return NextResponse.json({ error: `Anthropic error: ${response.status}` }, { status: 500 });
    }

    const data = JSON.parse(raw);
    const txt = data.content?.find((b: any) => b.type === "text")?.text || "";
    
    let result;
    try {
      result = JSON.parse(txt.replace(/```json|```/g, "").trim());
    } catch {
      result = {
        plainDescription: txt || "Unable to analyze photo.",
        pricingMode: "loadtier",
        loadTier: "quarter",
        estimatedMin: 150,
        estimatedMax: 350,
        confidence: "low",
        visibleHazardFlag: false
      };
    }

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Analyze route error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}