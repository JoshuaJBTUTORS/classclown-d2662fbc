# Send Tutor Offer Letter

Mirror the lesson-proposal flow for tutor offer letters: an admin/owner clicks **Send Offer** on the Tutors page, fills a short form (name, email, position, hourly rate, start date, min hours/week), the system emails a personalized offer link, and the tutor signs it online. Signed offers are stored and viewable in admin.

## User flow

1. Tutors page → new **Send Offer** button (top-right, owner/admin only) AND a per-row "Send Offer" action.
2. Dialog opens prefilled (if launched from a row) with:
   - Recipient name, recipient email, phone (optional)
   - Position (default "Tutor")
   - Hourly rate (£), start date, min hours per week (default 15)
   - Optional custom intro paragraph
3. Submit → edge function creates an `offer_letter` row + access token, sends a branded email with a link `/offer/:id/:token` (and `/o/:id/:token` alias).
4. Tutor opens the link → public OfferView page rendering the letter (same aesthetic as the uploaded PDF), reads it, types full name, draws signature, clicks Accept.
5. Signature stored → status → `signed`, signed timestamp + IP + user agent captured.
6. Admin can browse all offers at `/admin/offers` and view a signed copy at `/admin/offers/:id/view`.

## Data model (new tables)

- `tutor_offers`
  - tutor_id (nullable — may not yet exist in `tutors` table), created_by, recipient_name, recipient_email, recipient_phone
  - position, hourly_rate, start_date, min_hours_per_week, custom_intro
  - access_token (uuid), status (`sent` | `viewed` | `signed` | `declined`)
  - sent_at, viewed_at, signed_at, document_ref (5-block reference like the PDF)
- `tutor_offer_signatures`
  - offer_id, signer_name, signer_email, signature_data (base64 PNG), ip_address, user_agent, signed_at

RLS: admin/owner full access; public read via access_token (edge function or scoped policy keyed by token); insert into signatures allowed only when matching valid token.

## Edge functions (new)

- `create-tutor-offer` — auth check (admin/owner), insert offer row, invoke send email.
- `send-tutor-offer-email` — renders React Email template (clone of proposal-email styling, copy adapted to offer letter), sends via Resend from `enquiries@classbeyondacademy.io`. Optional WhatsApp via existing `whatsappService` if phone supplied.
- `sign-tutor-offer` — validates token, stores signature, updates status to `signed`.

## Frontend files

- `src/pages/Tutors.tsx` — add **Send Offer** button + per-row action → opens `SendOfferDialog`.
- `src/components/tutors/SendOfferDialog.tsx` (new) — form + submit, calls `create-tutor-offer`.
- `src/pages/OfferView.tsx` (new, public) — renders the offer letter visual (gradient cover page + details page styled to match PDF), signature pad (`react-signature-canvas` already in repo if available, otherwise install), Accept flow, success state showing certificate of signature.
- `src/pages/admin/TutorOffers.tsx` (new) — list of all offers with status badges, resend, view.
- `src/pages/admin/ViewTutorOffer.tsx` (new) — read-only signed view with certificate block.
- Routes added to `src/App.tsx`: `/offer/:id/:token`, `/o/:id/:token`, `/admin/offers`, `/admin/offers/:id/view`.
- Sidebar entry under admin: "Tutor Offers".

## Offer letter content (matches uploaded PDF)

```text
Position: {position}
Salary:   £{hourly_rate} per hour
Start:    {start_date}
"To confirm your acceptance of this offer to provide services as a
self-employed contractor, please sign and return this offer letter
before your start date. This engagement includes a minimum
expectation of {min_hours_per_week} hours per week."
```

Cover page heading "OFFER LETTER" + "Prepared for: {recipient_name}". Acceptance page: typed-name + drawn signature, generates `document_ref` like `XXXXX-XXXXX-XXXXX-XXXXX`.

## Out of scope (ask if needed)

- PDF generation/download of signed offer (can be added later).
- Auto-creating a `tutors` record on signature (currently the offer is independent of the tutor record).
