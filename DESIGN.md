---
version: alpha
colors:
  primary: "#155EEF"
  primaryAction: "#155EEF"
  success: "#16A861"
  streak: "#F97316"
  lightCanvas: "#FFFFFF"
  darkCanvas: "#0B1325"
typography:
  product:
    fontFamily: "Pretendard, Noto Sans KR, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
  utility:
    fontFamily: "Pretendard, Noto Sans KR, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
rounded:
  control: "9px"
  card: "10px"
spacing:
  compact: "8px"
  standard: "16px"
  section: "24px"
components:
  primaryAction:
    backgroundColor: "#155EEF"
    textColor: "#FFFFFF"
    rounded: "9px"
  learningCard:
    rounded: "0px"
  progressIndicator:
    backgroundColor: "#155EEF"
  completionMarker:
    backgroundColor: "#16A861"
  streakStatus:
    backgroundColor: "#F97316"
  appCanvas:
    backgroundColor: "#FFFFFF"
  darkAppCanvas:
    backgroundColor: "#0B1325"
---

# Mast Design System

## Overview

Mast is a focused math-learning game for students who need to see today's work, solve a short stage, and understand the result immediately. The product register is functional and calm, with game mechanics concentrated inside the learning loop. Its visual signature is the Quest Rail: square stage nodes connect learning, review, weakness practice, XP, and stars in one causal path. Strong headings, thin dividers, graph-paper prompts, and a single cobalt action color make the product read as a precise math notebook rather than a generic dashboard.

Avoid decorative gamification, mascot-heavy layouts, gradients, glass effects, repeated pill badges, symmetrical KPI-card grids, and card-on-card composition. Use the mascot only in the growth space and earned result moments. Prefer ruled rows and editorial spacing over wrapping every data group in a rounded container.

## Colors

Cobalt blue is the only expressive brand color. Use it for active learning, primary actions, progress, selection, and focus. Green is reserved for completed states; orange is reserved for streaks. Neither competes with cobalt for primary hierarchy.

Light mode uses a white canvas with cool blue-gray surfaces. Dark mode uses deep navy rather than pure black, with lifted navy surfaces and brighter muted text. Semantic meaning must remain unchanged between themes.

Runtime ownership: the semantic CSS custom properties in `src/prototype.css` are the implementation source for theme values. This document records their durable intent and normative anchors.

## Typography

Use the Korean-capable system sans stack. Product headings use weight and compact letter spacing for hierarchy; body and utility labels remain plain and concise. Numeric progress values use tabular alignment where available.

## Layout

The app uses three top-level destinations. Home is a flat daily agenda: today's goal, the current unit, four ruled lesson rows, and one primary continue action. The active row receives the only tinted surface and a cobalt rule; completed and locked states stay quiet and explicit. Learn owns the detailed lesson index and progress controls. User groups identity, level progress, achievements, and settings into clearly separated sections. Bottom navigation remains fixed while each destination scrolls independently.

## Elevation & Depth

Static content stays flat. Separation comes from spacing, tonal surfaces, and hairline borders. Floating menus and notices may use one low, soft shadow because they occupy a temporary layer.

## Shapes

Primary controls use 9px corners. Content groups generally use rules rather than containers; when a small container is necessary, use 10px corners. Progress tracks may use compact rounding. Square nodes are reserved for the ordered quest path and express current, upcoming, complete, and locked states.

## Components

- Primary actions use solid cobalt, white text, a visible focus ring, and immediate pressed movement.
- Learning cards expose complete, active, and locked states through label, icon, color, and border treatment.
- Theme switching is an icon button with an accessible changing label and an immediate status announcement.
- Notices use a shared fixed placement, semantic icon and text, enter/exit motion, and automatic dismissal.
- Authored grade selection keeps its compact popover and keyboard-readable menu semantics.
- The fixed bottom navigation uses Home, Learn, and User as the only top-level destinations; changing destinations preserves shared learning progress and theme state.
- Daily quests expose their progress and XP reward directly. Correct answers can build a combo and show a short XP burst; wrong answers reset the combo without removing previously earned XP.
- The Mast mascot uses transparent raster assets under `public/assets/mast/`; the interface owns their animation and reduced-motion behavior.
- The Mast brand mark uses `public/mast-mark-v2.png`; runtime UI renders the wordmark as accessible text so the mark remains reusable at app-icon and header sizes.
- Home, Learn, Review, Report, Growth, Lesson, and Result share one button, row, semantic color, feedback, and motion vocabulary.

## Do's and Don'ts

Do coordinate lesson completion, path advancement, progress fill, and notice timing. Do keep both themes visually equivalent and accessible. Do respect reduced-motion preferences.

Do not add color for decoration, place every section in a card, hide state behind color alone, or let feedback move the primary controls.

The core lesson stage uses short multiple-choice challenges, immediate explanatory feedback, hearts for mistakes, and XP for correct answers. Home remains quiet; the lesson stage is where stronger game tactility, pressed depth, and reward motion belong.
