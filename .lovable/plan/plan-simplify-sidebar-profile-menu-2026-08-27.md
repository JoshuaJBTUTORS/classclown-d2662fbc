# Plan: Simplify Sidebar Profile Menu

## Goal
Keep only **Profile** and **Logout** in the sidebar profile dropdown menu in `src/components/navigation/SidebarProfile.tsx`.

## Changes
1. Update the lucide-react import to only include `ChevronsUpDown`, `LogOut`, and `User` (remove `HelpCircle` and `Settings`).
2. Remove the `Settings` dropdown item (lines 110-113).
3. Remove the `Help` dropdown item (lines 114-117).
4. Keep the `Profile` item and the `Logout` item as-is.

No other files or logic are affected.
