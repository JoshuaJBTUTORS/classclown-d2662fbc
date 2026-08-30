# Replace calendar loading state with waving hand

## What
Replace the current calendar loading block (a dashed pastel-sky box reading "Loading your week…") with the shared `LoadingHand` component.

## Where
- `src/components/calendar/CalendarDisplay.tsx` lines 170-176 — the `isLoading` branch inside the calendar container.

## Change
1. Add `import LoadingHand from '@/components/ui/loading-hand';` to `CalendarDisplay.tsx`.
2. Replace the loading block:
   ```tsx
   <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/70 backdrop-blur-sm">
     <div className="rounded-[var(--radius-soft)] border-2 border-dashed border-pastel-sky bg-pastel-sky/40 px-8 py-6 text-center">
       <p className="font-heading text-base font-semibold text-pastel-sky-foreground">Loading your week…</p>
       <p className="mt-1 text-xs text-muted-foreground">Fetching lessons and tutor availability</p>
     </div>
   </div>
   ```
   with:
   ```tsx
   <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/70 backdrop-blur-sm">
     <LoadingHand text="Loading your week…" />
   </div>
   ```
3. The `TeacherCalendarView` loading state (also passed `isLoading`) will be checked and updated if it has its own inline spinner.

## Validation
- `tsgo --noEmit` typecheck.
- Build check via the build log.
- No logic, props, handlers, or permissions change.
