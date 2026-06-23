import { NextRequest, NextResponse } from "next/server";

export function scoreLead(quote: any) {
  let bookingScore = 0;
  let profitScore = 100;
  const bookingBreakdown: string[] = [];
  const profitBreakdown: string[] = [];
  let isComplex = false;

  // ── BOOKING SCORE ──────────────────────────────────────────────────────────

  // Urgency
  const notes = (quote.customer_notes || "").toLowerCase();
  const ai = (quote.ai_description || "").toLowerCase();
  if (notes.includes("today") || notes.includes("asap") || notes.includes("same day")) {
    bookingScore += 20;
    bookingBreakdown.push("+20 Same-day request");
  } else if (notes.includes("tomorrow") || notes.includes("next day")) {
    bookingScore += 15;
    bookingBreakdown.push("+15 Next-day request");
  }

  // Photos
  const photoCount = (quote.photo_urls || []).length;
  if (photoCount >= 3) {
    bookingScore += 15;
    bookingBreakdown.push(`+15 Multiple photos (${photoCount})`);
  } else if (photoCount >= 1) {
    bookingScore += 8;
    bookingBreakdown.push(`+8 Photos uploaded (${photoCount})`);
  }

  // Notes quality
  if (quote.customer_notes && quote.customer_notes.length > 30) {
    bookingScore += 10;
    bookingBreakdown.push("+10 Detailed notes");
  }

  // Complete info
  if (quote.customer_name && quote.customer_phone && quote.customer_email && quote.customer_address) {
    bookingScore += 10;
    bookingBreakdown.push("+10 Complete information");
  }

  // Job value
  const minPrice = quote.estimated_min || 0;
  if (minPrice >= 300) {
    bookingScore += 10;
    bookingBreakdown.push("+10 High value job ($300+)");
  } else if (minPrice >= 150) {
    bookingScore += 5;
    bookingBreakdown.push("+5 Medium value job");
  }

  // View engagement
  if ((quote.view_count || 0) >= 2) {
    bookingScore += 10;
    bookingBreakdown.push("+10 Quote viewed multiple times");
  }

  // Cap at 100
  bookingScore = Math.min(100, bookingScore);

  // ── PROFITABILITY SCORE ────────────────────────────────────────────────────

  // Time killers
  if (quote.location_type === "basement") {
    profitScore -= 20;
    profitBreakdown.push("-20 Basement access");
    isComplex = true;
  }
  if ((quote.stairs || 0) >= 2) {
    profitScore -= 15;
    profitBreakdown.push(`-15 Multiple stairs (${quote.stairs} flights)`);
    isComplex = true;
  } else if ((quote.stairs || 0) === 1) {
    profitScore -= 8;
    profitBreakdown.push("-8 One flight of stairs");
  }
  if (quote.distance === "long") {
    profitScore -= 10;
    profitBreakdown.push("-10 Long carry distance (150ft+)");
  }

  // Margin killers
  if (quote.condition === "hazard") {
    profitScore -= 25;
    profitBreakdown.push("-25 Hoarder/odor/hazard condition");
    isComplex = true;
  }
  if (minPrice < 150 && minPrice > 0) {
    profitScore -= 15;
    profitBreakdown.push("-15 Low value job (under minimum)");
  }

  // Risk killers
  if (photoCount === 0) {
    profitScore -= 20;
    profitBreakdown.push("-20 No photos submitted");
  } else if (photoCount === 1) {
    profitScore -= 10;
    profitBreakdown.push("-10 Only one photo");
  }
  if (!quote.customer_notes || quote.customer_notes.length < 10) {
    profitScore -= 10;
    profitBreakdown.push("-10 Missing notes");
  }

  // Complex extras
  if (quote.extras?.includes("heavy")) {
    if (quote.location_type === "basement" || (quote.stairs || 0) >= 1) {
      profitScore -= 10;
      profitBreakdown.push("-10 Heavy items + stairs (combined friction)");
      isComplex = true;
    }
  }

  // Cap between 0-100
  profitScore = Math.max(0, Math.min(100, profitScore));

  // ── TIER CLASSIFICATION ────────────────────────────────────────────────────
  let bookingTier: string;
  if (bookingScore >= 80) bookingTier = "hot";
  else if (bookingScore >= 50) bookingTier = "warm";
  else bookingTier = "standard";

  return {
    bookingScore,
    profitScore,
    isComplex,
    bookingTier,
    breakdown: {
      booking: bookingBreakdown,
      profit: profitBreakdown,
    },
  };
}

export async function POST(req: NextRequest) {
  try {
    const { quote } = await req.json();
    const result = scoreLead(quote);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}