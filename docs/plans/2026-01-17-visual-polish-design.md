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

## 7. Success Criteria

- [ ] Landing page entrance feels premium and intentional
- [ ] All interactive elements have satisfying feedback
- [ ] Globe bridge animation creates a "wow" moment
- [ ] UI has tangible depth (not flat)
- [ ] Consistent treatment across all components
- [ ] No janky animations (60fps throughout)
- [ ] Works on mobile viewport

---

**Document Status:** Approved by Melchizedek
**Next Step:** Implementation
