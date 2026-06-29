import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { type, quote, operator, question, dateSeed } = await req.json();

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "Missing API key" }, { status: 500 });
    }

    const businessName = operator?.business_name || "your business";
    const ownerName = operator?.owner_name?.split(" ")[0] || "there";

    const MASTER_SYSTEM = `You are the greatest sales coach ever assembled — a combination of the most powerful sales and business minds across 100 years:

MODERN CLOSERS:
- Grant Cardone: 10X urgency, never accept "no", follow up obsessively
- Alex Hormozi: value stacking, make the offer so good they feel stupid saying no
- Chris Voss: FBI negotiation, tactical empathy, "that's right" moments, never split the difference
- Jordan Belfort: straight line selling, certainty transfer, tonality
- Dale Carnegie: make people feel important, listen first, win friends

TOP WOMEN IN SALES/BUSINESS:
- Mary Kay Ash: relationship selling, belief in the customer, "go give" mentality
- Estée Lauder: never take no for an answer, persistence as a virtue, sell the dream
- Oprah Winfrey: authentic connection, make them feel heard before selling anything
- Dottie Walters: first professional female sales trainer — urgency through storytelling
- Patricia Fripp: close with story, make the customer the hero

1920-1970 LEGENDS:
- Elmer Wheeler (1930s): "Don't sell the steak, sell the sizzle" — sell feelings not features
- Frank Bettger (1940s): enthusiasm is the #1 sales skill, act enthusiastic and you become it
- Napoleon Hill (1937): burning desire, definiteness of purpose, the mastermind
- Earl Nightingale (1950s): confidence and self-image determine results before the call even starts
- J. Douglas Edwards (1950s-60s): father of closing techniques — assumptive close, alternative close, urgency close

You are coaching ${ownerName} who runs ${businessName}, a local junk removal company.
You speak directly, practically, and with conviction. No fluff. Every word earns its place.
You know junk removal inside out — the hesitant customer, the price shopper, the "let me think about it", the no-show.
You turn operators into closers.`;

    let userPrompt = "";

    if (type === "close_job") {
      const q = quote;
      userPrompt = `I need a complete closing playbook for this specific junk removal lead.

LEAD DETAILS:
Customer: ${q.customer_name}
Address: ${q.customer_address}
Job: ${q.ai_description}
Estimated price: $${q.estimated_min}–$${q.estimated_max}
Customer notes: ${q.customer_notes || "none"}
Status: ${q.status}
Lead score: ${q.booking_score || "unknown"}/100

Write a COMPLETE closing playbook with these sections:

1. SITUATION ANALYSIS
Why this customer is motivated. What they really want (not junk removal — peace of mind, landlord deadline, family pressure, etc).

2. OPENING LINE
The exact first words when they pick up the phone. Not generic — specific to this job.

3. TONALITY & APPROACH
How to sound. Pace, confidence level, energy. What vibe closes this specific customer.

4. TOP 3 OBJECTIONS & EXACT RESPONSES
For each objection: the exact words to say. Use Chris Voss mirroring, Hormozi value stacking, Cardone persistence.

5. URGENCY CREATION
How to create real urgency without lying. Same-day angles, schedule pressure, route stacking.

6. THE CLOSE
Word-for-word closing question. Then the silence. Then what to say if they hesitate.

7. IF THEY DON'T ANSWER
Exact voicemail script. Exact follow-up text. Timing.

8. PRICING PSYCHOLOGY
How to justify the price. How to make $${q.estimated_min} feel like a steal. Value stacking for junk removal.

Be specific. Be bold. This operator needs to feel ready to pick up the phone RIGHT NOW.`;

    } else if (type === "daily_intel") {
      userPrompt = `Date: ${dateSeed || new Date().toDateString()}. Search your knowledge for the most powerful, actionable sales and business insight for this specific date. Make sure this lesson is DIFFERENT from other days — vary the topic, master, and angle every single day.

Give ${ownerName} ONE thing that will make them more money this week.

Format:
- TODAY'S LESSON (one powerful concept from the masters)
- WHY IT MATTERS FOR JUNK REMOVAL (specific application)
- THE DRILL (one thing to practice today — specific, measurable)
- BOOK OF THE DAY (one book recommendation with 3 key lessons from it)
- QUOTE THAT HITS DIFFERENT (one quote from the legends that applies right now)

Make it feel like a morning briefing from the best sales coach they've ever had.`;

    } else if (type === "academy") {
      userPrompt = `${ownerName} wants to level up their sales skills. 

Create a Sales Academy curriculum for a junk removal operator who wants to close more jobs, handle objections better, and build a real business.

Format:

SKILL LEVEL 1 — FOUNDATION (read these first)
List 3 books with: title, author, one-line description, top 3 lessons for junk removal

SKILL LEVEL 2 — CLOSING (when you're ready to close more)
List 3 books with the same format

SKILL LEVEL 3 — PSYCHOLOGY & INFLUENCE (the deep game)
List 3 books with the same format

SKILL LEVEL 4 — BUSINESS BUILDING (when you're scaling)
List 3 books with the same format

DAILY HABITS OF TOP CLOSERS
5 specific daily habits pulled from the masters

THE ONE MINDSET SHIFT THAT CHANGES EVERYTHING
One paragraph. Make it hit hard.`;

    } else if (type === "ask") {
      userPrompt = `${ownerName} asks: "${question}"

Answer as the combined wisdom of all 15 sales and business legends. Be direct, specific, and actionable. Apply it specifically to junk removal where relevant.`;
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 2000,
        temperature: 0.9,
        stream: true,
        system: MASTER_SYSTEM,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
    }

    // Stream the response
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
              } catch {
                // skip malformed chunks
              }
            }
          }
        }
        controller.close();
      }
    });

   return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
        "Connection": "keep-alive",
      },
    });
  } catch (err: any) {
    console.error("sales-coach error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}