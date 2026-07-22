## Goal

Add two new lesson-type options to lesson proposals: **Mixed (1-to-1 & Group)** and **Large Group Session**, alongside the existing 1-to-1 Online, 1-to-1 In-Person, and Group Session.

## Current state

`lesson_type` on `lesson_proposals` is a free-text string. Today the dropdown in both proposal editors offers only three values:

- `1-to-1 Online`
- `1-to-1 In-Person`
- `Group Session`

The proposal hero copy (`ProposalLayout.tsx` line 284) only branches on the legacy `'group'` value — every other value (including the current `Group Session`) falls through to the 1-to-1 wording, which is already slightly wrong for group and will be wrong for the new options.

## Changes

**1. Dropdown options — add Mixed and Large Group**

Update the `<Select>` for lesson type in both files to add two new options after the existing three:

- `src/pages/ProposalBuilder.tsx` (lines 195–197)
- `src/pages/admin/EditProposal.tsx` (lines 337–339)

New options:

```tsx
<SelectItem value="1-to-1 Online">1-to-1 Online</SelectItem>
<SelectItem value="1-to-1 In-Person">1-to-1 In-Person</SelectItem>
<SelectItem value="Group Session">Small Group Session</SelectItem>
<SelectItem value="Large Group Session">Large Group Session</SelectItem>
<SelectItem value="Mixed">Mixed (1-to-1 & Group)</SelectItem>
```

Keeping the stored value `Group Session` unchanged preserves every existing proposal; only its label becomes "Small Group Session" for clarity against the new "Large Group Session".

**2. Proposal hero copy — support all five types**

In `src/components/proposals/ProposalLayout.tsx` (lines 283–287), replace the two-branch ternary with a small helper that maps `proposal.lesson_type` to the right description:

- `1-to-1 Online` / `1-to-1 In-Person` → existing 1-to-1 wording.
- `Group Session` (small group) → existing small-group wording.
- `Large Group Session` → "A structured large-group tuition programme aligned to your child's exam board and pace, delivered in a classroom-style setting by subject specialists we've hand-picked."
- `Mixed` → "A blended tuition programme combining focused 1-to-1 sessions with collaborative group learning, aligned to your child's exam board and pace, delivered by subject specialists we've hand-picked."
- Fallback (legacy `'group'` and anything unknown) → 1-to-1 wording, so nothing regresses.

## Out of scope

- No database migration — `lesson_type` stays a string.
- No changes to calendar `lesson_type` filters or to `AddLessonForm`/`EditLessonForm`; those use their own separate lesson-type concept for calendar events, not proposals.
- Pricing/session-count logic is unchanged; admins already enter those manually per proposal.
