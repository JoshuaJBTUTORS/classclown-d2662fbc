## Goal

Delete the in-app HeyCleo learning-hub experience (pages, routes, supporting components/context/hooks/services) and the Cleo-only edge functions. **Keep** the two integrations that are used by the sister Lovable project:

- `supabase/functions/generate-heycleo-token` (SSO sign-in)
- `supabase/functions/heycleo-homework-webhook` (homework sync)
- `src/services/heyCleoRedirectService.ts` (used by Sidebar / VideoConferenceLink to open HeyCleo)

## Changes in `src/App.tsx`

Remove imports and routes for:

- `LearningHub`, `LearningHubLayout`, `LearningHubDashboard`, `LearningHubCleo`, `LearningHubMyCourses`, `LearningHubSettings`, `LearningHubRevision`, `LearningHubAssessments`, `LearningHubCleoID`, `CleoDemo`
- `LearningHubProvider` wrapper
- `HubAccessGuard`, `OnboardingGuard`, `OnboardingWizard` (only used by these routes — verify then remove)
- The `/heycleo`, `/heycleo/*`, `/heycleo/onboarding`, `/cleo-demo`, and `/learning-hub/*` redirect routes

Any route pointing to HeyCleo from within the app will 404 (NotFound), which is fine since external HeyCleo SSO still works via `heyCleoRedirectService`.

## Files to delete

Pages:
- `src/pages/LearningHub.tsx`
- `src/pages/LearningHubDashboard.tsx`
- `src/pages/LearningHubCleo.tsx`
- `src/pages/LearningHubMyCourses.tsx`
- `src/pages/LearningHubSettings.tsx`
- `src/pages/LearningHubRevision.tsx`
- `src/pages/LearningHubAssessments.tsx`
- `src/pages/LearningHubCleoID.tsx`
- `src/pages/LearningHubEntry.tsx`
- `src/pages/CleoDemo.tsx`
- `src/pages/OnboardingWizard.tsx` (only used by removed route)

Supporting code (only referenced by the removed pages):
- `src/components/learningHub/` (entire folder)
- `src/contexts/LearningHubContext.tsx`
- `src/components/routing/HubAccessGuard.tsx`
- `src/components/routing/OnboardingGuard.tsx`

Edge functions to delete (call `supabase--delete_edge_functions`):
- `cleo-chat`
- `cleo-realtime-session-token`
- `cleo-realtime-voice`
- `cleo-text-chat`
- `ai-mark-cleo-question`

Also delete their local source folders under `supabase/functions/`.

## Kept (do NOT remove)

- `supabase/functions/generate-heycleo-token`
- `supabase/functions/heycleo-homework-webhook`
- `src/services/heyCleoRedirectService.ts` and its callers in `Sidebar.tsx` / `VideoConferenceLink.tsx`
- The `heycleo-export/` folder (it's a standalone export, not wired into the app)

## Verification

After deletion:
1. `rg` for imports of every removed file to catch stragglers and fix them (typically by removing the import/usage).
2. Rely on the automatic typecheck/build to confirm nothing else referenced the removed modules.
