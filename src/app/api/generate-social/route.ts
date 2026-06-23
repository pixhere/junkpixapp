import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { quote, operator } = await req.json();

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "Missing API key" }, { status: 500 });
    }

    const businessName = operator?.business_name || "our team";
    const city = operator?.city || "your area";
    const aiDescription = quote.ai_description || "";
    const estimatedMin = quote.estimated_min || "";
    const estimatedMax = quote.estimated_max || "";

    const systemPrompt = `You are a social media manager for ${businessName}, a local junk removal company in ${city}.
Write short, engaging social media posts about completed junk removal jobs.
Rules:
- Never mention the customer name or full address
- Only mention the city for local SEO
- Sound human, real, and local — not corporate
- Each post should be different in style and angle
- Include relevant hashtags at the end
- Google Business posts: professional, local SEO focused, 150-200 chars + hashtags
- Instagram posts: visual, energetic, show the transformation, 100-150 chars + hashtags  
- Facebook posts: friendly, community focused, 100-200 chars + hashtags
Return ONLY valid JSON with no markdown:
{
  "google": "post text with hashtags",
  "instagram": "post text with hashtags",
  "facebook": "post text with hashtags"
}`;

    const userPrompt = `Job details:
Description: ${aiDescription}
Estimated value: $${estimatedMin}–$${estimatedMax}
City: ${city}

Write 3 social media posts about this completed job. Make each one feel fresh and different.
Variation: ${Math.random()}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 600,
        temperature: 1,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
    }

    const data = await response.json();
    const text = data.content?.find((b: any) => b.type === "text")?.text?.trim() || "";
    
    let posts;
    try {
      posts = JSON.parse(text.replace(/```json|```/g, "").trim());
    } catch {
      posts = {
        google: text,
        instagram: text,
        facebook: text,
      };
    }

    return NextResponse.json({ posts });
  } catch (err: any) {
    console.error("generate-social error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}