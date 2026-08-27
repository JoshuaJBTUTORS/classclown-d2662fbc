# Sidebar Redesign (Design Language Match)

Purely visual restyle of the left navigation. No routes, roles, grouping logic, or behaviour change.

## What changes

- **Brand header**: soft pastel panel behind the ClassClown logo with the tiger-stripe scribble motif, heading font for the name, muted caption underneath, pill-shaped close button on mobile.
- **Group headers**: pastel rounded pill rows (currently teal-tinted blocks) using the heading font, small caps, with a soft chevron. Keeps the same expand/collapse behaviour.
- **Nav items**: pill-shaped rows (`rounded-full`), generous padding, icon in a soft circular badge, body font for labels. Hover lifts with a light pastel wash instead of the grey accent.
- **Active state**: filled pastel pill with darker pastel foreground text and a subtle shadow, instead of the current grey `accent` fill.
- **Surface**: sidebar background moves off hard white/grey borders to the design-system surface with a soft right edge and rounded inner container; dividers become faint dashed pastel lines.
- **HeyCleo item**: keeps its wave emoji and redirect action, styled to match the new pills.

## Scope guardrails

- No change to `menuGroups`, role filtering, `getGroupLabelByRole`, `toggleGroup`, or the auto-expand effect.
- No route or label text changes.
- Mobile overlay/slide-in behaviour preserved.

## Technical notes

- Single file edit: `src/components/navigation/Sidebar.tsx`.
- Reuse existing tokens `bg-pastel-mint|lilac|butter|blush|sky|sand` and their `-foreground` pairs (from `src/components/lessonPlans/pastelPalette.ts` / Tailwind config); no hardcoded hex or `bg-white`/`text-gray-*`.
- Reuse `ScribbleStroke` from `src/components/lessonPlans/ScribbleStroke.tsx` for the header motif at low opacity.
- Fonts via existing `font-heading` (Plus Jakarta Sans) and default body (Inter); radii 1.5rem / full pills per the design language.
