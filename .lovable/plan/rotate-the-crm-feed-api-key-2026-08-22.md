# Rotate the CRM feed API key

The current `CRM_FEED_API_KEY` was machine-generated, so its value can never be displayed. To have a key you know, we replace it with one you choose.

## Steps

1. Open the secure secret form for `CRM_FEED_API_KEY` so you can paste a new value (generate a strong one with a password manager, or `openssl rand -hex 32`).
2. The `crm-data-feed` edge function reads the key from the environment at request time, so it picks up the new value with no code change.
3. Give the new key to the other Lovable project and update its stored `x-api-key` value.

## Note

Rotating breaks any existing caller using the old key until it is updated — right now that is only the other project you are setting up.
