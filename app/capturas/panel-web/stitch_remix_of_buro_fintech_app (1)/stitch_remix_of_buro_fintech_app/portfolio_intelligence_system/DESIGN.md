---
name: Portfolio Intelligence System
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#45474c'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#75777d'
  outline-variant: '#c5c6cd'
  surface-tint: '#545f73'
  primary: '#091426'
  on-primary: '#ffffff'
  primary-container: '#1e293b'
  on-primary-container: '#8590a6'
  inverse-primary: '#bcc7de'
  secondary: '#4b41e1'
  on-secondary: '#ffffff'
  secondary-container: '#645efb'
  on-secondary-container: '#fffbff'
  tertiary: '#040057'
  on-tertiary: '#ffffff'
  tertiary-container: '#0d0093'
  on-tertiary-container: '#7f82ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e3fb'
  primary-fixed-dim: '#bcc7de'
  on-primary-fixed: '#111c2d'
  on-primary-fixed-variant: '#3c475a'
  secondary-fixed: '#e2dfff'
  secondary-fixed-dim: '#c3c0ff'
  on-secondary-fixed: '#0f0069'
  on-secondary-fixed-variant: '#3323cc'
  tertiary-fixed: '#e1e0ff'
  tertiary-fixed-dim: '#c0c1ff'
  on-tertiary-fixed: '#07006c'
  on-tertiary-fixed-variant: '#2f2ebe'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '600'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: '0'
  label-caps:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.08em
  data-mono:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: -0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1440px
  gutter: 24px
  margin-desktop: 40px
  margin-mobile: 16px
  card-padding: 24px
---

## Brand & Style

The design system is anchored in **Institutional Minimalism**, a philosophy that prioritizes clarity, data integrity, and executive calm. It is designed for high-stakes financial decision-making where cognitive load must be minimized. The aesthetic draws inspiration from modern architectural principles and luxury automotive interfaces (notably Polestar), utilizing significant white space and precise alignment to convey a sense of curated intelligence.

The emotional goal is to move away from the high-friction, "urgent" nature of typical fintech and toward a state of **composed authority**. Every element serves a functional purpose; decoration is replaced by meticulous attention to proportion, typography, and micro-interactions.

## Colors

The palette is built on a foundation of "Technical Neutrals." The primary background is a very soft slate (#F8FAFC), which prevents the stark eye strain of pure white while maintaining a clean, paper-like quality. 

- **Primary Slate (#1E293B):** Used for core text, primary navigation, and heavy structural elements. It provides the "institutional" weight.
- **Indigo Accents (#4F46E5):** Used sparingly for primary actions, active states, and data highlights. This color represents intelligence and digital sophistication.
- **Surface Strategy:** Cards and interactive containers utilize pure White (#FFFFFF) to lift them off the neutral background, creating a natural hierarchy without heavy shadows.
- **Data Visualization:** Use a curated set of desaturated indigos, teals, and slates. Avoid high-vibrancy "neon" colors.

## Typography

This design system utilizes **Inter** for its incredible legibility and neutral, systematic appearance. For data-heavy contexts and labels, it incorporates **Geist** to provide a technical, monospaced feel that aids in column scanning and financial precision.

- **Tracking:** Headings use negative letter spacing (-0.02em) to feel tighter and more authoritative. Labels use generous tracking (0.08em) for clarity at small sizes.
- **Hierarchy:** Use font weight rather than size to create emphasis. "Display" styles are reserved for portfolio totals, while "Label-caps" are used for section headers and table column titles.
- **Alignment:** Always align numerical data to the right in tables to ensure decimal points align visually.

## Layout & Spacing

The layout follows a **Strict 8px Grid System**. Proportions are generous to reinforce the premium, "unrushed" nature of the application.

- **The Dashboard Grid:** A 12-column fluid grid with wide 24px gutters. Elements should generally span 3, 4, 6, or 12 columns.
- **Padding:** Use `24px` (3 units) as the standard padding for all primary cards and containers. For denser data views, drop to `16px` (2 units).
- **Responsive Behavior:** On tablet, margins reduce to 24px and the grid collapses to 6 columns. On mobile, margins are 16px and the grid is a single column stack.
- **Vertical Rhythm:** Use consistent 32px or 48px spacing between major section blocks to maintain a sense of openness.

## Elevation & Depth

Hierarchy is achieved through **Tonal Layering** and **Soft Ambient Shadows** rather than stark borders.

- **Base Layer:** The neutral background (#F8FAFC).
- **Surface Layer:** White cards (#FFFFFF) with a very soft, multi-layered shadow (e.g., `0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)`).
- **Borders:** Use a 1px border (#E2E8F0) only when multiple white surfaces are adjacent or to define input fields. 
- **Focus States:** Use a 2px offset ring in Indigo (#4F46E5) to denote active keyboard focus, maintaining accessibility without cluttering the static UI.

## Shapes

The shape language is "Refined Geometric." It avoids the juvenile feel of hyper-rounded corners while shunning the aggressive nature of sharp 90-degree angles.

- **Cards & Containers:** Use `16px` (rounded-lg) for standard dashboard cards. Large main containers can go up to `24px` (rounded-xl).
- **Interactive Elements:** Buttons and input fields use `8px` (standard roundedness) to feel precise and clickable.
- **Charts:** Line charts should utilize a subtle "monotone" or "basis" curve interpolation—avoiding jagged peaks but ensuring the curve doesn't obscure the actual data points.

## Components

### Buttons
- **Primary:** Solid Primary Slate (#1E293B) with White text. No gradients.
- **Secondary:** Ghost style. Transparent background with a subtle border (#E2E8F0) and Slate text.
- **Size:** Standard height is 40px. Large action height is 48px.

### Cards
- Always use a White (#FFFFFF) background.
- Include a 1px subtle border (#E2E8F0) to ensure definition on high-brightness displays.
- Internal headers should use the `label-caps` typography style.

### Input Fields
- Background: Pure White or very light gray (#F1F5F9).
- Border: 1px (#E2E8F0). On focus, the border changes to Indigo (#4F46E5).
- Placeholder text should be desaturated slate (#94A3B8).

### Data Tables
- No vertical lines. Use subtle horizontal dividers (#F1F5F9) only.
- Header row uses a slightly darker neutral background (#F8FAFC) and `label-caps` typography.
- Row hover state: A very slight tint change to #F1F5F9.

### Charts & Graphs
- **Primary Line:** Indigo (#4F46E5) with a 2px stroke width.
- **Area Fill:** A vertical gradient from Indigo (10% opacity) to transparent.
- **Grid Lines:** Minimal, using #F1F5F9. Only horizontal lines for price/value markers.