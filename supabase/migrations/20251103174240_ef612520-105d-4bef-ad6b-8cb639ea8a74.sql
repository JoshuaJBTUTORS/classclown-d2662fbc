
-- Link student account to user for panavnagar123@gmail.com
UPDATE students
SET user_id = '953cfa8d-7dea-4bd6-97b7-e12aabea8627'
WHERE id = 487 
  AND email = 'panavnagar123@gmail.com'
  AND user_id IS NULL;
