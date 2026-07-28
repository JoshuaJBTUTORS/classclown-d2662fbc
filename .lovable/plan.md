## Fix
In `src/pages/admin/SentOffers.tsx` (line 93), the offer URL uses `window.location.origin`, which resolves to the Lovable preview domain when viewed there.

Change:
```ts
const offerUrl = (o: OfferRow) => `${window.location.origin}/offer/${o.id}/${o.access_token}`;
```
to:
```ts
const offerUrl = (o: OfferRow) => `https://classclowncrm.com/offer/${o.id}/${o.access_token}`;
```

This makes both the "Copy link" and "Open link" (external icon) actions always point to the production domain, matching the URL that's already sent in the tutor offer email.

No other changes required.
