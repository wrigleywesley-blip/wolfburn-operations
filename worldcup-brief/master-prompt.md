# Wolfburn × World Cup — Master Render Prompt

For use with Higgsfield, Midjourney, Krea, Nano Banana, or any image-gen tool that accepts a reference image. Always pass the actual bottle photograph as the visual source. The prompt below describes the room around the bottle, not the bottle itself.

---

## Master prompt (paste verbatim)

```
WOLFBURN × WORLD CUP — CINEMATIC PRODUCT RENDERS

OBJECTIVE
Ultra-premium cinematic product renders of the Wolfburn World Cup Edition bottle using the provided reference image as the exact source of truth. Intended for website hero, social feed, email campaign assets, paid social, OOH. Visual style: luxury spirit campaign with a quiet spark of celebration. Reference points: Macallan editorial, Hennessy Limited Editions, Dalmore King Alexander, Players' Tribune sport portraits. The bottle is the hero. Restraint over spectacle. The "occasion" comes from staging, not from gimmick. The label is already doing the celebrating; the scene's job is to be the room that label deserves.

PRODUCT ACCURACY (CRITICAL)
Use the provided product image as the exact source for: bottle shape and proportions, dark green glass tint, liquid colour, label design and layout including the colour ground (yellow / cream / blue), Wolfburn wordmark, wolf engraving, twin rampant lions, both national flags exactly as shown, the "AGED [N] YEARS" gold numeral, the "WORLD CUP EDITION WHISKY" type, the match line "SCOTLAND V [OPPONENT]", "DRAMS FOR THE TARTAN ARMY" tagline, the kick-off date and venue line, "PRODUCT OF SCOTLAND" script footer, gold foil neck wrap, charcoal cap, "HIGHLAND SINGLE MALT SCOTCH WHISKY" foil ribbon, 35cl, 46% vol, non-chill filtered, natural colour notes.

Do not alter branding. Do not redesign the label. Do not stylise typography. Do not add or remove flags. Maintain photorealistic accuracy. The bottle must look exactly like the reference.

SCENE DIRECTION
Editorial, atmospheric, considered. Deep shadows, soft directional light from upper-left, gentle rim light catching the foil and label edges. Minimal environment. The bottle should read as a museum-grade collectible commemorating a specific moment: Scotland v [OPPONENT], [DATE], [VENUE]. Mood register:
  — quiet authority, not party energy
  — "limited release" feel, not "merch"
  — a hint of occasion but never a costume
  — surface texture suggesting craft: weathered oak, dark leather, brushed brass, slate, a single thread of tartan in soft focus
  — never literal: no national costumes, no stereotypical opponent props, no beach umbrellas, no camels, no carnival, no flags except those already on the label
  — the bottle is the trophy

COMPOSITION & LIGHTING
Hero-friendly framing. Bottle centred or thirds-composed. Clean negative space at the top or one side for headline overlay (campaign uses "Mibbe aye, mibbe no" and "Fortune favours the brave"). Two-thirds of the frame should breathe. Lighting: low-key Rembrandt with a softbox kicker on the label so the colour ground (yellow / cream / blue) registers cleanly. Slight halation around the foil to suggest collectible glow. Liquid catches a small specular highlight at the shoulder. The cap reflects nothing literal.

ENVIRONMENT PALETTE (rotate by shoot)
  1. Weathered oak distillery counter, slate floor just out of focus, a single Glencairn glass with a finger of whisky beside the bottle, dimmed warm tungsten light.
  2. Dark green leather surface, brass desk lamp throwing the only light, a folded match programme partially visible, vintage library depth.
  3. Black slate ledge against a heather-grey limewash wall, single sprig of dried thistle out of focus, a thin band of late-afternoon sun.
  4. Deep navy velvet cloth bunched naturally, gold thread catching light, antique map of Caithness softly out of focus behind, Scottish edition feel.
  5. Distillery interior — copper still in deep background blur, the bottle on a worn wood barrel-head, warm amber atmosphere.

NEGATIVE PROMPT (what not to include)
  — No human hands, no full human figures
  — No football, no goal posts, no boots, no stadium imagery, no FIFA marks or competition crests
  — No competitor whisky brands, no tasting-notes overlays, no price tags, no QR codes
  — No national costumes or stereotypes of the opponent country
  — No party props: confetti, streamers, balloons, fireworks
  — No text overlay in the render itself (added in post)
  — No reflections of camera crew, lighting rigs, modern fixtures
  — No bright primary backdrops; the label colour is the only bright moment in frame
  — No glassware other than a single Glencairn or heavy crystal tumbler

OUTPUT
  — Aspect ratios per scene: 1:1 (IG feed), 4:5 (IG portrait + email hero), 9:16 (story / reel), 16:9 (desktop hero / YouTube)
  — Resolution: 2048px long edge minimum
  — Bottle occupies 35–55% of frame height; label fully legible at thumbnail
  — PNG, with a clean-background variant for compositing
```

