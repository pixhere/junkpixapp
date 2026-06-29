import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { images, operatorPrices } = body;

    if (!images || images.length === 0) {
      return NextResponse.json({ error: "No images provided" }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "Missing API key" }, { status: 500 });
    }

    // Use operator's custom prices or defaults
    const prices = {
      minimum: `${operatorPrices?.price_minimum_min || 150}-${operatorPrices?.price_minimum_max || 200}`,
      eighth:  `${operatorPrices?.price_eighth_min  || 200}-${operatorPrices?.price_eighth_max  || 275}`,
      quarter: `${operatorPrices?.price_quarter_min || 300}-${operatorPrices?.price_quarter_max || 400}`,
      half:    `${operatorPrices?.price_half_min    || 475}-${operatorPrices?.price_half_max    || 575}`,
      threeQ:  `${operatorPrices?.price_threeq_min  || 675}-${operatorPrices?.price_threeq_max  || 775}`,
      full:    `${operatorPrices?.price_full_min    || 875}-${operatorPrices?.price_full_max    || 975}`,
    };

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
        system: `You are a junk removal estimator. Analyze the photos and describe the job in plain English.

Describe what items or materials you can clearly see, approximate volume, any access concerns, and anything unusual.

Also decide the load tier and use THESE EXACT price ranges for this operator:
minimum: $${prices.minimum}
eighth load: $${prices.eighth}
quarter load: $${prices.quarter}
half load: $${prices.half}
three quarter load: $${prices.threeQ}
full load: $${prices.full}

SITE VISIT REQUIRED - DETECT THESE FIRST:
If you detect ANY of the following, set siteVisitRequired to true and DO NOT estimate a price:
- Mobile home, trailer home, manufactured home
- Full house or building demolition
- Large shed demolition (bigger than 12x12 ft)
- Swimming pool removal
- Large garage demolition
- Any job requiring heavy equipment (excavator, bobcat)
- Any structure that needs to be torn down

When siteVisitRequired is true:
- Set estimatedMin and estimatedMax to 0
- Set plainDescription to explain this needs a site visit and to call for a custom quote
- Set confidence to "low"

HEAVY MATERIAL DETECTION:
If you detect ANY of these materials, set heavyMaterialFlag to true and list them in heavyMaterials.
Apply these EXACT multipliers to your base load tier price:

CONSTRUCTION DEBRIS (2.5x multiplier):
- Mixed construction debris, drywall bags, plaster, sheetrock
- Ceramic tile, flooring materials
- HVAC equipment, ductwork, metal equipment
- Demolition debris (shed remains, deck boards, structural wood)
- Dirt, gravel, sand, soil

CONCRETE/MASONRY - SMALL AMOUNT (2x multiplier):
- 1-3 concrete blocks, bricks, single slabs, pavers
- Small concrete pieces, cinder blocks
- Single masonry items

CONCRETE/MASONRY - LARGE AMOUNT (3x multiplier):
- Large concrete slabs, multiple concrete pieces
- Entire concrete areas, foundations, retaining walls
- When concrete/masonry fills more than half the image
- Multiple heavy concrete items

YARD WASTE / BRUSH DETECTION:
ONLY set yardWasteFlag to true if yard waste is the PRIMARY item being removed:
- Large piles of tree branches or brush being hauled away
- Bags of leaves or grass clippings as the main job
- Stumps or large tree sections
- DO NOT flag if grass is just visible in the background of a photo
- DO NOT flag if there are only a few small branches mixed with regular junk
- The yard waste must be a significant portion of what needs to be hauled

TIRE DETECTION:
If you detect tires:
- Set tireFlag to true
- Car/SUV tires: add $25 per tire
- Truck tires (large): add $35 per tire
- Count visible tires and multiply accordingly

When heavyMaterialFlag is true:
- Apply the correct multiplier above to your estimated price
- Set confidence to low
- Note in plainDescription that heavy materials require custom pricing
- If BOTH construction debris AND concrete present, use the HIGHER multiplier

Return ONLY valid JSON with no markdown:
{
  "plainDescription": "description of what you see",
  "pricingMode": "itemized"|"loadtier",
  "loadTier": "minimum"|"eighth"|"quarter"|"half"|"threeQ"|"full",
  "estimatedMin": <number from the range above>,
  "estimatedMax": <number from the range above>,
  "confidence": "high"|"medium"|"low",
  "visibleHazardFlag": false,
  "siteVisitRequired": true|false,
  "heavyMaterialFlag": true|false,
  "yardWasteFlag": true|false,
  "tireFlag": true|false,
  "tireCount": <number of tires detected>,
  "heavyMaterials": ["list of heavy materials detected"]
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
        estimatedMin: operatorPrices?.price_quarter_min || 300,
        estimatedMax: operatorPrices?.price_quarter_max || 400,
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