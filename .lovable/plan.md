

## Make phone number required on Review Room form

Small change to the contact step on `/review-room`.

### Changes to `src/pages/ReviewRoom.tsx`

1. **Label**: Change `Phone (recommended for WhatsApp updates)` → `Phone *` with helper text underneath: *"We'll send WhatsApp updates and your session link to this number."*
2. **Input**: Add `required` attribute to the phone input.
3. **Submit validation**: Update the `handleSubmit` guard to also check `contact.phone`:
   ```ts
   if (!contact.parent_name || !contact.child_name || !contact.email || !contact.phone) {
     toast.error('Please fill in all required fields');
     return;
   }
   ```

No other files affected. No DB / edge function changes needed (phone is already passed through).

