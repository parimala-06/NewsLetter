---
name: The AI Briefing
description: A warm, flat, paper-toned editorial news digest with one terracotta accent and a near-black ink band.
colors:
  paper: "#f6f1e7"
  sage-panel: "#eaeee2"
  ink: "#201d16"
  card-paper: "#fffdf9"
  terracotta: "#c1602f"
  terracotta-deep: "#a54f26"
  olive: "#4a5c3a"
  dark-bg: "#17150f"
  dark-card: "#201e17"
  dark-terracotta: "#e07a44"
  dark-olive: "#90a878"
typography:
  display:
    fontFamily: "Newsreader, Georgia, serif"
    fontWeight: 600
  body:
    fontFamily: "Work Sans, ui-sans-serif, system-ui, sans-serif"
    fontWeight: 400
    fontSize: "0.9rem"
  label:
    fontFamily: "Work Sans, ui-sans-serif, system-ui, sans-serif"
    fontWeight: 700
    fontSize: "0.65rem"
    letterSpacing: "0.06em"
  mono:
    fontFamily: "JetBrains Mono, monospace"
rounded:
  pill: "999px"
  card: "14px"
components:
  button-accent:
    backgroundColor: "{colors.terracotta}"
    textColor: "#fdf6ee"
    rounded: "{rounded.pill}"
    padding: "0.7rem 1.4rem"
  button-accent-hover:
    backgroundColor: "{colors.terracotta-deep}"
  card:
    backgroundColor: "{colors.card-paper}"
    rounded: "{rounded.card}"
---

# Design System: The AI Briefing

## Overview

**Creative North Star: "The Paper Newsroom"**

A warm cream, sage and ink editorial system. Surfaces are flat and matte: no gradients, no glow. The one strong contrast move is a full-bleed near-black ink band for the hero and page titles. A single terracotta accent carries action. Newsreader serif headlines sit against Work Sans UI text.

Both themes are token-driven (`data-theme` on `<html>`); components never branch on theme.

**Key Characteristics:**
- Flat, matte, paper-toned surfaces with hairline borders.
- One terracotta accent for action; olive for active filters and the theme knob.
- Pill-shaped buttons and tags; softly rounded cards.
- Motion so far is minimal: 150-200ms ease on colour, border and small translateY lifts.

## Colors

Warm paper neutrals with a terracotta accent and olive/sage support; dark mode swaps to warm near-black with brightened accents.

### Primary
- **Terracotta** (#c1602f, dark #e07a44): buttons, active-nav underline, focus ring, selection.

### Secondary
- **Olive** (#4a5c3a, dark #90a878): active tag pills and the theme-toggle knob.

### Neutral
- **Paper** (#f6f1e7, dark #17150f): page background.
- **Card Paper** (#fffdf9, dark #201e17): cards.
- **Ink** (#201d16): text and the hero band.
- **Category palette** (`--cat-1..6`): flat fills for category pills.

### Named Rules
**The One Accent Rule.** Terracotta is the only action colour; olive marks selection state, never calls to action.

## Typography

**Display Font:** Newsreader (Georgia, serif)
**Body Font:** Work Sans
**Label/Mono Font:** JetBrains Mono (mono)

**Character:** Editorial serif headlines with a clean, functional grotesque for UI.

### Hierarchy
- **Display** (600, Newsreader): hero and story headlines.
- **Body** (400-500, 0.9rem Work Sans): summaries and UI.
- **Label** (700, 0.65rem, 0.06em, uppercase): category pills.

## Layout

Full-bleed ink band for hero and section titles over a paper page; card grids for stories and topics. Responsive down to 390px with no horizontal overflow; masthead buttons shrink under 640px.

## Elevation & Depth

Mostly flat, with a soft ambient shadow on cards (`0 1px 2px rgba(32,29,22,.04), 0 12px 28px -18px rgba(32,29,22,.22)`). Story cards gain the shadow and lift 3px on hover. The only blur is the frosted status banner and skeleton placeholders.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest; depth appears in response to state.

## Shapes

Pills (999px) for buttons, tags and the theme toggle; 14px for status banners and cards. Hairline 1px borders at ~8% ink.

## Components

### Buttons
- **Shape:** pill (999px).
- **Accent / Dark / Outline** variants; hover lifts 1px and shifts colour over 150ms.

### Chips
- **Tag pill:** quiet outline, olive fill when active.
- **Category pill:** solid flat fill, uppercase micro-label.

### Cards / Containers
- **Story card:** paper card with hairline border; hover lift 3px plus shadow (200ms).
- **Topic card / status banner:** flat card; frosted glass for in-flight agent status.

### Navigation
- Masthead with text links and a 2px terracotta underline on the active item.

## Do's and Don'ts

### Do:
- **Do** use existing CSS variables so light and dark both work.
- **Do** keep motion short (150-300ms), ease-out, on transform and opacity.

### Don't:
- **Don't** add gradients, glow or heavy blur; the system is flat and matte.
- **Don't** introduce new accent hues.
