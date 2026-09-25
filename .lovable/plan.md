# Redesign the lesson proposal journey in the ClassClown CRM design language

## Goal
Apply the attached ClassClown CRM visual system consistently across the complete parent journey: proposal review, agreement, and £0 card authorisation. Preserve all proposal content, legal wording, signing, payment, printing, countdown, navigation, and mobile behaviour.

## 1. Proposal page
- Recompose the opening area around a confident ClassClown-style title, recipient name, offer countdown, proposal reference, and primary action.
- Replace bordered white boxes with spacious mint, lilac, butter, blush, sky, and sand surfaces using the existing semantic pastel tokens.
- Present the programme start, term, schedule, inclusions, results, and pricing as clear soft tiles with generous spacing, strong Plus Jakarta Sans headings, and Inter body copy.
- Use deep teal for primary actions and emphasis, foreground-black secondary actions, soft shadows instead of borders on pastel surfaces, and rounded 1.5rem corners.
- Restyle the sticky navigation, signed state, payment reminder, FAQs, and final action area so they belong to the same system.
- Add restrained staggered fade-ins and hover lift where appropriate, respecting reduced-motion preferences.
- Keep the embedded CEO video prominent and preserve print/download output.

## 2. Agreement page
- Replace the generic centred card with a branded signing layout using a soft pastel header, readable terms panel, clear acceptance summary, and a distinct consent row.
- Keep all 18 terms, checkbox requirements, signature recording, error handling, and navigation unchanged.
- Make the agreement action visually clear on desktop and mobile without making legal copy harder to scan.

## 3. £0 authorisation page
- Match the same ClassClown shell, typography, soft surfaces, and action styling.
- Keep the “£0.00 Authorization” notice first and visually prominent above cardholder and Stripe fields.
- Preserve Stripe setup, recipient details, loading/error states, completion behaviour, and security copy.

## 4. Responsive and quality checks
- Ensure the layout becomes a clean single column on mobile, with stable buttons, readable tables/cards, and no overlapping sticky controls.
- Check unsigned, signed, agreement, and payment states in the browser at desktop and mobile widths.
- Verify the build, console, payment-step rendering, signing flow presentation, print styling, and reduced-motion behaviour.

## Technical notes
- Primary files: `src/components/proposals/ProposalLayout.tsx`, `AgreementStep.tsx`, and `PaymentCaptureStep.tsx`.
- Reuse the existing Plus Jakarta Sans/Inter fonts, deep-teal tokens, pastel palette, soft radii, and shadow tokens already defined in the project.
- No database, proposal schema, Supabase function, Stripe, route, pricing, contract, or legal-content changes.
