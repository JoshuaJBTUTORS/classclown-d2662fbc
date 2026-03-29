
-- Fix 1: 1-1 A-Level Computer Science (Sundays) from 17:00 to 15:00 UK (-2 hours)
UPDATE lessons
SET start_time = start_time - INTERVAL '2 hours',
    end_time = end_time - INTERVAL '2 hours'
WHERE id IN (
  '52cb6b40-8f32-4c21-be8c-d94c816375c9',
  '07cb4ab1-fe2c-4112-91a3-089a403c65f9',
  '4411c3a1-adfc-48f7-8d94-b027e9b2529d',
  '93e86534-d0c1-4aff-b656-4c1de085974a',
  '89cd51f4-3860-4785-bbe2-1da2acb681ed',
  'fd57bbbf-1dd5-486d-bc42-78e018d41411',
  '96330d0d-fe87-4cad-9072-cad919eb21cf',
  'd39050ec-9328-4d31-85f0-7867d82b8377',
  'ba26774f-ee21-456f-b7c5-9726799107ba',
  '01b3d367-187b-43c7-a7c4-5992cbc2d4ee',
  '7687d8d0-8069-4f9f-b566-1c8c85ead6e6',
  '221cfd91-567b-420f-bae8-c864a65a249b',
  '76e71385-bfc4-4c5c-b450-51e2f9a3d525',
  '165c7256-12a4-4105-9d07-93c58a7dd840'
);

-- Fix 2: KS3 Maths Group (Sundays) from 15:00 to 16:00 UK (+1 hour)
UPDATE lessons
SET start_time = start_time + INTERVAL '1 hour',
    end_time = end_time + INTERVAL '1 hour'
WHERE id IN (
  '21278147-60e3-47b1-89d6-9aab847e8144',
  '53bc3463-e6cb-4113-90b3-1c48fe452079',
  '7d3ad596-2208-4c75-87f7-7b9680fd8db5'
);
