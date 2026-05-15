# JourneyMapper Design System

> Category: AI & Design Tools

Refined, editorial, quietly confident. Built for design consultants who value craft.

## 1. Color

All colors use `oklch()` for perceptual uniformity. Never invent hex values — derive from the palette below.

### Light Mode
| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `oklch(0.985 0.002 80)` | Page background (warm off-white) |
| `--foreground` | `oklch(0.15 0.01 60)` | Primary text |
| `--card` | `oklch(1 0 0)` | Card surfaces |
| `--muted` | `oklch(0.96 0.005 80)` | Subtle backgrounds |
| `--muted-foreground` | `oklch(0.5 0.01 60)` | Secondary text |
| `--border` | `oklch(0.91 0.005 80)` | Dividers, card borders |
| `--amber` | `oklch(0.75 0.15 70)` | Brand accent — CTAs, active states, links |
| `--amber-foreground` | `oklch(0.15 0.03 60)` | Text on amber backgrounds |

### Dark Mode (default)
| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `oklch(0.1 0.008 60)` | Page background (warm dark) |
| `--foreground` | `oklch(0.93 0.005 80)` | Primary text |
| `--card` | `oklch(0.14 0.008 60)` | Card surfaces |
| `--muted` | `oklch(0.2 0.01 60)` | Subtle backgrounds |
| `--muted-foreground` | `oklch(0.6 0.01 60)` | Secondary text |
| `--border` | `oklch(1 0 0 / 8%)` | Dividers |
| `--amber` | `oklch(0.75 0.15 70)` | Brand accent |
| `--amber-foreground` | `oklch(0.1 0.01 60)` | Text on amber |

### Semantic Colors
- Success: `oklch(0.65 0.2 145)` — green
- Warning: `oklch(0.8 0.18 85)` — yellow
- Danger: `oklch(0.6 0.22 25)` — red

### Constraint
Never pure black `#000` or pure white `#FFF` for backgrounds. The warm undertone (hue 60–80) is the brand's signature subtlety.

## 2. Typography

### Font Stack
- **Display**: DM Serif Display — used for all h1–h3 headings via `.font-display` class
- **Body**: DM Sans (300–700) — used for all body text, UI labels, buttons
- **Monospace**: system monospace stack — code, data displays only

### Scale (px)
11 · 12 · 13 · 14 · 16 · 18 · 20 · 24 · 30 · 36 · 48

### Rules
- Display ≥24px gets `letter-spacing: -0.01em`
- Labels use `text-xs font-medium uppercase tracking-wider text-muted-foreground` — the signature micro-label style
- Never use Inter, Roboto, or Arial
- Use `text-wrap: pretty` on paragraphs

## 3. Spacing

4px base grid. All spacing values are multiples of 4.

| Token | Value |
|-------|-------|
| `space-1` | 4px |
| `space-2` | 8px |
| `space-3` | 12px |
| `space-4` | 16px |
| `space-5` | 20px |
| `space-6` | 24px |
| `space-8` | 32px |
| `space-10` | 40px |
| `space-12` | 48px |
| `space-16` | 64px |

## 4. Layout

- **Max content width**: 1280px (`max-w-6xl` or `max-w-5xl` for reading)
- **Page padding**: 24px (`p-6`)
- **Section spacing**: 32px (`space-y-8`)
- **Card padding**: 16–20px (`p-4` or `p-5`)
- **Responsive breakpoints**: Tailwind defaults (sm:640, md:768, lg:1024, xl:1280)

## 5. Radius

| Tier | Value | Usage |
|------|-------|-------|
| sm | 6px | Inputs, small buttons |
| md | 8px | Cards, standard buttons |
| lg | 12px | Modals, large panels |
| xl | 16px | Hero cards, feature blocks |
| 2xl | 20px | Large decorative elements |
| pill | 9999px | Tags, status pills |

## 6. Elevation & Depth

Two levels only. Minimal shadows — use borders for structure.

| Level | Shadow | Usage |
|-------|--------|-------|
| Flat (0) | none | Default state for all elements |
| Raised (1) | `0 4px 12px -2px oklch(0 0 0 / 0.12)` | Dropdowns, modals, popovers |

**Hover lift effect**: `hover:shadow-lg hover:shadow-amber/5` — barely-there amber glow.

## 7. Motion

| Duration | Value | Usage |
|----------|-------|-------|
| Fast | 150ms | Hover states, micro-interactions |
| Base | 200ms | Panel transitions, page elements |
| Slow | 300ms | Modal open/close, canvas zoom |

**Easing**: `cubic-bezier(0.2, 0, 0, 1)` — purposeful, not bouncy.

Use `transition-all duration-200` as the default Tailwind transition.

## 8. Component Patterns

### Buttons
- Primary: `bg-amber text-amber-foreground hover:bg-amber/90` — warm gold CTA
- Secondary/Outline: `variant="outline"` with default border
- All buttons: `h-10` or `h-11` height, `font-medium`

### Cards
- Border: `border-border/50` (subtle, not heavy)
- Hover: `hover:border-amber/30 hover:shadow-lg hover:shadow-amber/5`
- Content padding: `p-4` or `p-5`

### Empty States
- Dashed border: `border border-dashed border-border/60 rounded-xl p-16`
- Icon container: `w-16 h-16 rounded-2xl bg-amber/10` with amber icon
- Font display heading + muted description

### Labels & Micro-copy
- `text-xs font-medium uppercase tracking-wider text-muted-foreground` — the JourneyMapper signature

### Section Headers
- `font-display text-3xl` for page titles
- `text-sm text-muted-foreground` for descriptions
- `text-[10px] uppercase tracking-[0.15em] text-muted-foreground/60` for sidebar group labels

## 9. Anti-Patterns (Do Not)

- No purple gradients — our accent is warm amber
- No emoji as icons — use Lucide React icons consistently
- No uniform system fonts as display type — DM Serif Display is the display font
- No multiple saturated accent colors simultaneously (one accent: amber)
- No drop shadows on inputs
- No lorem ipsum — use honest placeholders with gray blocks
- No decorative elements that don't earn their place (120/80 principle)
- No CSS silhouettes replacing real content — use actual screenshots or honest placeholders
- No rounded-card-plus-left-colored-border layout (Material/Tailwind 2020 cliché)
- No generic AI aesthetics — every design decision should feel intentional
