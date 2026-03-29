

## Fix: Sunday GCSE Maths Group — Wrong Time (and possibly wrong tutor)

### What I found

The Sunday "GCSE Maths Group" lesson history:
- **Mar 15** — Scott Renwick, 12:00-13:00 UK ✓
- **Mar 22** — Scott Renwick, 12:00-13:00 UK ✓
- **Mar 29** — **Iulian Dogarescu**, **11:00-12:00 UK** ✗ (1 hour early + different tutor)
- **Apr 5** — Scott Renwick, 12:00-13:00 UK ✓

This lesson wasn't caught by the previous migrations because the tutor changed (Scott → Iulian), so the matching logic (same title + same tutor + same day) couldn't find a last-week counterpart.

### The fix

Use the Supabase insert tool (UPDATE) to shift this single lesson forward by 1 hour:

```sql
UPDATE lessons
SET start_time = start_time + INTERVAL '1 hour',
    end_time = end_time + INTERVAL '1 hour'
WHERE id = '7379bebd-9835-4d39-a8cf-7dde9749ef60';
```

This changes it from 11:00-12:00 UK to **12:00-13:00 UK**, matching every other week.

### Question for you

The tutor is also different — Iulian instead of Scott. Was that an intentional reassignment, or should the tutor also be changed back to Scott?