---

## Per-bottle variants

### A · Scotland v Haiti — 10 Year Old, cream / ivory
- `[OPPONENT]` Haiti
- `[DATE]` Sunday 14 June 2026
- `[VENUE]` Foxborough, USA
- `[LABEL GROUND]` warm cream and gold
- `[STAGING NOTE]` lean into the warm cream. Pair with pale oak and antique brass. Opening-day register, optimism without bombast. Scene 1 or 3 from the palette work best.

### B · Scotland v Morocco — 8 Year Old, cobalt blue
- `[OPPONENT]` Morocco
- `[DATE]` Friday 19 June 2026
- `[VENUE]` Foxborough, USA
- `[LABEL GROUND]` cobalt blue with gold
- `[STAGING NOTE]` lean into the cobalt. Darker leather, slate, polished brass, dusk light. The second-match composure. Scene 2 or 4 from the palette work best.

### C · Scotland v Brazil — 12 Year Old, golden yellow
- `[OPPONENT]` Brazil
- `[DATE]` Wednesday 24 June 2026
- `[VENUE]` Miami, USA
- `[LABEL GROUND]` rich golden yellow with gold foil
- `[STAGING NOTE]` lean into the gold. Warm walnut, deep amber tungsten, a touch of summer warmth without leaving Scotland's tonal world. The all-in register. Scene 5 or a hybrid 1+5 works best.

---

## Quick shot list (recommended first deliveries)

For each SKU, generate this set:

| # | Scene | Aspect | Use |
|---|---|---|---|
| 1 | Hero on oak with Glencairn | 16:9 | Website hero, desktop |
| 2 | Hero on oak with Glencairn | 4:5 | Email + IG portrait |
| 3 | Slate ledge, thistle | 1:1 | IG feed |
| 4 | Velvet + map | 9:16 | Story / reel |
| 5 | Distillery interior | 16:9 | Brand film still / OOH |

That's 15 hero renders across the 3 SKUs. Plus 3 clean-background cut-outs (one per bottle) for compositing into ads.

---

## Editorial overlays (added in post, not in render)

Lock these strings before designers touch the renders:

- Campaign anchor: **Mibbe aye, mibbe no**
- Sign-off line: **Fortune favours the brave**
- Match line: **Scotland v [opponent] · [date] · [venue]**
- Edition stamp: **Limited Edition · World Cup 2026**
- Optional bottle-number stamp: **Bottle XXXX of YYYY**

---

## Notes for the operator

- **Always include the reference image.** Text-to-image alone will hallucinate the label every time. Use marketing_studio_image (Higgsfield), the reference-driven Seedream models, or Nano Banana Pro with image input. The reference image is non-negotiable.
- **One scene per generation.** Don't ask for multiple environments in one prompt. Generate scene 1, then scene 2, etc. You get better hit rates.
- **Run two variants per scene.** Generate `count: 2` and pick. Cost is ~25 credits each on Higgsfield.
- **Save the seed.** When you find a winner, save the seed value so you can re-roll the same scene with a different bottle for consistency across the SKUs.
- **Post-light in Photoshop / Capture One.** AI renders almost always need a curves pass and a sharpening pass before they meet luxury-spirits print standards. Allow a 30-min retouch per hero.
