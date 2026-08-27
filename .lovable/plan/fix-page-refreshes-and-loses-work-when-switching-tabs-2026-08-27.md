# Fix: page "refreshes" and loses work when switching tabs

## What's actually happening

Returning to the tab doesn't reload the browser — the app re-mounts its screens, which wipes anything typed. Three confirmed causes:

1. **The React Query cache is recreated on every render.** In `src/App.tsx` the query client is created inside the component (`const queryClient = new QueryClient()`), so any App re-render throws away all cached data and every screen refetches from scratch. It also uses the library default `refetchOnWindowFocus: true`, so simply focusing the tab refires every query on the page.

2. **Auth re-emits `SIGNED_IN` when the tab regains focus.** Supabase refreshes the session on focus and fires the event again. `src/contexts/AuthContext.tsx` reacts by setting `loading = true` and re-running the whole profile/role fetch — route guards then swap the page for a loading state, unmounting forms and dialogs, and a "Signed in successfully" toast pops up again.

3. **Live lesson alert refetches on every focus/visibility change.** `src/hooks/useLiveLessonAlert.ts` listens to `visibilitychange`, `focus`, and `TOKEN_REFRESHED`/`SIGNED_IN`, firing a lesson query each time. Not destructive on its own, but it adds to the churn and can pop the lesson dialog over what you were typing.

## The fix

1. **App.tsx** — move the query client to a module-level singleton (or `useState` initializer) and give it sane defaults: `refetchOnWindowFocus: false`, a short `staleTime` (e.g. 30s), and `retry: 1`. This alone stops the mass refetch/flicker on tab return.

2. **AuthContext.tsx** — only run the heavy `fetchUserData` + `loading = true` path when the user actually changes. Track the last hydrated user id in a ref: if `SIGNED_IN` arrives for the same user already loaded, just update the session/user objects and skip the reload and the toast. `TOKEN_REFRESHED` keeps updating the session silently (already the case).

3. **useLiveLessonAlert.ts** — drop the duplicate `focus` listener (keep `visibilitychange`), ignore `TOKEN_REFRESHED`, and throttle refetches to at most once every ~60s so a quick tab switch does nothing.

4. **Sanity check** — `useAppVersion` reloads the page on a version mismatch. That's intended behaviour, not focus-related, so it stays as is.

## Notes

- No backend, schema, or business-logic changes; all four touches are client-side lifecycle fixes.
- Verification: open a page with a form (e.g. calendar filters or a proposal form), type into it, switch tabs and back — text and dialog state should persist with no loading flash and no sign-in toast.
