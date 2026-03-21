# Design System

> Inspiration: Notion — clean, editorial, content-first. Every element earns its place.
> Non-negotiables: Geist font, `#FCF9F5` base, no gradients, no generic AI aesthetics.

---

## Global Tokens

All design tokens live in `src/app/globals.css`. **Never hardcode colors or fonts anywhere else.**

```css
@import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600&family=Geist+Mono:wght@400;500&display=swap');

:root {
  /* Base */
  --background: #FCF9F5;
  --background-subtle: #F5F1EB;
  --background-muted: #EDE9E3;

  /* Accent — change here to retheme the entire app */
  --accent: #your-accent-here;
  --accent-foreground: #ffffff;
  --accent-hover: color-mix(in srgb, var(--accent) 85%, black);
  --accent-subtle: color-mix(in srgb, var(--accent) 12%, var(--background));

  /* Text */
  --text-primary: #1a1a18;
  --text-secondary: #6b6b63;
  --text-tertiary: #9c9c92;
  --text-disabled: #c4c4bc;

  /* Borders */
  --border: #e4e0da;
  --border-strong: #ccc8c2;

  /* Semantic */
  --success: #3b7a57;
  --success-subtle: #edf5f0;
  --danger: #c0392b;
  --danger-subtle: #fdf0ee;
  --warning: #b45309;
  --warning-subtle: #fef9ee;

  /* Surface */
  --card: #ffffff;
  --card-hover: #faf8f4;

  /* Typography */
  --font-sans: 'Geist', sans-serif;
  --font-mono: 'Geist Mono', monospace;

  /* Spacing scale */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;

  /* Radius */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;

  /* Shadows — flat and subtle, no heavy elevation */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 1px 4px rgba(0,0,0,0.07), 0 0 0 1px var(--border);
}
```

**To change the accent color:** update `--accent` in `:root` only. Everything else responds automatically.

---

## Typography

Font: **Geist** throughout. Geist Mono for numbers, amounts, dates, and code.

```css
body {
  font-family: var(--font-sans);
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-primary);
  background: var(--background);
  -webkit-font-smoothing: antialiased;
}
```

| Role              | Size  | Weight | Color               | Notes                            |
|-------------------|-------|--------|---------------------|----------------------------------|
| Page title        | 20px  | 500    | `--text-primary`    | One per page, no hero treatment  |
| Section heading   | 13px  | 500    | `--text-secondary`  | Uppercase, 0.06em letter-spacing |
| Body              | 14px  | 400    | `--text-primary`    |                                  |
| Label / caption   | 12px  | 400    | `--text-secondary`  |                                  |
| Monospace numbers | 14px  | 400    | `--font-mono`       | Amounts, balances, dates         |

**Rules:**
- No text larger than 24px anywhere in the app
- Section headings: `text-[11px] font-medium uppercase tracking-wider text-[--text-secondary]`
- Never use font-weight 700 — 600 is the maximum
- Amounts and financial figures always use Geist Mono

---

## Color Usage

| Token                | Where                                          |
|----------------------|------------------------------------------------|
| `--background`       | Page background — every page                   |
| `--background-subtle`| Sidebar, secondary panels, input backgrounds   |
| `--background-muted` | Dividers, empty states, skeleton loaders       |
| `--card`             | Cards, modals, dropdowns                       |
| `--accent`           | Primary buttons, active nav, key interactions  |
| `--accent-subtle`    | Badges, selected rows, hover states            |
| `--border`           | All borders, dividers                          |
| `--text-secondary`   | Metadata, labels, placeholders                 |

**Hard rules:**
- No gradients — anywhere, ever
- No colored backgrounds on sections or pages (accent for interactive elements only)
- No shadows heavier than `--shadow-md`
- Income/positive: `--success` text on `--success-subtle` bg
- Expense/negative: `--danger` text on `--danger-subtle` bg
- Warning/due soon: `--warning` text on `--warning-subtle` bg

---

## Layout

### Page structure
Every page follows this shell:
```
┌─────────────────────────────────┐
│  Page header (title + actions)  │  h-14, px-6, border-bottom
├─────────────────────────────────┤
│                                 │
│  Content area                   │  p-6, max-w-none
│                                 │
└─────────────────────────────────┘
```

