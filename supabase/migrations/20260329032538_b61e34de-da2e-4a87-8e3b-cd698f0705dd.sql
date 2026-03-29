-- Fix Sunday GCSE Maths Group lesson (Mar 29) - shift from 11:00 to 12:00 UK
UPDATE lessons
SET start_time = start_time + INTERVAL '1 hour',
    end_time = end_time + INTERVAL '1 hour'
WHERE id = '7379bebd-9835-4d39-a8cf-7dde9749ef60';