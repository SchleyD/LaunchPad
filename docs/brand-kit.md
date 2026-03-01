# Launchpad Brand Kit v1

**Internal AWS Product**

> "Mission Control for Customer Implementation."

---

## Logo

### Primary Logo (App Icon)

- **Background:** AWS Deep Blue `#123F6D`
- **Arrow:** White `#FFFFFF`
- **Accent Swoosh:** AWS Yellow `#F2B705` (subtle, optional)
- **Shape:** Rounded square (8-12px radius)
- **Style:** Flat or very light gradient only (avoid SaaS gloss)

### App Icon Sizes

Export at these sizes:
- 16x16 (favicon)
- 32x32
- 48x48
- 64x64
- 128x128
- 256x256
- 512x512 (master)

### Favicon

- Blue tile + white arrow (no yellow accent)
- High contrast for browser tab visibility
- Files: `favicon.ico`, `favicon-32.png`, `favicon-16.png`

### Wordmark

- **Text:** Launchpad
- **Font:** Clean geometric sans, semi-bold weight
- **Color:** Navy `#123F6D`
- Optional subtle yellow underline accent for marketing use only

---

## Color System

### Primary Colors

| Name | Hex | Usage |
|------|-----|-------|
| AWS Deep Blue | `#123F6D` | Primary brand, buttons, headers |
| Hover Blue | `#0F3258` | Button hover states |
| Light Blue Tint | `#EAF2F8` | Backgrounds, highlights |

### Accent Color

| Name | Hex | Usage |
|------|-----|-------|
| AWS Yellow | `#F2B705` | Progress indicators, subtle highlights only |

**Yellow Usage Rules:**
- Use sparingly
- Progress underlines
- Subtle milestone indicators
- Small highlights only
- **Never** full background blocks in app UI

### Neutrals

| Name | Hex | Usage |
|------|-----|-------|
| Dark Text | `#1F2933` | Primary text |
| Mid Gray | `#6B7280` | Secondary text, labels |
| Border Gray | `#E5E7EB` | Borders, dividers |
| Background | `#F8FAFC` | Page backgrounds |

---

## Typography

### Font Stack

```css
font-family: 'Inter', system-ui, -apple-system, sans-serif;
```

Acceptable alternatives:
- SF Pro
- Helvetica Neue
- Roboto

### Type Scale

| Element | Size | Weight |
|---------|------|--------|
| H1 | 24-28px | Semibold (600) |
| H2 | 18-20px | Semibold (600) |
| Body | 14-16px | Regular (400) |
| Micro/Meta | 12px | Regular (400) |

---

## UI Components

### Buttons

**Primary Button:**
- Background: `#123F6D`
- Text: white
- Hover: `#0F3258`

**Secondary Button:**
- Background: white
- Border: `#123F6D`
- Text: `#123F6D`

**Danger Button:**
- Use muted red
- Only for destructive actions

### Status Colors

| Status | Color | Style |
|--------|-------|-------|
| Ready | Subtle blue | `bg-primary-50 text-primary-500` |
| Blocked | Muted amber | `bg-amber-50 text-amber-600` |
| Complete | Neutral green | `bg-emerald-50 text-emerald-600` |
| Backlog | Gray | `bg-surface-100 text-surface-500` |

**Note:** No bright SaaS greens.

### Cards

- Background: white
- Border: `#E5E7EB`
- Border radius: 8px
- Shadow: subtle or none

---

## Design Philosophy

Launchpad is:
- Operational
- Disciplined
- Infrastructure software

Launchpad is **not**:
- Startup SaaS
- Playful
- Marketing heavy

### Do

- Clean spacing
- Clear hierarchy
- Flat surfaces
- Structured layout
- Strong typography

### Don't

- Large gradients
- Rainbow tags
- Over-animated UI
- Excessive iconography
- Dashboard clutter

---

## Tailwind Configuration

See `tailwind.config.js` for the full color palette implementation.

```js
colors: {
  primary: {
    50: '#EAF2F8',
    500: '#123F6D',  // Main
    600: '#0F3258',  // Hover
  },
  accent: {
    400: '#F2B705',  // AWS Yellow
  },
  surface: {
    50: '#F8FAFC',   // Background
    200: '#E5E7EB',  // Border
    500: '#6B7280',  // Mid Gray
    800: '#1F2933',  // Dark Text
  }
}
```

---

## File Locations

- Logo: `/public/launchpad-logo.jpg`
- Favicon: `/public/favicon.svg`
- Styles: `/src/styles/main.css`
- Tailwind config: `/tailwind.config.js`
