# Staff page: styled create modal, editing, and an Inactive tab

## What changes

1. **Create Admin Account modal redesign** — restyle to the ClassClown design language (rounded pastel surface, black-outlined inputs, pill Cancel / black Create Admin buttons, doodle day chips instead of plain checkboxes). Same fields, same validation, same account-creation behaviour — visual only.

2. **Edit admin staff details** — each staff row gets an Edit action opening a matching dialog where you can update: first name, last name, job title, and working hours / available days. Saving updates the profile and availability, then refreshes the list.

3. **Active / Inactive tabs** — the staff list gets two tabs with counts, mirroring the `/tutors` pattern. Sarah Williams, Angel Torres, Michael Johnson and Pam Mahlangu move to Inactive. The Edit dialog also includes an Active/Inactive toggle so status can be changed later without a database edit.

Ordering stays as-is inside each tab (owner first, then alphabetical by first name).

## Technical notes

- Migration: add nullable `profiles.is_active boolean not null default true`. A data update sets it to `false` for the four named user IDs. Inactive = `is_active = false`; everyone else is Active.
- `AdminList.tsx`: fetch `is_active` alongside the existing profile fields, split into two arrays, render tabs, and add the Edit button per row.
- New `EditAdminDialog.tsx`: loads the profile plus that admin's `admin_availability` rows, writes back with an update to `profiles` and a replace (delete + insert) of the availability rows for that admin.
- `CreateAdminDialog.tsx`: markup/class changes only; the signUp, availability insert, and welcome-email calls are untouched.
- Note: the current list shows two Joshua entries (an `owner` row with no profile name and the `admin` CEO row). That is existing data and is left alone unless you want it merged.
