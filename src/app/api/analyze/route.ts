import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { images, operatorPrices, specialItemsConfig } = body;

    const specialItemsList = specialItemsConfig && specialItemsConfig.length > 0
      ? specialItemsConfig.map((item: any) => `- ${item.label}: add $${item.price_impact}`).join("\n")
      : "- No special items configured for this operator. Do not flag any special items.";

    // Real operator costs
    const dumpRegular      = operatorPrices?.dump_fee_per_ton || 113.49;
    const dumpConstruction = operatorPrices?.dump_fee_construction || 106.00;
    const dumpMinimum      = operatorPrices?.dump_fee_minimum || 40.00;
    const milesToDump      = operatorPrices?.dump_miles_to_site || 5;
    const laborRate        = operatorPrices?.labor_rate_per_hour || 20;
    const crewSize         = operatorPrices?.crew_size || 2;
    const fuelPerMile      = operatorPrices?.fuel_cost_per_mile || 0.67;
    const marginMultiplier = (operatorPrices?.margin_percent || 300) / 100;

    // Calculate real costs per load size
    const fuelCost = milesToDump * 2 * fuelPerMile;
    const laborPerHour = crewSize * laborRate;

    // Load estimates (tons per load size)
    const loadCosts = {
      minimum: Math.max(dumpMinimum, 0.3 * dumpRegular) + (laborPerHour * 0.5) + fuelCost,
      eighth:  Math.max(dumpMinimum, 0.5 * dumpRegular) + (laborPerHour * 0.75) + fuelCost,
      quarter: (0.75 * dumpRegular) + (laborPerHour * 1) + fuelCost,
      half:    (1.25 * dumpRegular) + (laborPerHour * 1.5) + fuelCost,
      threeQ:  (1.75 * dumpRegular) + (laborPerHour * 2) + fuelCost,
      full:    (2.25 * dumpRegular) + (laborPerHour * 2.5) + fuelCost,
    };

    if (!images || images.length === 0) {
      return NextResponse.json({ error: "No images provided" }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "Missing API key" }, { status: 500 });
    }

    // Use operator's custom prices or defaults
    // Use operator custom prices if set, otherwise use real cost calculation
    const prices = {
      minimum: operatorPrices?.price_minimum_min ? `${operatorPrices.price_minimum_min}-${operatorPrices.price_minimum_max}` : `${Math.round(loadCosts.minimum * marginMultiplier)}-${Math.round(loadCosts.minimum * marginMultiplier * 1.15)}`,
      eighth:  operatorPrices?.price_eighth_min  ? `${operatorPrices.price_eighth_min}-${operatorPrices.price_eighth_max}`   : `${Math.round(loadCosts.eighth  * marginMultiplier)}-${Math.round(loadCosts.eighth  * marginMultiplier * 1.15)}`,
      quarter: operatorPrices?.price_quarter_min ? `${operatorPrices.price_quarter_min}-${operatorPrices.price_quarter_max}` : `${Math.round(loadCosts.quarter * marginMultiplier)}-${Math.round(loadCosts.quarter * marginMultiplier * 1.15)}`,
      half:    operatorPrices?.price_half_min    ? `${operatorPrices.price_half_min}-${operatorPrices.price_half_max}`       : `${Math.round(loadCosts.half    * marginMultiplier)}-${Math.round(loadCosts.half    * marginMultiplier * 1.15)}`,
      threeQ:  operatorPrices?.price_threeq_min  ? `${operatorPrices.price_threeq_min}-${operatorPrices.price_threeq_max}`   : `${Math.round(loadCosts.threeQ  * marginMultiplier)}-${Math.round(loadCosts.threeQ  * marginMultiplier * 1.15)}`,
      full:    operatorPrices?.price_full_min    ? `${operatorPrices.price_full_min}-${operatorPrices.price_full_max}`       : `${Math.round(loadCosts.full    * marginMultiplier)}-${Math.round(loadCosts.full    * marginMultiplier * 1.15)}`,
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
        max_tokens: 2000,
        system: `You are PixBrain — the world's most accurate junk removal estimator. Think like a 15-year veteran operator who never leaves money on the table but never overcharges.

Analyze ALL provided photos carefully. Be specific and honest. Never invent items you cannot see.

Use THESE EXACT price ranges for this operator:
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

SPECIAL ITEMS DETECTION:
This operator has set up the following special items with their own custom fees. If you detect ANY of these items in the photos, set specialItemsFlag to true and list them in specialItems with their exact fee:
${specialItemsList}
List each detected special item with its name and fee in specialItems array.
Add up ALL special item fees and include the total in specialItemsTotal.

When heavyMaterialFlag is true:
- Apply the correct multiplier above to your estimated price
- Set confidence to low
- Note in plainDescription that heavy materials require custom pricing
- If BOTH construction debris AND concrete present, use the HIGHER multiplier

Return ONLY valid JSON with no markdown:
{
  "plainDescription": "2-3 sentence plain English summary of the job",
  "jobType": "Garage Cleanout|Basement Cleanout|Estate Cleanout|Backyard Cleanup|Construction Debris|Furniture Removal|Appliance Removal|Mixed Debris|Other",
  "itemList": [{ "name": "item name", "quantity": 1, "estimatedWeightLbs": 50 }],
  "volumeCubicYards": 3.5,
  "truckLoadPercent": 45,
  "pricingMode": "itemized|loadtier",
  "loadTier": "minimum|eighth|quarter|half|threeQ|full",
  "estimatedMin": <number>,
  "estimatedMax": <number>,
  "confidence": "high|medium|low",
  "confidenceScore": 85,
  "difficultyFactors": {
    "stairs": false,
    "narrowAccess": false,
    "heavyItems": false,
    "disassemblyRequired": false,
    "longCarry": false,
    "hazardousMaterials": false
  },
  "disposalCategory": "standard|construction|heavyMaterial|ewaste|mixed",
  "recommendedCrew": 2,
  "estimatedHours": 2.5,
  "riskFlag": false,
  "riskReason": "",
  "upsellSuggestions": [{ "item": "upsell item", "addOnPrice": 50, "reason": "why" }],
  "visibleHazardFlag": false,
  "siteVisitRequired": false,
  "heavyMaterialFlag": false,
  "yardWasteFlag": false,
  "tireFlag": false,
  "tireCount": 0,
  "heavyMaterials": [],
  "bookingScore": 75,
  "suggestedCustomerMessage": "Hi [name], I reviewed your photos. [description]. I can have a [X]-person crew there for $[price]. Does [day] or [day] work best?"
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
        jobType: "Mixed Debris",
        itemList: [],
        volumeCubicYards: 0,
        truckLoadPercent: 0,
        pricingMode: "loadtier",
        loadTier: "quarter",
        estimatedMin: operatorPrices?.price_quarter_min || 300,
        estimatedMax: operatorPrices?.price_quarter_max || 400,
        confidence: "low",
        confidenceScore: 0,
        difficultyFactors: { stairs: false, narrowAccess: false, heavyItems: false, disassemblyRequired: false, longCarry: false, hazardousMaterials: false },
        disposalCategory: "standard",
        recommendedCrew: 2,
        estimatedHours: 2,
        riskFlag: false,
        riskReason: "",
        upsellSuggestions: [],
        visibleHazardFlag: false,
        siteVisitRequired: false,
        heavyMaterialFlag: false,
        yardWasteFlag: false,
        tireFlag: false,
        tireCount: 0,
        heavyMaterials: [],
        bookingScore: 50,
        suggestedCustomerMessage: ""
      };
    }

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Analyze route error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}