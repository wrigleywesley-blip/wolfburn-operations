# Wolfburn Operations — Dashboard Mockup v1

**Built:** 2026-05-08
**By:** Divergence
**For:** Wolfburn Distillery account
**Status:** v1 mockup, ready for review and iteration

## What this is

A turnkey agency operations dashboard concept. One screen, one source of truth for the entire Wolfburn account: agents, channels, performance, brand context, decisions.

The design is deliberately pulled from the Acreage system (dark hero surface, Space Grotesk + JetBrains Mono + Inter, editorial numbering) and re-coloured to Wolfburn's palette (charcoal, copper, amber, cream).

## Files

```
/Users/wesley/Desktop/Wolfburn_Operations/
├── README.md                     this file
├── index.html                    interactive mockup, view in Chrome at 1440px+ width
└── wolfburn-operations.pdf       paginated render for sharing
```

## What's in the dashboard

### 01 · Atlas (Orchestrator)
The voice + text co-pilot. Always-on hero panel showing:
- Listening state with pulsing dot
- Latest brief synthesised from all 16 agents
- "Talk to Atlas" voice activation button
- ⌥+Space global shortcut

Atlas is the single point of contact. You speak to it. It dispatches briefs to the specialist agents, then consolidates outputs and reports back.

### 02 · Agent Fleet (16 agents · 4 clusters)

**Content** (copper)
- Scribe — long-form blog & editorial
- Quill — copy & ad creative
- Composer — social posts
- Voice — brand guideline QA

**Commerce** (amber)
- Forge — Shopify, theme, Shogun
- Cellarman — inventory
- Ledger — orders & refunds
- Reviews — Trustpilot & Judge.me

**Marketing** (cream)
- Crucible — Meta Ads
- Anvil — Google & YouTube
- Strategist — campaign planning
- Audience — segments & lookalikes

**Analytics** (blue)
- Lighthouse — GA4 + Shopify
- Hawk — competitive & SERP

**Ops** (green)
- Auditor — site health, CLS, SEO
- Sentinel — uptime, pixel, JS budget

Each agent card shows: cluster, health dot, last run count (24h), success rate.

### 03 · Workflow flowchart
Five lanes left-to-right:
**Triggers → Atlas → Specialists → Channels → Lighthouse (report) → back to Atlas**

The feedback loop is what makes Atlas smarter every day.

### 04 · Performance
- 30-day revenue chart with 7-day moving average
- Channel mix donut (Direct / Meta / Google / Email / Organic)

### 05 · Brand context
- Wolfburn palette + typography
- Hero products (12yo, 10yo, Northland, Pentland)
- Quick links to all the surfaces (Shopify, Privy, GA4, Meta, etc.)

### Live ops feed (right column, always visible)
Streaming log of what every agent just did. Right now it shows the actual recent wins: GA4 fix, Privy sticky tab disabled, Crucible spend scaled, Quill drafted Father's Day variants, etc.

### Open decisions panel
Three current blockers, prioritised, with the human or system that owns each.

## Design system

| Token | Value |
|---|---|
| Background | `#0F0B08` (Wolfburn charcoal) |
| Card surface | `#14100C` / `#1A1410` |
| Hairline | `#2A2118` |
| Accent · primary | `#B5894C` (copper) |
| Accent · bright | `#D9A551` (amber) |
| Foreground | `#F5EDE0` (cream) |
| Muted | `#9A8470` |
| Status · ok | `#7EA67B` |
| Status · warn | `#D9A551` |
| Status · error | `#C26B5C` |
| Status · info | `#6A8AA6` |

Type stack:
- **Display**: Playfair Display (editorial) + Space Grotesk (UI display)
- **Body**: Inter
- **Mono**: JetBrains Mono (timestamps, labels, technical chrome)

## What this is NOT (yet)

This is a static visual mockup. The agents, voice button, charts, and conversational state are all illustrative. The data points reflect believable Wolfburn-scale numbers. None of it is wired to real APIs yet.

## What v2 should answer

1. **Connections.** Which of these 16 agents do we actually need on day one? Which are aspirational?
2. **Atlas voice.** Browser TTS + Whisper, ElevenLabs, or OpenAI Realtime? Wake word? Push-to-talk?
3. **Source of truth.** Shopify Admin API + GA4 + Meta Marketing API + Klaviyo. Where does the data live (Postgres? warehouse? straight to dashboard)?
4. **Auth & access.** Just Wesley, or Wolfburn's team too? Read-only client view?
5. **Hosting.** Vercel + Next.js? Self-hosted? Internal only or whitelabel-ready for other clients?
6. **Other accounts.** This is a Wolfburn skin. Master Eggs, GridAsset, LR, Soul Guide, Acreage, DoggyFontein — all want their own version. Multi-tenant from the start, or per-client builds?

## Iterations to expect

- Wire up real Shopify revenue + orders (live)
- Wire up real GA4 traffic (live)
- Replace the illustrative agents with actual prompts + scheduled runs
- Build Atlas as a real voice agent (OpenAI Realtime or similar)
- Add agent detail pages (click an agent → see its full run history)
- Add a workflow editor (drag & drop the flow shown in section 03)

---

Open `index.html` in Chrome at full width (1440px+). The PDF is for sharing the concept.
