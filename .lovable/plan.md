## Goal
Stop the "Loading contract…" hang by using a single, permanent public URL for the Self-Employed Online Tutor Agreement. No signing, no fetching, no edge function.

## Approach
The contract PDF is the same file for every tutor — there's no reason to gate it behind signed URLs. Make it a plain public link.

## Changes

### 1. Make the `tutor-documents/self-employed-tutor-agreement.pdf` object publicly readable
Add an RLS policy on `storage.objects` that allows anonymous `SELECT` for that one file (bucket stays private otherwise, so other tutor documents aren't exposed):

```sql
CREATE POLICY "Public read of tutor agreement PDF"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'tutor-documents'
  AND name = 'self-employed-tutor-agreement.pdf'
);
```

The public URL is then:
`https://sjxbxkpegcnnfjbsxazo.supabase.co/storage/v1/object/public/tutor-documents/self-employed-tutor-agreement.pdf`

### 2. Simplify `src/pages/OfferView.tsx`
- Delete the entire `useEffect` that calls `createSignedUrl` and the REST fallback.
- Delete `contractUrl` state.
- Hardcode the public URL as a constant and use it directly in the "Open / Download Contract" button's `href`.
- Button is always enabled; label is always "Open / Download Contract" (no more "Loading contract…").
- Keep the existing `contractViewed` / `contractRead` gating for the signature checkbox.

## Verification
- Open any offer link → the Open / Download Contract button is immediately clickable and opens the PDF in a new tab.
- Try a random tutor-documents path in the browser → still 403 (bucket stays private for everything else).