```tsx
// Every page uses this wrapper
<div className="flex flex-col h-full">
  <header className="flex items-center justify-between h-14 px-6 border-b border-[--border] shrink-0">
    <h1 className="text-[20px] font-medium">Page Title</h1>
    <div className="flex items-center gap-2">
      {/* page-level actions */}
    </div>
  </header>
  <div className="flex-1 overflow-y-auto p-6">
    {/* content */}
  </div>
</div>
```

### Sidebar
- Width: `w-56` desktop, full-width sheet on mobile
- Background: `--background-subtle`
- Active item: `--accent` bg, white text, `rounded-[--radius-md]`
- Inactive item: `--text-secondary`, hover `--background-muted`
- Nav label: 14px, font-medium
- No icons required — text-only nav is fine (Notion-style)

### Grid / spacing
- Content padding: `p-6` (24px)
- Card gap: `gap-4` (16px)
- Section gap: `gap-6` (24px)
- Max content width on wide screens: `max-w-4xl` — never full bleed on large monitors

---

## Components

### Card
Notion-style: white bg, single-pixel border, minimal radius. No heavy shadows.

```tsx
<div className="bg-[--card] border border-[--border] rounded-[--radius-lg] p-4">
```

Hover state for interactive cards:
```tsx
<div className="bg-[--card] border border-[--border] rounded-[--radius-lg] p-4
                hover:bg-[--card-hover] hover:border-[--border-strong]
                transition-colors cursor-pointer">
```

### Button

Primary:
```tsx
<Button className="bg-[--accent] text-[--accent-foreground]
                   hover:bg-[--accent-hover] h-8 px-3 text-sm font-medium
                   rounded-[--radius-md] shadow-none">
```

Secondary / ghost:
```tsx
<Button variant="ghost" className="h-8 px-3 text-sm text-[--text-secondary]
                                   hover:bg-[--background-muted]
                                   hover:text-[--text-primary] rounded-[--radius-md]">
```

Destructive (inline, no solid red bg):
```tsx
<Button variant="ghost" className="h-8 px-3 text-sm text-[--danger]
                                   hover:bg-[--danger-subtle] rounded-[--radius-md]">
```

**Rules:**
- Height: `h-8` (32px) default, `h-9` (36px) for prominent CTAs
- No rounded-full buttons
- No gradient fills
- Icons inside buttons: 14–15px, `gap-1.5`

### Input / Form fields

```tsx
<Input className="bg-[--background-subtle] border-[--border]
                  focus:border-[--border-strong] focus:ring-0 focus:ring-offset-0
                  h-9 text-sm rounded-[--radius-md] placeholder:text-[--text-tertiary]">
```

Labels: 12px, `--text-secondary`, `font-medium`, 4px gap above input.
Never use floating labels.

### Badge / Pill

```tsx
// Neutral
<span className="inline-flex items-center px-2 py-0.5 rounded-[--radius-sm]
                 text-[11px] font-medium bg-[--background-muted] text-[--text-secondary]">

// Positive
<span className="... bg-[--success-subtle] text-[--success]">

// Negative
<span className="... bg-[--danger-subtle] text-[--danger]">

// Accent (active state, selected)
<span className="... bg-[--accent-subtle] text-[--accent]">
```

### Dividers / Section labels

```tsx
// Section heading above a group of items
<p className="text-[11px] font-medium uppercase tracking-wider text-[--text-secondary] mb-3">
  Accounts
</p>

// Horizontal rule
<div className="border-t border-[--border] my-6" />
```

### Empty state

```tsx
<div className="flex flex-col items-center justify-center py-16 text-center">
  <p className="text-sm font-medium text-[--text-secondary]">No transactions yet</p>
  <p className="text-xs text-[--text-tertiary] mt-1">Add one to get started</p>
  <Button className="mt-4 ...">Add transaction</Button>
</div>
```

No illustrations, no big icons, no decorative elements in empty states.

### Modal / Dialog

```tsx
<DialogContent className="bg-[--card] border border-[--border]
                           rounded-[--radius-xl] shadow-md p-6 max-w-md">
```

- Title: 16px, font-medium
- Subtitle/description: 13px, `--text-secondary`
- Action buttons right-aligned, `gap-2`
- No colored header bars

### Sheet (mobile drawer)

```tsx
<SheetContent className="bg-[--background-subtle] border-l border-[--border] p-0">
```

---

## Data Display (financial / stats)

### Amount display
Always Geist Mono. Color by sign.

