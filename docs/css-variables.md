# Launchpad CSS Variables

Reference for CSS custom properties used throughout the application.

## Root Variables

```css
:root {
  /* Primary Brand */
  --color-primary: 18 63 109;       /* #123F6D AWS Deep Blue */
  --color-primary-hover: 15 50 88;  /* #0F3258 Hover Blue */
  
  /* Accent */
  --color-accent: 242 183 5;        /* #F2B705 AWS Yellow */
  
  /* Neutrals */
  --color-text-dark: 31 41 51;      /* #1F2933 Dark Text */
  --color-text-mid: 107 114 128;    /* #6B7280 Mid Gray */
  --color-border: 229 231 235;      /* #E5E7EB Border Gray */
  --color-background: 248 250 252;  /* #F8FAFC Background */
}
```

## Tailwind Classes

### Primary Colors

| Class | Color |
|-------|-------|
| `bg-primary-500` | AWS Deep Blue |
| `bg-primary-600` | Hover Blue |
| `bg-primary-50` | Light Blue Tint |
| `text-primary-500` | Navy text |

### Accent Colors

| Class | Color |
|-------|-------|
| `bg-accent-400` | AWS Yellow |
| `text-accent-400` | Yellow text |

### Surface Colors

| Class | Usage |
|-------|-------|
| `bg-surface-50` | Page background |
| `bg-surface-100` | Card hover, subtle bg |
| `bg-surface-200` | Borders |
| `text-surface-500` | Secondary text |
| `text-surface-800` | Primary text |

## Badge Classes

```css
.badge-primary   /* Blue - Ready status */
.badge-success   /* Green - Complete status */
.badge-warning   /* Amber - Blocked status */
.badge-danger    /* Red - Destructive only */
.badge-neutral   /* Gray - Backlog status */
.badge-ready     /* Blue accent - Ready status */
```

## Button Classes

```css
.btn-primary     /* Navy background, white text */
.btn-secondary   /* White background, navy border */
.btn-ghost       /* Transparent, navy text */
.btn-danger      /* Muted red, destructive actions */
```
