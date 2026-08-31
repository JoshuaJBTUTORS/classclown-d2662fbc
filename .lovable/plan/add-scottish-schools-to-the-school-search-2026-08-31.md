# Add Scottish schools to the school search

The `/welcome` school picker currently searches 27,003 schools (England/Wales data). The two uploaded spreadsheets add Scotland.

## What gets added

- **Publicly funded Scottish schools (open at 31 Jan 2026)** — 2,427 rows from the "Open Schools" sheet.
- **Registered independent Scottish schools (Aug 2026 register)** — 84 rows from the "Registered independent Schools" sheet.

Closed schools, renamed-school history and proposed schools sheets are ignored.

## Field mapping

| Existing column | Publicly funded sheet | Independent register |
| --- | --- | --- |
| urn | Seed Code | SEED Code |
| name | School Name | Name of School |
| town | Address Line2 (or Line3 if blank) | town parsed from Address |
| postcode | Post Code | postcode parsed from Address |
| local_authority | LA Name | (blank) |
| phase | derived from Primary/Secondary/Special department flags | Primary / Secondary education |
| establishment_type | Centre Type | "Independent school" |

Scottish SEED codes are 7 digits (1000047+) and the existing table tops out at 402491, so there are no ID clashes. The load is idempotent (skip/update on existing `urn`), so re-running is safe.

## Technical notes

- One-off data load into `public.uk_schools` via a batched insert; no schema change, no new columns, no RLS change.
- `SchoolCombobox.tsx` is unchanged — it already searches name/town/postcode against this table, so the Scottish schools become searchable immediately.
- After the load the table should hold roughly 29,500 schools; I will verify the count and spot-check a few Scottish names.
