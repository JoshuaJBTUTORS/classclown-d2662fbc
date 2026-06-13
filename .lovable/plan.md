## Sent Offers View

Add an admin page to view and manage all tutor offer letters that have been sent.

### New page: `src/pages/SentOffers.tsx`
Route: `/admin/sent-offers` (added to `src/App.tsx`)

Fetches all rows from `tutor_offers` ordered by `created_at desc` and displays them in a table with:
- Recipient name + email
- Position
- Hourly rate
- Start date
- Status badge (sent / viewed / signed) with colors
- Sent date
- Signed date (when applicable)
- Actions: **Copy link** (copies `/offer/:id/:token`), **Open** (opens the offer page in a new tab), **Resend email** (re-invokes the `send-tutor-offer` edge function)

### Entry point
On `src/pages/Tutors.tsx`, add a "View Sent Offers" button next to the existing "Send Offer" button, linking to `/admin/sent-offers`.

### Filtering / UX
- Search box (filters by name/email)
- Status filter dropdown (All / Sent / Viewed / Signed)
- Summary chips at top: totals per status

No database or edge-function changes needed — the `tutor_offers` table and RLS already exist.
