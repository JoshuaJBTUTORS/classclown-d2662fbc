## Goal
On the tutor offer page (`/offer/:offerId/:token`), require the tutor to view both the offer letter and the attached Self-Employed Online Tutor Agreement before they can sign.

## Steps

1. **Upload the contract PDF as a Lovable Asset**
   - Upload `/mnt/user-uploads/Self_Employed_Online_Tutor_Agreement_Formatted.pdf` via `lovable-assets create` → write pointer to `src/assets/self-employed-tutor-agreement.pdf.asset.json`.

2. **Update `src/pages/OfferView.tsx`**
   - Add a new "Contract" card between the offer body and the acceptance card, showing:
     - Title: "Self-Employed Online Tutor Agreement"
     - Short blurb explaining they must read the full contract before signing
     - A "View / Download Contract" button linking to the CDN URL (opens in new tab)
     - An inline embedded PDF preview (`<iframe>` of the CDN URL) so they can read it in-page
   - Track two viewed flags in state: `offerLetterViewed` (auto true once the offer page is loaded / after scrolling — simplest: default true since the letter is on the page) and `contractViewed` (set true when they click the View Contract button OR after the iframe has been visible).
   - Add two checkboxes in the acceptance card:
     - "I have read the offer letter above"
     - "I have read the Self-Employed Online Tutor Agreement"
   - The second checkbox is disabled until `contractViewed` is true (i.e. they've opened/downloaded the PDF at least once).
   - Disable the "Sign & Accept Offer" button until both checkboxes are ticked (in addition to existing name + signature validations).

3. **No backend / DB changes** — the contract text is static and stored as a CDN asset; signature record already exists in `tutor_offer_signatures`. Optionally extend `agreement_text` / add a note that the signed contract version = the asset filename, but not required for this pass.

## Out of scope
- Storing per-tutor signed copies of the contract PDF
- Versioning the contract
- Emailing the signed contract back to the tutor (can add later if wanted)
