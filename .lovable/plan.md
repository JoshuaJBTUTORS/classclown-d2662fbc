

## Fix: Shift 12 Cover Lessons Forward by 1 Hour (Mar 30 – Apr 5)

### What we're doing

Applying +1 hour to only the 12 cover lessons that are exactly 1 hour early. The 2 lessons needing +2h and the 2 needing -1h are left untouched.

### The 12 lessons

| Day | Lesson | Cover Tutor | Now → Should be |
|-----|--------|-------------|-----------------|
| Mon 30 | KS3 Maths Group | Iulian Dogarescu | 17:00 → 18:00 |
| Wed 1 | KS3 Maths Group | Fariha Muhith | 17:00 → 18:00 |
| Wed 1 | Year 11 Maths Foundation | Fariha Muhith | 18:00 → 19:00 |
| Wed 1 | GCSE Physics Group | Daniel Alake | 18:00 → 19:00 |
| Wed 1 | 1-1 A-Level Biology | Daniel Alake | 19:00 → 20:00 |
| Thu 2 | 1-1 GCSE Maths | Riya Moncy | 17:00 → 18:00 |
| Thu 2 | 1-1 Year 11 Combined Science | Scott Renwick | 17:00 → 18:00 |
| Fri 3 | 11 Plus VR Group | Abdul Zazai | 16:00 → 17:00 |
| Fri 3 | 11 Plus VR Group | Scott Renwick | 18:00 → 19:00 |
| Sat 4 | Year 11 English Group | Scott Renwick | 09:00 → 10:00 |
| Sat 4 | 1-1 A-Level Economics | Scott Renwick | 13:00 → 14:00 |
| Sat 4 | KS2 English Group | Charlie Pickford | 13:00 → 14:00 |

### The fix

Single UPDATE via the Supabase insert tool:

```sql
UPDATE lessons
SET start_time = start_time + INTERVAL '1 hour',
    end_time = end_time + INTERVAL '1 hour'
WHERE id IN (
  '49e4d686-aed9-4a1d-b4dd-1f3e82a53edd',
  'cde83b28-89ef-4708-aaa0-d189e0525367',
  '2965f2c3-6320-47c5-87ba-9b1bde9f49d0',
  '100e9512-0d91-413e-ad30-916b4e851491',
  '9bbd44f9-bd58-4767-bb06-106cea2464c4',
  '0368d92f-687d-48a0-b4d8-744760bd6aff',
  'ed6db702-8e99-4198-b86d-af05780980bf',
  '558f8c4b-3afc-4f3c-883f-ff525540ff6a',
  '003b53c6-4886-4785-9579-0257a82c41de',
  '807fab1f-759b-4b60-89cf-c75cbc7aeb10',
  'abcb6284-b26b-4eab-b878-5835343b82d8',
  '96b80e21-ef75-4a2d-b26e-f86d7997885b'
);
```

The +2h and -1h lessons are **not touched**.

