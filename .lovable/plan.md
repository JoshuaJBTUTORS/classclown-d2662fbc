

## Rebrand to Premium Teal Theme

### Summary
Update the entire site's design system — colors, typography, shadows, and component styles — to match the new calm, authoritative, premium branding with Deep Teal primary, Plus Jakarta Sans headings, and Inter body text.

### What Changes

**1. Fonts (index.html + index.css + tailwind.config.ts)**
- Add Google Font import for "Plus Jakarta Sans" (replace Roboto/Playfair Display/Fredoka One)
- Keep "Inter" (already imported) for body text
- Set body font-family to `'Inter', sans-serif`
- Set headings to `'Plus Jakarta Sans', sans-serif`
- Update tailwind fontFamily config accordingly
- Keep specialty fonts (Caveat for handwriting, Georgia/Times for exam papers) untouched

**2. CSS Variables (index.css :root)**
Replace the current color system with the new palette:

```text
--background:        210 20% 99%       (Off-White)
--foreground:        220 25% 10%       (Near-Black)
--primary:           168 65% 32%       (Deep Teal)
--primary-foreground: 0 0% 100%
--secondary:         40 30% 96%        (Warm Sand)
--secondary-foreground: 220 25% 25%
--accent:            150 25% 94%       (Soft Sage)
--accent-foreground: 220 25% 10%
--muted:             40 30% 96%
--muted-foreground:  220 10% 45%
--border:            220 15% 92%
--card:              0 0% 100%
--card-foreground:   220 25% 10%
--background-cream:  40 30% 96%
--background-alt:    210 20% 98%
```

**3. Shadow Variables (index.css :root)**
```text
--shadow-subtle:   0 1px 3px rgba(0,0,0,0.04)
--shadow-card:     0 4px 16px rgba(0,0,0,0.06)
--shadow-elevated: 0 8px 32px rgba(0,0,0,0.08)
--shadow-glow:     0 0 24px hsla(168,65%,32%,0.15)
```

**4. Button Component (button.tsx)**
- Default variant: solid teal (`hsl(168,65%,32%)`), white text, `rounded-full`, glow shadow on hover — no gradients
- Outline: teal border, white bg, teal text on hover
- Ghost/link: teal color accents
- Remove all gradient-based button styles

**5. Card Component (card.tsx)**
- Border: `hsl(220,15%,92%)`, rounded `0.75rem`, shadow `--shadow-card`
- Remove colored header/footer borders, keep clean white

**6. Component Classes in index.css**
- Update `.luxury-*` classes to use teal instead of purple-blue/green gradients
- Update `.cleo-*` classes (green references → teal)
- Replace gradient buttons with solid teal
- Update sidebar active state glow to teal

**7. Sidebar & Layout**
- Update sidebar accent colors to teal
- Update `LearningHubLayout` background to use new `--background-cream` (Warm Sand)

**8. Dark Mode Variables**
- Update dark mode to complement the teal palette

### Files Modified
- `index.html` — font imports
- `src/index.css` — CSS variables, component classes, font-family
- `tailwind.config.ts` — fontFamily, remove unused color refs
- `src/components/ui/button.tsx` — variant styles
- `src/components/ui/card.tsx` — border/shadow styles
- `src/components/ui/PageTitle.tsx` — heading font class
- Minor touch-ups across components that hardcode old colors

### Design Principles Maintained
- Exam paper fonts (Georgia, Times New Roman, Caveat) preserved
- No loud gradients — solid teal with subtle hover glow
- Generous whitespace, 0.75rem radius, soft shadows
- Calm, trustworthy, premium feel throughout

