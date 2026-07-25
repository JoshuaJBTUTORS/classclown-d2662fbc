## Goal
Serve the Self-Employed Tutor Agreement PDF from a public URL, no signed URLs, no edge function.

## Steps
1. Flip `tutor-documents` bucket to public via `supabase--storage_update_bucket`. If the workspace blocks public buckets, surface the error and ask you to enable public buckets in Settings → Privacy & Security.
2. Update `src/pages/OfferView.tsx` so the contract download button links directly to:
   `https://sjxbxkpegcnnfjbsxazo.supabase.co/storage/v1/object/public/tutor-documents/self-employed-tutor-agreement.pdf`
   Remove the loading state and the edge-function URL entirely — the button becomes an instant `<a href>` link that opens in a new tab, gated by the "I have viewed" checkbox as before.
3. Delete the `tutor-contract` edge function (no longer needed) and remove its entry from `supabase/config.toml`.

## Notes
- Anyone with the URL can access the PDF forever. That's the accepted tradeoff.
- No DB migration needed.
