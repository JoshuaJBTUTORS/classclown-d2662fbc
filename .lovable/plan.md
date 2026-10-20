# Add St John's Catholic Comprehensive School to the school search

The school isn't in the onboarding school list at the moment. I searched for its name and for the DA12 postcode area and it didn't come up.

## What gets added

One school, which families will then find on the `/welcome` details step:

- Name: St John's Catholic Comprehensive School
- Town: Gravesend
- Postcode: DA12 2JW
- Local authority: Kent
- Phase: Secondary

## Technical notes

- A single one-off insert into `public.uk_schools`. The table, permissions and search box stay as they are.
- `urn`: I'll use the school's official DfE URN if I can confirm it from the GIAS register. If I can't, I'll use a clearly manual ID that can't clash with real ones (for example `MANUAL-DA122JW`), stored in the same column type.
- `ON CONFLICT (urn) DO NOTHING`, so running it twice is safe.
- Check: search "St John's Catholic" and "DA12 2JW" and confirm the school appears.
