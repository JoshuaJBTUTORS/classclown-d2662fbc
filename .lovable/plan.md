# Generator-created mismatches only (manual moves excluded)

I re-ran the scan and kept only rows that were **created by the cron generator** (created at ~01:00 UTC in a generation batch) and **never touched since** (no later edit). Anything you or the team moved/reassigned by hand is excluded. That reduces the earlier 42 rows to **28**.

## A. Wrong weekday — 1-1 GCSE Maths (series `ebc41dba…`)
Expected: **Monday 20:00, Iulian Dogarescu**. Generated as **Thursday 20:00, Lyba Samar**.

| Date (UK) | Lesson ID |
|---|---|
| Thu 20 Aug 20:00 | 10bc07cd-6517-4681-bc9e-ca3e3220a337 |
| Thu 27 Aug 20:00 | 72faf76e-9404-49ea-b13b-1fd5665c7f62 |
| Thu 03 Sep 20:00 | 4ce35e65-7ee2-400e-919d-6c51783b5f0e |
| Thu 10 Sep 20:00 | 1e2401c6-cca1-47ba-8118-2554cec24db6 |
| Thu 17 Sep 20:00 | d682fdd8-8d85-44e7-9459-1d7da91d90de |
| Thu 24 Sep 20:00 | 647dd9fb-22f1-4d3a-b577-c727d0f3fc1b |
| Thu 01 Oct 20:00 | 48828972-787a-40b9-9601-50b418ab2d0d |
| Thu 08 Oct 20:00 | 8a46c161-3637-42f9-898b-ee677018e6fe |
| Thu 15 Oct 20:00 | 5d98a3b8-0cbc-4e4b-a393-d98415aa9392 |
| Thu 22 Oct 20:00 | 9379f177-0455-46d8-bf6c-ab39612afdeb |
| Thu 29 Oct 19:00 (also 1 hr early — DST) | f5e51488-ac0d-414c-8255-9a2ed7dac7f0 |

## B. Wrong tutor — GCSE English Group (series `15163580…`)
Expected: **Wed 19:00, Yolanda Simarga**. Generated with **Scott Renwick**.

- Wed 09 Sep 19:00 — 1d3705ca-6822-4049-871e-256cd7476c23
- Wed 16 Sep 19:00 — f9d308e5-c84f-436d-9300-a143b23f43c6
- Wed 23 Sep 19:00 — 0961f157-93c2-4c6d-a35b-c7dda78cd941
- Wed 30 Sep 19:00 — 37975302-1c4b-41bb-a4f2-e1f928cd2420
- Wed 28 Oct **18:00** (wrong tutor **and** 1 hr early — DST) — 2d7ad1c8-220f-4ef1-ab05-76e0108618eb

## C. DST drift after 25 Oct (correct day/tutor, 1 hour early)
- 1-1 A-Level Maths — Sat 31 Oct 12:00, should be 13:00, Scott Renwick — aa7eb006-2f27-4889-808d-204970028e06
- Jake- 1-1 KS2 Maths/English — Thu 29 Oct 16:00, should be 17:00, Scott Renwick — f5ca39bd-2592-4915-80ef-35d333c1e5db

## D. Low-confidence flag — Jake- 1-1 KS2 Maths/English (series `2ce3c102…`)
10 generated Thursday 17:00 rows (01 Oct → 27 Aug range) flagged on tutor, but both current and expected resolve to **Scott Renwick** — this looks like a duplicate tutor profile, not a real scheduling fault. Time and day are correct, so no action needed unless you want the tutor record de-duplicated.

IDs: 1ad715c8-6cff-4ace-9a99-296b6efb2963, 4e85154c-fd6a-4c4f-bc3d-f13a1ab610c0, 6897eea1-5416-4032-b771-252c678c51d0, f41954e3-f154-4b5c-b9ed-866ce8860241, c392f6f0-0267-40c8-81b8-f7705b9ef160, 37563211-84b6-48d9-a462-854b047b9add, 1a72d854-bbcf-489b-abbc-a1e8ef8b9e79, 29199cc3-dd99-4e09-8a75-ce7916c836d0, 2288d62b-24ef-45b2-a06a-a94b3bb389a5, 9b8ebd69-c4ca-4980-b724-7342eaf5b9b8

## Excluded as manual changes
Rows such as the KS2 Maths Group Wednesdays (12/19 Aug), the 11 Plus Math Group Sundays, the 1-1 GCSE Math Oct rows and the 11 Plus NVR / KS3 Science tutor swaps were edited by a person after generation (updated hours or weeks after creation), so they are treated as intentional and left off this list.

## If you want me to fix rather than list
Optional next step: move A to Monday 20:00 with Iulian, reassign B to Yolanda, and shift the three DST rows forward one hour — all logged to `lesson_deletion_log`/update history.
