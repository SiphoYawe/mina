# Mina Visual Polish & Wow Factor Design

**Date:** 2026-01-17
**Status:** Ready for Implementation
**Time Budget:** Half day (~4-5 hours)

---

## Overview

This design document outlines visual enhancements to elevate Mina's presentation for the Hyperliquid London Hackathon demo. The focus is on premium visual spectacle while maintaining a real, functional application (no fake demo modes).

---

## 1. Landing Page Hero

### Entrance Animation (1.5 seconds total)

```
Timeline:
0ms     - Background fades from #000000 to #09090B
200ms   - Mina logo scales 0.8 → 1.0 with subtle bounce easing
400ms   - Tagline slides up from below with opacity 0 → 1
600ms   - Accent glow pulses once behind logo (#7DD3FC at 20% opacity)
800ms   - Floating tokens begin appearing (staggered)
```

### Floating Token Icons

- **Tokens:** ETH, USDC, ARB, MATIC, SOL, OP (5-6 icons)
- **Movement:** Slow float animation (translateY ±10px over 4-6 seconds, randomized per token)
- **Parallax:** Subtle movement on mouse move (tokens shift 1-2% of mouse delta)
- **Depth:** Tokens further from center have slight blur (0.5-1px)
- **Opacity:** 40-60% to remain background elements

### Implementation Notes

- Use Framer Motion for entrance orchestration
- Floating tokens as absolutely positioned elements with CSS animations
- Parallax via `onMouseMove` updating CSS custom properties

---

## 2. Micro-Interactions

### Buttons

