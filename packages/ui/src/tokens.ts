/**
 * Design Tokens — Single Source of Truth
 *
 * Inspired by:
 *   Supabase: dark emerald, bg #0f0f0f, accent #3ECF8E
 *   Linear:   ultraminimal, indigo accent #5E6AD2, tight spacing
 *   Vercel:   precise tabular data, geist font, high contrast
 *   Notion:   warm readable surfaces, soft typography
 */

// ─── Color Palette ────────────────────────────────────────────
export const colors = {
  // Backgrounds (dark → light)
  bg: {
    base:     '#0f0f0f',  // App background
    surface:  '#1c1c1c',  // Cards, panels
    elevated: '#252525',  // Dropdowns, modals
    overlay:  '#2e2e2e',  // Hover states, selected rows
  },

  // Borders
  border: {
    subtle:   '#1e1e1e',  // Very subtle (sidebar dividers)
    default:  '#272727',  // Standard borders
    strong:   '#3a3a3a',  // Focused inputs, active states
  },

  // Text
  text: {
    primary:   '#ededed',  // Headlines, primary content
    secondary: '#9b9b9b',  // Subtext, labels
    muted:     '#555555',  // Placeholders, disabled
    inverted:  '#0f0f0f',  // Text on accent backgrounds
  },

  // Accents
  accent: {
    // Supabase emerald — primary CTA, sync status, prices
    green:       '#3ECF8E',
    greenDim:    '#0d2b1e',   // Tinted bg for green badges
    greenBorder: '#1a4a32',   // Border for green badges

    // Linear indigo — secondary accent, services, info states
    indigo:      '#5E6AD2',
    indigoDim:   '#14143b',   // Tinted bg for indigo badges
    indigoBorder:'#1e1e5e',   // Border for indigo badges

    // Amber — warnings, connecting state
    amber:       '#F59E0B',
    amberDim:    '#2b1e0d',

    // Red — errors, cancelled, danger
    red:         '#EF4444',
    redDim:      '#2b0d0d',
  },

  // Status
  status: {
    success: '#3ECF8E',
    warning: '#F59E0B',
    error:   '#EF4444',
    info:    '#5E6AD2',
  },
} as const;

// ─── Typography ──────────────────────────────────────────────
export const typography = {
  // Font stacks
  sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
  mono: '"Geist Mono", "JetBrains Mono", "Fira Code", monospace',

  // Size scale (px / sp)
  size: {
    xs:   11,
    sm:   12,
    base: 13,
    md:   14,
    lg:   15,
    xl:   16,
    '2xl': 18,
    '3xl': 20,
    '4xl': 22,
    '5xl': 26,
    '6xl': 32,
  },

  // Weight
  weight: {
    regular: '400' as const,
    medium:  '500' as const,
    semibold:'600' as const,
    bold:    '700' as const,
    extrabold:'800' as const,
  },

  // Letter spacing
  tracking: {
    tight:   -0.5,
    normal:  0,
    wide:    0.3,
    wider:   0.5,
    widest:  0.8,
  },
} as const;

// ─── Spacing Scale ────────────────────────────────────────────
// Base unit: 4px (Linear-inspired 4pt grid)
export const spacing = {
  0:    0,
  0.5:  2,
  1:    4,
  1.5:  6,
  2:    8,
  2.5:  10,
  3:    12,
  4:    16,
  5:    20,
  6:    24,
  8:    32,
  10:   40,
  12:   48,
  16:   64,
} as const;

// ─── Border Radius ────────────────────────────────────────────
export const radius = {
  sm:   4,
  md:   6,
  lg:   8,
  xl:   12,
  full: 9999,
} as const;

// ─── Shadows / Elevation ──────────────────────────────────────
export const shadow = {
  sm: {
    shadowColor:   '#000',
    shadowOffset:  { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius:  2,
    elevation:     2,
  },
  md: {
    shadowColor:   '#000',
    shadowOffset:  { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius:  8,
    elevation:     4,
  },
  lg: {
    shadowColor:   '#000',
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius:  16,
    elevation:     8,
  },
} as const;

// ─── Animation ────────────────────────────────────────────────
export const animation = {
  fast:   '100ms',
  normal: '150ms',
  slow:   '250ms',
} as const;
