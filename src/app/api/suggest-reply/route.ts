import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { quote, operator, replyType, seed } = body;

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "Missing API key" }, { status: 500 });
    }

    const businessName = operator?.business_name || "our team";
    const ownerName = operator?.owner_name?.split(" ")[0] || "";

    const quoteContext = `
Customer: ${quote.customer_name}
Address: ${quote.customer_address}
Phone: ${quote.customer_phone}
Email: ${quote.customer_email}
Customer notes: ${quote.customer_notes || "none"}
AI job description: ${quote.ai_description}
Estimated price range: $${quote.estimated_min}–$${quote.estimated_max}
Current status: ${quote.status}
Final price set: ${quote.final_price ? `$${quote.final_price}` : "not set yet"}
`.trim();

    const replyPrompts: Record<string, string> = {
      follow_up: `Write a short, friendly follow-up text message from ${businessName} to ${quote.customer_name}. They submitted a junk removal quote request but haven't been contacted yet. Keep it under 3 sentences. Sound like a real local business owner — warm, professional, not salesy. Include the price range if it makes sense.`,
      quote_ready: `Write a short text message sending the quote to ${quote.customer_name} from ${businessName}. The price is $${quote.final_price || quote.estimated_min}. Keep it under 4 sentences. Be direct, friendly, and include a clear call to action to book.`,
      booking_confirm: `Write a short, warm confirmation text to ${quote.customer_name} from ${businessName}. Their junk removal job at ${quote.customer_address} is booked. Keep it under 3 sentences. Make them feel confident and taken care of.`,
      need_more_info: `Write a short, polite text to ${quote.customer_name} from ${businessName}. We need to see the junk before finalizing a price for their job at ${quote.customer_address}. Ask them to send a photo or schedule a free 5-min video call. Keep it under 3 sentences.`,
      price_negotiation: `Write a tactful text to ${quote.customer_name} from ${businessName}. They may be price sensitive. The job is estimated at $${quote.estimated_min}–$${quote.estimated_max}. Briefly explain the value (same-day, no hassle, full cleanup) without discounting. Under 4 sentences.`,
      no_show_follow_up: `Write a brief, non-pushy follow-up text to ${quote.customer_name} from ${businessName}. They haven't responded to the quote. Check in and keep the door open. Under 2 sentences. No pressure.`,
    };

    const selectedPrompt = replyPrompts[replyType] || replyPrompts.follow_up;

    const variations = [
      "Start with the customer's name.",
      "Do not start with the customer's name.",
      "Lead with the job details.",
      "Lead with availability or timing.",
      "Keep it to one sentence only.",
      "Be extra casual and brief.",
    ];

    const variation = variations[seed % variations.length];

    const systemPrompt = `You write SMS text messages for ${businessName}, a local junk removal company.${ownerName ? ` The owner's name is ${ownerName}.` : ""} You write in first person as the business. Messages are short, human, and conversational — like a real text, not a corporate email. Never use hashtags or salesy phrases. Return ONLY the text message. No subject line, no quotes, no explanation.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 300,
        temperature: 1,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: `Here's the job context:\n${quoteContext}\n\nTask: ${selectedPrompt}\n\nStyle instruction for this version: ${variation}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Anthropic error:", err);
      return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
    }

    const data = await response.json();
    const text = data.content?.find((b: any) => b.type === "text")?.text?.trim() || "";

    return NextResponse.json({ reply: text });
  } catch (err: any) {
    console.error("suggest-reply error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}