```tsx
// Positive
<span className="font-mono text-[--success]">+₹12,500</span>

// Negative
<span className="font-mono text-[--danger]">−₹3,200</span>

// Neutral
<span className="font-mono text-[--text-primary]">₹45,000</span>
```

### Stat card (balance, totals)
```tsx
<div className="bg-[--card] border border-[--border] rounded-[--radius-lg] p-4">
  <p className="text-[11px] font-medium uppercase tracking-wider text-[--text-secondary]">
    Total balance
  </p>
  <p className="mt-1 text-2xl font-semibold font-mono text-[--text-primary]">
    ₹1,24,500
  </p>
  <p className="mt-1 text-xs text-[--text-tertiary]">across 3 accounts</p>
</div>
```

### Progress bar (goals)
```tsx
<div className="h-1.5 bg-[--background-muted] rounded-full overflow-hidden">
  <div className="h-full bg-[--accent] rounded-full transition-all"
       style={{ width: `${pct}%` }} />
</div>
```

Thin (6px), no gradients on the fill, `--accent` color only.

### Table / List rows
```tsx
<div className="flex items-center justify-between py-3 border-b border-[--border]
                last:border-0 hover:bg-[--card-hover] -mx-4 px-4 transition-colors">
  <div>
    <p className="text-sm font-medium">Swiggy</p>
    <p className="text-xs text-[--text-secondary]">Food · 12 Mar</p>
  </div>
  <span className="font-mono text-sm text-[--danger]">−₹340</span>
</div>
```

---

## Interaction Principles

- **No surprise animations** — transitions only on `colors`, `opacity`, `transform`. Duration: 150ms ease.
- **Hover = subtle**, never dramatic. `bg` shifts by one step, border darkens slightly.
- **Focus rings** — remove default, replace with `outline: 2px solid var(--accent); outline-offset: 2px` on keyboard focus only.
- **Loading** — skeleton loaders using `--background-muted` animated pulse. No spinners for content loads.
- **Destructive actions** — always require a confirmation dialog. Button text: "Delete", not "Yes, delete it!" — keep it dry.

---

## What to Avoid

| ❌ Never                              | ✅ Instead                              |
|--------------------------------------|-----------------------------------------|
| Gradient fills on any surface        | Flat `--card` or `--background-subtle`  |
| `rounded-full` buttons               | `rounded-[--radius-md]`                 |
| Box shadows with spread > 4px        | `--shadow-md` or border-only cards      |
| Font weight 700 or 800               | 500 or 600 max                          |
| Colored page/section backgrounds     | `--background` everywhere               |
| Large hero numbers (48px+)           | 24px max for display figures            |
| Emoji in UI chrome                   | Plain text labels                       |
| Inter, Roboto, or system-ui          | Geist only                              |
| `text-gray-500` or Tailwind grays    | `--text-secondary` / `--text-tertiary`  |
| Multiple accent colors               | One accent, semantic colors for status  |

---

## Tailwind Config Additions

In `tailwind.config.ts`, extend with CSS variable references so you can use `bg-background`, `text-primary` etc. as shorthand:

```ts
theme: {
  extend: {
    colors: {
      background: 'var(--background)',
      'background-subtle': 'var(--background-subtle)',
      'background-muted': 'var(--background-muted)',
      card: 'var(--card)',
      accent: 'var(--accent)',
      'accent-foreground': 'var(--accent-foreground)',
      'accent-subtle': 'var(--accent-subtle)',
      border: 'var(--border)',
      'border-strong': 'var(--border-strong)',
    },
    fontFamily: {
      sans: ['Geist', 'sans-serif'],
      mono: ['Geist Mono', 'monospace'],
    },
    borderRadius: {
      sm: 'var(--radius-sm)',
      md: 'var(--radius-md)',
      lg: 'var(--radius-lg)',
      xl: 'var(--radius-xl)',
    },
  },
},
```

---

## Checklist before building any new page

- [ ] Page background is `--background` (`#FCF9F5`)
- [ ] Font is Geist — no fallback to Inter or system-ui
- [ ] Financial amounts use Geist Mono
- [ ] No gradients anywhere
- [ ] Colors reference CSS variables, not hardcoded hex
- [ ] Accent color used only for primary actions and active states
- [ ] Empty state is handled
- [ ] Mobile layout tested (stacks cleanly, no overflow)