-- Add recipient_phone column to lesson_proposals table
ALTER TABLE lesson_proposals 
ADD COLUMN recipient_phone TEXT;

COMMENT ON COLUMN lesson_proposals.recipient_phone IS 'Recipient phone number in international format (e.g., +447123456789)';
