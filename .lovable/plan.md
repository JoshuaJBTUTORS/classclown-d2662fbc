

## Add social proof + scarcity messaging to Review Room page

Three new sections on `/review-room` (Step 1 — session picker view) to build trust and reduce no-shows.

### 1. Parent testimonial quote (above session picker)

A styled quote card with the testimonial:

> *"So happy to see this is back again this year — was a life saver for my son."*
> — Parent, GCSE Review Room

Visual: Premium Teal card with a quotation mark icon, italic serif-feel quote text, attribution underneath.

### 2. "UK Qualified Teachers" hero strip (top of page, above quote)

A short hero band reinforcing credibility:

- **Headline**: "Led by UK Qualified Teachers"
- **Subtext**: "Free GCSE revision sessions delivered by qualified UK teachers — here purely to support your child's exam prep."
- Icon: graduation cap / shield-check (lucide).

### 3. Limited-spaces notice (inside session picker, above the day cards)

An amber/warning callout banner:

> ⚠️ **Limited spaces available** — While these sessions are completely free, please only book if you're sure you can attend. Spaces are first-come, first-served.

Visual: amber/orange `Alert` component with `AlertTriangle` icon, sits directly above the 4 day cards so users see it before ticking boxes.

### File to change

- `src/pages/ReviewRoom.tsx` — add the three sections in Step 1 of the flow. Step 2 (contact form) untouched.

No new components, no DB changes, no edge function changes.

