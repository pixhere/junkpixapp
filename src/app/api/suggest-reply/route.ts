import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { quote, operator, replyType, seed, customerMessage } = body;

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "Missing API key" }, { status: 500 });
    }

    const businessName = operator?.business_name || "our team";
    const ownerName = operator?.owner_name?.split(" ")[0] || "";
    const finalPrice = quote.final_price ? `$${quote.final_price}` : null;
    const priceContext = finalPrice 
      ? `Quoted price: ${finalPrice}` 
      : `Estimated range: $${quote.estimated_min}–$${quote.estimated_max}`;

    const quoteContext = `
Customer: ${quote.customer_name}
Address: ${quote.customer_address}
Phone: ${quote.customer_phone}
Email: ${quote.customer_email}
Customer notes: ${quote.customer_notes || "none"}
Job description: ${quote.ai_description}
${priceContext}
Status: ${quote.status}
${customerMessage ? `Customer just said: "${customerMessage}"` : ""}
`.trim();

    const MASTERS_SYSTEM = `You are a master sales communicator combining the best of:
- Chris Voss: tactical empathy, mirroring, "that's right" moments
- Alex Hormozi: value stacking, make the offer irresistible  
- Grant Cardone: urgency, follow up relentlessly, never accept no
- Mary Kay Ash: relationship first, make them feel valued
- Dale Carnegie: genuine interest, remember their situation

You write SMS text messages for ${businessName}, a local junk removal company.${ownerName ? ` The owner is ${ownerName}.` : ""}
Rules:
- Write in first person as the business owner
- Short, human, conversational — like a real text not a corporate email
- Never use hashtags or salesy buzzwords
- Create urgency without being pushy
- Reference the specific job details when relevant
- Return ONLY the text message. No quotes, no explanation, no subject line.`;

    const replyPrompts: Record<string, string> = {
      follow_up: `Write a follow-up text to ${quote.customer_name}. ${finalPrice ? `We already sent them a quote for ${finalPrice}.` : `Price range is $${quote.estimated_min}–$${quote.estimated_max}.`} Use Cardone's follow-up energy — persistent but not annoying. Create soft urgency around schedule or availability. Under 3 sentences.`,
      
      quote_ready: `Write a text sending the quote to ${quote.customer_name}. Price: ${finalPrice || `$${quote.estimated_min}–$${quote.estimated_max}`}. Use Hormozi's value stacking — remind them what they GET (same-day, no hassle, full cleanup, licensed). End with a clear call to action. Under 4 sentences.`,
      
      booking_confirm: `Write a confirmation text to ${quote.customer_name}. Their job at ${quote.customer_address} is booked${finalPrice ? ` for ${finalPrice}` : ""}. Use Mary Kay's warmth — make them feel taken care of and confident. Under 3 sentences.`,
      
      need_more_info: `Write a text to ${quote.customer_name} asking for more photos or a quick video call to finalize the price. Use Voss's empathy — acknowledge their situation first, then make the ask feel easy. Under 3 sentences.`,
      
      price_negotiation: `Write a response to ${quote.customer_name} who ${customerMessage ? `said: "${customerMessage}"` : "may be price sensitive"}. Price is ${finalPrice || `$${quote.estimated_min}–$${quote.estimated_max}`}. Use Hormozi's value stacking + Voss's tactical empathy. Defend the price by stacking the value. Never discount. Under 4 sentences.`,
      
      no_show_follow_up: `Write a non-pushy follow-up to ${quote.customer_name} who hasn't responded. Use Voss's "no-oriented" question technique — give them an easy out that actually keeps the conversation open. Under 2 sentences.`,
    };

    const selectedPrompt = replyPrompts[replyType] || replyPrompts.follow_up;

    const variations = [
      "Start with the customer's name.",
      "Do not start with their name — lead with the value or the job.",
      "Lead with availability or timing urgency.",
      "Be extra casual and brief — one sentence max.",
      "Use a question to engage them.",
      "Lead with a specific detail about their job.",
    ];

    const variation = variations[(seed || Date.now()) % variations.length];

    // Stream the response
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
        stream: true,
        system: MASTERS_SYSTEM,
        messages: [{
          role: "user",
          content: `Job context:\n${quoteContext}\n\nTask: ${selectedPrompt}\n\nStyle: ${variation}`,
        }],
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;
              try {
                const parsed = JSON.parse(data);
                if (parsed.type === "content_block_delta" && parsed.delta?.text) {
                  controller.enqueue(encoder.encode(parsed.delta.text));
                }
              } catch { }
            }
          }
        }
        controller.close();
      }
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });

  } catch (err: any) {
    console.error("suggest-reply error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}