import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { images } = await req.json();

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "Missing API key" }, { status: 500 });
    }

    const imageBlocks = images.map((data: string) => ({
      type: "image",
      source: {
        type: "base64",
        media_type: "image/jpeg",
        data: data.split(",")[1],
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

Return ONLY valid JSON:
{
  "plainDescription": "description of what you see",
  "pricingMode": "itemized"|"loadtier",
  "loadTier": "minimum"|"eighth"|"quarter"|"half"|"threeQ"|"full",
  "estimatedMin": 150,
  "estimatedMax": 300,
  "confidence": "high"|"medium"|"low",
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
    console.log("Anthropic raw response:", raw);

    if (!response.ok) {
      return NextResponse.json({ error: `Anthropic error: ${raw}` }, { status: 500 });
    }

    const data = JSON.parse(raw);
    const txt = data.content?.find((b: any) => b.type === "text")?.text || "";
    const result = JSON.parse(txt.replace(/```json|```/g, "").trim());

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Route error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}