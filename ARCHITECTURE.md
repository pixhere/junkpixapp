cat > ~/Documents/junkpix/ARCHITECTURE.md << 'EOF'
# JunkPix Architecture Rules

## Core Rule — Page vs Component
Before building ANYTHING, ask:
1. Does this use streaming AI? → own page at /dashboard/[feature]/page.tsx
2. Does this have heavy state updates? → own page
3. Does this need to scroll independently? → own page
4. Is this just display/navigation? → stays in dashboard component

NEVER build streaming features inside the main dashboard component.
ALWAYS ask before building: "does this need its own page?"

## Facebook-Style Navigation Pattern
Every feature gets its own page — like Facebook where every click goes deeper:

/dashboard                    → lightweight shell (Overview, Quotes, Calendar, Settings)
/dashboard/quote/[id]         → quote detail ✅ built
/dashboard/sales              → Sales Academy (streaming — needs own page)
/dashboard/social             → Social Media (streaming — needs own page)
/dashboard/analytics          → Analytics (data heavy — needs own page)
/quote/[id]                   → customer quote form
/status/[id]                  → customer status portal ✅ built

## Terminal Rules (Claude must follow)
- Always use python3 for file edits — NOT sed or echo for complex changes
- Verify with grep BEFORE making changes
- Check brace balance after edits: python3 -c "content=open('file').read(); print(opens-closes)"
- Always run npm run build after changes — never push without successful build
- Use git add -A && git commit && git push for deploys
- Deploy hook: curl -X POST https://api.vercel.com/v1/integrations/deploy/prj_UWJ1zbBqn2kXrJSbOzqJCoYbw5jR/EUmIlD0hHb

## Code Quality Rules
- Never duplicate component definitions
- Never have orphaned JSX closing tags
- Always check for duplicate state variables before adding new ones
- Remove dead code immediately when replacing features
- Triple check before any file edit — mistakes cost time

## Stack
- Next.js 16, Supabase, Resend, Anthropic Claude, Stripe
- Deploy: git push origin main → Vercel auto-deploy
- Repo: github.com/pixhere/junkpixapp
- Live: junkpix.com

## Key Files
- src/app/dashboard/page.tsx — main dashboard shell
- src/app/dashboard/quote/[id]/page.tsx — quote detail page
- src/app/quote/[id]/page.tsx — customer quote form
- src/app/status/[id]/page.tsx — customer status portal
- src/app/api/analyze/route.ts — AI photo analysis
- src/app/api/suggest-reply/route.ts — AI SMS replies (streaming)
- src/app/api/sales-coach/route.ts — Sales Academy (streaming)
- src/app/api/submit-quote/route.ts — quote insert via service role
- src/app/api/notify/route.ts — operator + customer emails
- src/app/api/webhook/fire/route.ts — native webhook firing

## Environment Variables
NEXT_PUBLIC_SUPABASE_URL=https://eqnymejoklhgghtjdewu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_OXnJhYBgrqbslTo33R3gmg_oBlcl-ws
SUPABASE_SERVICE_ROLE_KEY=[secret]
RESEND_API_KEY=re_E5jiDm24_2VnTTR2XJmxvCrAPvD2kiPPz
ANTHROPIC_API_KEY=[secret]
OWNER_EMAIL=junkpixapp@gmail.com
STRIPE_SECRET_KEY=[secret]
NEXT_PUBLIC_APP_URL=https://junkpix.com

## Features Built
- Photo-based AI quoting with heavy material detection
- Quote detail page (/dashboard/quote/[id])
- Customer status portal (/status/[id])
- Scheduling calendar
- AI suggested replies (15 sales masters — Cardone, Hormozi, Voss etc.)
- Sales Academy with streaming
- Social media generator
- Native webhooks (fires on quote.submitted, quote.booked etc.)
- Trial enforcement + Stripe billing
- Slug-based quote URLs (junkpix.com/quote/yourbusiness)
- Signup notifications
- Support tab in settings
- Dashboard auto-refresh every 30 seconds

## Pending Features (Priority Order)
1. Fix Sales/Social scroll glitch → move to own pages
2. Special items/demolition pricing
3. Multi-agent photo analysis (Material Detector, Volume Estimator, Labor Analyzer, Pricing Brain, Orchestrator, QA Validator)
4. N8N setup on Hetzner (waiting for account approval)
5. Tiered pricing presentation
6. Payment/deposit via Stripe Connect
7. Before/after photo documentation
8. Job cost tracking
9. Jobber integration
10. Social post appears below selected quote
11. Daily Intel auto-refresh (new content daily)
12. GHL → when 30+ operators
13. AI phone/missed call → needs Twilio LLC
14. Voice for Sales Academy → mobile app phase
15. Commercial B2B pipeline
16. QuickBooks integration
17. Crew mobile app
18. Multi-location support

## Competitor Intel
- QuickQuote AI (Austin Pate) — instant quotes, scheduling, customer mgmt, payments
- They target junk removal + moving + other services (generic)
- JunkPix differentiator: photo AI, built BY a junk removal operator, Sales Academy
- Jobber ($109/month) — JunkPix replaces it at lower cost

## Business Context
- Owner: George (Go To Junk Removal LLC, Harrisburg PA)
- Slug: gotojunkremoval
- Quote page: junkpix.com/quote/gotojunkremoval
- Pricing: Founding $49, Standard $99, Agency $149
- Trial: 30 days free
EOF