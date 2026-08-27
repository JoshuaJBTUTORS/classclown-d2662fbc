# Plan: Hand-drawn doodle icons for the sidebar

## Goal
Replace the plain `Dot` icons in `src/components/navigation/Sidebar.tsx` with custom hand-drawn doodle SVG icons that match the existing `DoodleIcons.tsx` style (loose strokes, `strokeWidth: 1.7`, round caps, 24x24 viewBox). Keep the HeyCleo 👋 entry unchanged.

## Approach
The project already has a doodle aesthetic (`src/components/settings/DoodleIcons.tsx`). We extend that same visual language to the sidebar so every nav item gets a unique sketched glyph instead of an anonymous dot.

## Changes
1. **Create `src/components/navigation/SidebarDoodles.tsx`** — a new file exporting one hand-drawn SVG component per sidebar concept, all sharing the `DoodleIcons.tsx` base style (`viewBox 0 0 24 24`, `stroke="currentColor"`, `strokeWidth: 1.7`, round line caps/joins). Doodles to include, mapped to nav items:
   - Calendar (Cleo Calendar)
   - Mortarboard / graduation cap (Cleo Lesson Plans, Students)
   - Notebook with lines (Homework)
   - Clipboard with check (Cleo Assessment Center, Assessment Assignments)
   - Video camera (Cleo Lesson Summaries, Trial Bookings)
   - Person (Clients / My Children)
   - Person + check (Tutors)
   - Person + plus (Staff)
   - Clipboard (Time Off Requests)
   - Speech bubble (Topic Requests)
   - Clock (Time Off)
   - People / gift (Referrals)
   - Document + signature (Lesson Proposals)
   - Film clapperboard (Content Creation)
   - Grid / dashboard (Admin Dashboard)
   - Target (Goals)
   - Signal waves (Live Sessions)
   - Open book (HeyCleo Data, School Progress)
   - Coin (Earnings)
   - Trending line up (Admin Earnings, Progress)
   - Bar chart (Reports)
2. **Update `src/components/navigation/Sidebar.tsx`**:
   - Import the doodle components from `SidebarDoodles.tsx`.
   - Replace each `icon: Dot,` value with the matching doodle component (the `icon: () => <span className="text-xl">👋</span>` HeyCleo entry stays untouched).
   - Remove the now-unused `Dot` component.
3. **Verify** the build is clean via the build-errors log and a visual check of the sidebar.

## Notes
- Doodles inherit `currentColor`, so active/inactive pastel tones apply automatically through the existing `iconWrap` + `tone` classes — no color hardcoding.
- Each doodle is a distinct sketch, giving the sidebar a consistent, intentional, hand-drawn feel that matches the rest of the design language.
