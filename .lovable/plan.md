# Remove Top Nav, Move Profile Menu into Sidebar Footer

## What changes

1. **Top navigation bar removed** from every page that renders it (28 pages, e.g. Calendar, Students, Lesson Summaries, Assessment Center, Progress, Settings). The page content shifts up to fill the space.

2. **Profile menu moves to the bottom-left of the sidebar**, pinned below the last group ("Analytics & Insights"). It shows the same avatar initials, name, and role badge as today, and opens the same dropdown: Profile, Settings, Help, Logout.

3. **Styled in the ClassClown design language**: pastel-tinted rounded pill row, soft avatar circle, Plus Jakarta Sans name / Inter role line, a small pastel role chip, and a rounded soft-shadow dropdown with pill menu rows. No hard-coded greens or greys — semantic pastel tokens only.

4. **Mobile menu button preserved**: the hamburger currently lives in the top nav. A small floating rounded pill button appears top-left on mobile only, to open the sidebar. Desktop is unaffected.

5. The decorative (non-functional) search field and the bell icon from the top nav are dropped, since the bar itself is going.

## Technical notes

- New `src/components/navigation/SidebarProfile.tsx` holds the avatar + dropdown, reusing `useAuth()` (`user`, `profile`, `userRole`, `signOut`) exactly as `Navbar.tsx` does today.
- `Sidebar.tsx`: render `<SidebarProfile />` in a bottom footer block after the scrollable group list (`mt-auto`, top hairline border), so it sits under "Analytics & Insights".
- Remove the `<Navbar … />` element and its import from each page that uses it; delete `src/components/navigation/Navbar.tsx`. Existing `toggleSidebar` state stays where it drives the mobile sidebar.
- Add the mobile-only sidebar trigger inside each page's layout wrapper via a small shared `MobileMenuButton` component so we don't duplicate markup.
- No auth, routing, or data logic changes.
