## Fix contract PDF opening on Lovable preview domain

The contract link uses the asset pointer's relative `url` (`/__l5e/assets-v1/...`), so it opens on whatever origin the tutor is currently browsing (e.g. the Lovable preview URL). It should always open on the production domain.

### Change
In `src/pages/OfferView.tsx`, build an absolute URL for the contract link:

```ts
const contractUrl = `https://classclown.io${contractAsset.url}`;
```

Use `contractUrl` in the `<a href=...>` for the "Open / Download Contract" button instead of `contractAsset.url`.

No other logic changes — the viewed-tracking and checkbox gating stay as-is.