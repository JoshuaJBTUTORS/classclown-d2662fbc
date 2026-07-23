## Move tutor contract PDF to Supabase Storage

### Why
The contract is currently a Lovable Asset (`/__l5e/assets-v1/...`). That path only resolves on Lovable-hosted domains. When a tutor views the offer on `classclown.io` (not a connected Lovable custom domain), the PDF 404s. Supabase Storage serves the file from a stable absolute URL that works from any origin.

### Steps

1. **Create a public Supabase storage bucket** `tutor-documents` (private buckets require signed URLs and would need per-view generation — overkill for a contract we want linkable).

2. **Upload the PDF** `Self_Employed_Online_Tutor_Agreement_Formatted.pdf` to `tutor-documents/self-employed-tutor-agreement.pdf`. This gives a permanent public URL:
   `https://sjxbxkpegcnnfjbsxazo.supabase.co/storage/v1/object/public/tutor-documents/self-employed-tutor-agreement.pdf`

3. **Update `src/pages/OfferView.tsx`:**
   - Remove the `contractAsset` import from `@/assets/self-employed-tutor-agreement.pdf.asset.json`.
   - Replace the `<a href={...}>` value with the Supabase public URL (as a constant at top of file).
   - Keep the `setContractViewed(true)` click handler and gating checkbox behaviour unchanged.

4. **Delete the old Lovable Asset pointer** `src/assets/self-employed-tutor-agreement.pdf.asset.json` and its CDN copy via `lovable-assets delete`.

### Result
Contract link opens correctly on `classclown.io`, `classclowncrm.com`, `jbtutors.classclowncrm.com`, the preview URL, and any future domain — no code changes needed per environment.