| State | Effect |
|-------|--------|
| Default | Embossed appearance (light top/left edge, dark bottom/right) |
| Hover | Scale 1.02x, glow border appears (#7DD3FC), shadow deepens |
| Active | Scale 0.98x, debossed appearance (inverted lighting), ripple from click point |
| Disabled | Subtle pulse animation (opacity 0.5 → 0.6 → 0.5) |

### Input Fields

| State | Effect |
|-------|--------|
| Default | Debossed (inset) appearance |
| Focus | Border transitions to accent blue, inner glow appears |
| Value Change | Number slides out (up), new number slides in (from below) |

### Cards & Panels

| Element | Effect |
|---------|--------|
| Card Hover | translateY -2px, shadow deepens (lift effect) |
| Settings Panel | Slides in from right with slight bounce at end (spring easing) |
| Quote Display | Staggered fade-in (each line 50ms delay) |

### Page Transitions

- **Route changes:** Crossfade with slight scale (0.98 → 1.0)
- **Modal open:** Backdrop blur-in (0 → 8px), modal scales 0.95 → 1.0
- **Modal close:** Reverse with faster timing (150ms vs 300ms open)

### Loading States

- Skeleton loaders with shimmer (gradient moves left → right, 1.5s loop)
- Spinners use accent color with opacity trail

---

## 3. Enhanced Globe Experience

### Chain Node Enhancements

```
Heartbeat Pulse:
- Scale: 1.0 → 1.05 → 1.0
- Duration: 2 seconds
- Easing: ease-in-out
- All nodes pulse, slightly offset timing for organic feel

Selected Source Node:
- Glow intensity increases 2x
- Pulse speed increases (1.2 seconds)
- Ring appears around node

Hyperliquid Destination Node:
- Distinct styling: golden/green ring (#0ECC83)
- Larger base size than other nodes
- "Destination" label visible
```

### Bridge Arc Enhancements

```
Progressive Draw:
- Arc draws itself over 2 seconds (not instant)
- Uses stroke-dasharray + stroke-dashoffset animation
- Feels like energy traveling along path

Particle Trail:
- 8-12 small dots streaming along arc path
- Particles follow arc with slight randomized offset
- Leading particles brighter, trailing ones fade
- Speed corresponds to bridge progress %

Arc Glow:
- Main arc: 2px stroke, #7DD3FC
- Glow layer beneath: 6px stroke, #7DD3FC at 30% opacity, blur 4px
- Leading edge glows stronger (opacity gradient along path)
```

### Success Moment (The Climax)

```
Timeline (triggered when bridge completes):
0ms     - Ripple explosion starts from Hyperliquid node
0ms     - Camera begins smooth zoom toward destination
200ms   - Particles burst outward in sphere pattern (20-30 particles)
400ms   - Node flashes bright white then settles to #0ECC83
600ms   - Ripple expands and fades
800ms   - Camera arrives at final position
1000ms  - Confetti triggers (existing implementation)
```

### Implementation Notes

- Use react-globe.gl's `arcsData` with custom arc rendering
- Particles can be implemented with `customLayerData` or HTML overlay
- Success animation triggered by SDK's `onStatusChange` callback

---

## 4. Skeuomorphic UI System

### Design Tokens

```css
/* Gradients */
--gradient-surface: linear-gradient(180deg, #151518 0%, #111113 100%);
--gradient-button: linear-gradient(180deg, #2a2a2e 0%, #1a1a1d 100%);
--gradient-border: linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%);

/* Shadows */
--shadow-emboss-light: inset 1px 1px 0 rgba(255,255,255,0.05);
--shadow-emboss-dark: inset -1px -1px 0 rgba(0,0,0,0.3);
--shadow-deboss: inset 0 2px 4px rgba(0,0,0,0.3);
--shadow-drop-sm: 0 2px 4px rgba(0,0,0,0.3);
--shadow-drop-md: 0 4px 12px rgba(0,0,0,0.4);
--shadow-drop-lg: 0 8px 24px rgba(0,0,0,0.5);

/* Effects */
--blur-frost: 12px;
--noise-opacity: 0.03;
```

### Card Treatment

```css
.card-skeuomorphic {
  /* Base */
  background: var(--gradient-surface);
  border-radius: 16px;

  /* Border with gradient */
  border: 1px solid transparent;
  background-clip: padding-box;
  position: relative;

  /* Pseudo-element for gradient border */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 16px;
    padding: 1px;
    background: var(--gradient-border);
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask-composite: exclude;
  }

  /* Emboss effect */
  box-shadow:
    var(--shadow-emboss-light),
    var(--shadow-emboss-dark),
    var(--shadow-drop-md);

  /* Frost */
  backdrop-filter: blur(var(--blur-frost));
}

/* Noise overlay - apply to ::after */
.card-skeuomorphic::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 16px;
  background-image: url('/noise.svg');
  opacity: var(--noise-opacity);
  pointer-events: none;
}
```

### Button Treatment

```css
.button-skeuomorphic {
  /* Base */
  background: var(--gradient-button);
  border-radius: 8px;

  /* Emboss (default raised state) */
  box-shadow:
    inset 1px 1px 0 rgba(255,255,255,0.08),
    inset -1px -1px 0 rgba(0,0,0,0.2),
    0 2px 4px rgba(0,0,0,0.3);

  /* Transition */
  transition: all 150ms ease;
}

.button-skeuomorphic:hover {
  transform: scale(1.02);
  box-shadow:
    inset 1px 1px 0 rgba(255,255,255,0.08),
    inset -1px -1px 0 rgba(0,0,0,0.2),
    0 4px 12px rgba(0,0,0,0.4),
    0 0 0 2px rgba(125, 211, 252, 0.3);
}

.button-skeuomorphic:active {
  transform: scale(0.98);
  /* Deboss (pressed state) */
  box-shadow:
    inset 0 2px 4px rgba(0,0,0,0.4),
    inset 1px 1px 0 rgba(0,0,0,0.2);
}
```

### Input Treatment

```css
.input-skeuomorphic {
  /* Debossed (inset) appearance */
  background: rgba(0,0,0,0.3);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 8px;

  box-shadow:
    inset 0 2px 4px rgba(0,0,0,0.3),
    inset 1px 1px 0 rgba(0,0,0,0.2);

  transition: all 150ms ease;
}

.input-skeuomorphic:focus {
  border-color: #7DD3FC;
  box-shadow:
    inset 0 2px 4px rgba(0,0,0,0.3),
    0 0 0 2px rgba(125, 211, 252, 0.2);
}
```

### Modal/Overlay Treatment

```css
.modal-skeuomorphic {
  background: var(--gradient-surface);
  border-radius: 20px;
  backdrop-filter: blur(16px);

  /* Stronger depth for modals */
  box-shadow:
    var(--shadow-emboss-light),
    var(--shadow-emboss-dark),
    var(--shadow-drop-lg);

  /* Border glow */
  border: 1px solid rgba(255,255,255,0.08);
}

.modal-backdrop {
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(8px);
}
```

### Noise Texture

Create `/public/noise.svg`:
```svg
<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
  <filter id="noise">
    <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/>
  </filter>
  <rect width="100%" height="100%" filter="url(#noise)" opacity="1"/>
</svg>
```

---

## 5. Implementation Priority

Given the half-day time budget, implement in this order:

| Priority | Feature | Time Est. | Impact |
|----------|---------|-----------|--------|
| 1 | Skeuomorphic UI tokens + Card component | 1 hour | High - transforms entire app feel |
| 2 | Button + Input treatments | 45 min | High - every interaction improves |
| 3 | Landing hero entrance + floating tokens | 1 hour | High - first impression |
| 4 | Enhanced globe (progressive arc + particles) | 1.5 hours | Very High - demo climax |
| 5 | Globe success explosion | 30 min | High - memorable moment |
| 6 | Micro-interactions (hover, transitions) | 1 hour | Medium - polish layer |

**Total estimated: ~6 hours**

If time is tight, prioritize 1-4 and skip 5-6.

---

## 6. Files to Modify

```
mina/apps/web/
├── app/
│   ├── globals.css              # Add skeuomorphic tokens
│   └── page.tsx                 # Landing hero entrance
├── components/
│   ├── ui/
│   │   ├── button.tsx           # Skeuomorphic button
│   │   ├── card.tsx             # Skeuomorphic card
│   │   ├── input.tsx            # Skeuomorphic input
│   │   └── dialog.tsx           # Modal treatment
│   ├── bridge/
│   │   ├── globe-visualization.tsx  # Enhanced globe
│   │   └── bridge-form.tsx      # Apply card treatment
│   └── landing/
│       ├── hero.tsx             # NEW: Hero section
│       └── floating-tokens.tsx  # NEW: Background tokens
├── public/
│   └── noise.svg                # NEW: Noise texture
└── lib/
    └── animations.ts            # NEW: Shared animation configs
```

---

## 7. Icon System Swap: Lucide → Hugeicons

### Rationale
Hugeicons offers a more distinctive, premium icon set that aligns better with the skeuomorphic direction. Lucide is overused in the React ecosystem - switching creates visual differentiation.

### Implementation

```bash
# Remove Lucide
pnpm remove lucide-react

# Add Hugeicons
pnpm add @hugeicons/react
```

### Icon Mapping

| Usage | Lucide | Hugeicons Equivalent |
|-------|--------|---------------------|
| Settings | `Settings` | `Settings02Icon` |
| Chevron | `ChevronDown` | `ArrowDown01Icon` |
| Check | `Check` | `Tick02Icon` |
| X/Close | `X` | `Cancel01Icon` |
| Copy | `Copy` | `Copy01Icon` |
| External Link | `ExternalLink` | `LinkSquare02Icon` |
| Wallet | `Wallet` | `Wallet02Icon` |
| Swap/Exchange | `ArrowLeftRight` | `Exchange01Icon` |
| Info | `Info` | `InformationCircleIcon` |
| Warning | `AlertTriangle` | `Alert02Icon` |
| Success | `CheckCircle` | `CheckmarkCircle02Icon` |
| Error | `XCircle` | `CancelCircleIcon` |
| Loading | `Loader2` | `Loading03Icon` |
| Share | `Share` | `Share01Icon` |
| Download | `Download` | `Download02Icon` |
| History | `History` | `Clock02Icon` |
| Globe | `Globe` | `Globe02Icon` |

### Files to Update

All files importing from `lucide-react`:
```
components/ui/button.tsx
components/bridge/settings-panel.tsx
components/bridge/chain-selector.tsx
components/bridge/token-selector.tsx
components/bridge/quote-display.tsx
components/bridge/execution-modal.tsx
components/wallet/connect-button.tsx
components/shared/share-receipt.tsx
(... scan codebase for all lucide imports)
```

---

## 8. Success Criteria

- [ ] Landing page entrance feels premium and intentional
- [ ] All interactive elements have satisfying feedback
- [ ] Globe bridge animation creates a "wow" moment
- [ ] UI has tangible depth (not flat)
- [ ] Consistent treatment across all components
- [ ] No janky animations (60fps throughout)
- [ ] Works on mobile viewport

---

---

## 9. Adversarial Design Critique & Fixes

### Critique Summary

**Overall Score: 4.2/10 - Functional but Forgettable**

The current UI is competent but generic. It looks like every other DeFi app built in the last 3 years. The following issues must be addressed:

---

### Issue #1: Typography - Death by Inter

**Problem:** Using Inter font like every other crypto app (Uniswap, Aave, OpenSea). Zero brand personality.

**Current:**
```css
--w3m-font-family: Inter, system-ui, -apple-system, sans-serif;
```

**Fix:** Replace with distinctive font pairing:
- **Display/Headers:** `Space Grotesk`, `Cabinet Grotesk`, `Satoshi`, or `GT Walsheim`
- **Body:** Keep a clean sans-serif but consider `DM Sans` or `Plus Jakarta Sans`
- **Monospace (numbers/addresses):** `JetBrains Mono` or `IBM Plex Mono`

**Implementation:**
```css
:root {
  --font-display: 'Satoshi', sans-serif;
  --font-body: 'DM Sans', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}

h1, h2, h3 { font-family: var(--font-display); }
body { font-family: var(--font-body); }
.font-mono, code, [data-address] { font-family: var(--font-mono); }
```

---

### Issue #2: Color - Cyan-on-Black is 2021

**Problem:** Light blue (#7DD3FC) on near-black (#09090B) is the exact palette of Vercel, Linear, Raycast. Derivative and cold.

**Current Palette Issues:**
- No warmth or energy
- No secondary accent
- Single gradient direction
- No color story

**Fix:** Add warm secondary accent and richer gradients:

```css
:root {
  /* Keep primary cyan but add warmth */
  --accent-primary: #7DD3FC;

  /* NEW: Warm secondary for success/celebration */
  --accent-warm: #F59E0B;      /* Amber gold */
  --accent-success: #10B981;   /* Warmer green than current */

  /* NEW: Gradient pairs */
  --gradient-hero: linear-gradient(135deg, #7DD3FC 0%, #0EA5E9 50%, #6366F1 100%);
  --gradient-success: linear-gradient(135deg, #10B981 0%, #F59E0B 100%);
  --gradient-card: linear-gradient(180deg, rgba(125, 211, 252, 0.05) 0%, transparent 50%);
}
```

---

### Issue #3: Spacing - Inconsistent and Cramped

**Problem:** Chaotic spacing system - `space-y-2`, `space-y-3`, `space-y-4`, `gap-4`, `gap-6` with no logic.

**Current Offenders:**
- Arrow divider is tiny (48px) - should be a statement piece
- Mobile hero gets minimal padding (py-8)
- Form feels like a wall of inputs

**Fix:** Establish consistent spacing scale and generous whitespace:

```css
/* Spacing scale - use consistently */
--space-xs: 4px;
--space-sm: 8px;
--space-md: 16px;
--space-lg: 24px;
--space-xl: 32px;
--space-2xl: 48px;
--space-3xl: 64px;

/* Component-specific */
--card-padding: var(--space-xl);      /* 32px, was 24px */
--section-gap: var(--space-lg);       /* 24px consistent */
--form-gap: var(--space-md);          /* 16px between inputs */
```

**Arrow Divider Fix:**
```tsx
// BEFORE: tiny 48px circle
<div className="w-12 h-12">

// AFTER: statement piece 80px with animation
<div className="w-20 h-20 md:w-24 md:h-24">
```

---

### Issue #4: Contrast & Legibility - Muted is TOO Muted

**Problem:** Caption text is nearly invisible. Labels disappear.

**Current:**
```css
--text-muted: #71717A;     /* 4.5:1 - barely passes WCAG AA */
--text-secondary: #A1A1AA;
```

**Fix:** Bump muted colors for better legibility:

```css
--text-muted: #8B8B94;     /* Lighter - 5.5:1 contrast */
--text-secondary: #B4B4BC; /* Lighter - better readability */

/* For truly de-emphasized text, use opacity instead */
.text-subtle {
  color: var(--text-primary);
  opacity: 0.5;
}
```

---

### Issue #5: Visual Hierarchy - Everything is Equal

**Problem:** No clear focal point. Chain selector, amount input, and button all compete equally.

**Fix:** Create clear size differentiation:

**Amount Input - Make it HUGE:**
```tsx
// BEFORE: same size as other inputs
<Input className="flex-1" />

// AFTER: hero-sized amount input
<Input
  className="flex-1 text-3xl md:text-4xl font-semibold h-16 md:h-20"
  placeholder="0.00"
/>
```

**Section Labels - Make them anchor:**
```tsx
// BEFORE: timid labels
<label className="text-small text-text-secondary">From</label>

// AFTER: bold anchors
<label className="text-xs uppercase tracking-wider font-semibold text-text-muted">From</label>
```

**Bridge Button - Command attention:**
```tsx
// Add larger size, stronger shadow
<Button
  className="w-full h-14 text-lg font-semibold shadow-xl shadow-accent-primary/25"
  size="lg"
>
```

---

### Issue #6: Layout - Predictable and Boring

**Problem:** Everything centered, symmetrical, expected. Zero visual tension.

**Fix Options:**

**Option A: Asymmetric Hero**
- Offset the card slightly left
- Add decorative element bleeding off right edge
- Globe visualization peeks from corner

**Option B: Split Layout (Desktop)**
- Left: Branding/explanation
- Right: Bridge form
- Creates natural reading flow

**Option C: Overlapping Elements**
- Recent transactions card overlaps main card edge
- Creates depth and visual interest

---

### Issue #7: Depth & Dimension - Flat with Fake Depth

**Problem:** Shadows too subtle to read. Everything on same plane.

**Fix:** Aggressive, visible shadows:

```css
/* BEFORE: barely visible */
box-shadow: 0 2px 4px rgba(0,0,0,0.3);

/* AFTER: dramatic depth */
--shadow-card:
  0 4px 6px -1px rgba(0, 0, 0, 0.3),
  0 10px 20px -5px rgba(0, 0, 0, 0.4),
  0 25px 50px -12px rgba(0, 0, 0, 0.5);

--shadow-elevated:
  0 20px 40px -15px rgba(0, 0, 0, 0.5),
  0 0 0 1px rgba(255, 255, 255, 0.05);

--shadow-button:
  0 4px 14px rgba(125, 211, 252, 0.3),
  inset 0 1px 0 rgba(255, 255, 255, 0.1);
```

---

### Issue #8: Motion - Present but Predictable

**Problem:** Every element does same `opacity + translateY`. No personality.

**Fix:** Varied, characterful animations:

```tsx
// BEFORE: same animation for everything
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}

// AFTER: varied animations with spring physics
// Hero title - dramatic entrance
initial={{ opacity: 0, y: 40, scale: 0.95 }}
animate={{ opacity: 1, y: 0, scale: 1 }}
transition={{ type: "spring", stiffness: 100, damping: 15 }}

// Subtitle - slide from different direction
initial={{ opacity: 0, x: -20 }}
animate={{ opacity: 1, x: 0 }}

// Card - scale up with bounce
initial={{ opacity: 0, scale: 0.9 }}
animate={{ opacity: 1, scale: 1 }}
transition={{ type: "spring", bounce: 0.3 }}

// Staggered children with rhythm
staggerChildren: 0.08
```

**Button Hover - More satisfying:**
```css
.button:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 8px 25px rgba(125, 211, 252, 0.4);
}

.button:active {
  transform: translateY(1px) scale(0.98);
}
```

---

### Issue #9: Design Joy - Zero Delight

**Problem:** No personality, no fun, feels like a utility not an experience.

**Fix Opportunities:**

**Copy/Microcopy:**
```tsx
// BEFORE: clinical
"Bridge Assets"
"Bridging from Arbitrum to HyperEVM"

// AFTER: personality
"Send it to Hyperliquid"
"Launching from Arbitrum → Landing on HyperEVM"
"Ready for liftoff 🚀" (success state)
```

**Visual Metaphor:**
- Mina = crossing/bridging = journey
- Add subtle path/trajectory visual
- Success = arrival/landing celebration

**Unexpected Moments:**
- Easter egg on 10th bridge
- Subtle particle effect on hover over bridge button
- Sound effect option for success (toggleable)

---

### Issue #10: Specific Component Failures

**DestinationChainDisplay - Too Small:**
```tsx
// BEFORE: tiny 20px circle
<div className="w-5 h-5 rounded-full">
  <span className="text-[10px]">H</span>
</div>

// AFTER: proper size with better styling
<div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-success to-accent-warm flex items-center justify-center ring-2 ring-accent-success/30">
  <span className="text-sm font-bold text-bg-base">H</span>
</div>
```

**Arrow Divider - Needs to be Statement Piece:**
```tsx
// BEFORE: small, static
<div className="w-12 h-12 rounded-full">
  <ArrowRight className="w-6 h-6" />
</div>

// AFTER: large, animated, attention-grabbing
<motion.div
  className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-accent-primary via-accent-muted to-accent-primary/50 flex items-center justify-center shadow-xl shadow-accent-primary/20"
  animate={{
    boxShadow: [
      "0 0 20px rgba(125, 211, 252, 0.2)",
      "0 0 40px rgba(125, 211, 252, 0.4)",
      "0 0 20px rgba(125, 211, 252, 0.2)"
    ]
  }}
  transition={{ duration: 2, repeat: Infinity }}
>
  <ArrowRight className="w-8 h-8 md:w-10 md:h-10 text-white" />
</motion.div>
```

**Quote Display - Don't Hide the Good Stuff:**
- Show fee breakdown by default (collapsed on mobile only)
- Make output amount the hero number (larger font)
- Add mini sparkline for price trend if available

---

### Priority Fix Order

| Priority | Fix | Impact | Effort |
|----------|-----|--------|--------|
| 1 | Amount input size increase | High | Low |
| 2 | Arrow divider enlargement + animation | High | Low |
| 3 | Shadow depth increase | High | Low |
| 4 | Muted text contrast fix | High | Low |
| 5 | Font change | Very High | Medium |
| 6 | Warm accent color addition | Medium | Low |
| 7 | Button hover enhancement | Medium | Low |
| 8 | Spacing consistency | Medium | Medium |
| 9 | Motion variety | Medium | Medium |
| 10 | Microcopy personality | Medium | Low |

---

### Final Checklist Before Demo

- [ ] Font is NOT Inter
- [ ] Amount input is visually dominant
- [ ] Arrow divider is 80px+ and animated
- [ ] Shadows are visible and create depth
- [ ] Muted text is readable
- [ ] At least one warm accent color exists
- [ ] Button hover feels satisfying
- [ ] Something unexpected delights the user

---

**Document Status:** Approved by Melchizedek
**Next Step:** Implementation
