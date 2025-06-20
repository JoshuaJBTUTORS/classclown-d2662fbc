
-- Grant course access to learninghub@gmail.com for GCSE Biology course
-- User ID: 7876bee5-1d76-4f7b-bab5-99c395e6569b
-- Course ID: 31084174-d6ff-4a3e-b670-cca6256a7f31 (GCSE Biology)
-- Stripe Subscription ID: sub_1Rc1IwJvbqr5stJMFhBUocRq

INSERT INTO public.course_purchases (
  user_id,
  course_id,
  stripe_subscription_id,
  status,
  purchase_date,
  amount_paid,
  currency,
  created_at,
  updated_at
) VALUES (
  '7876bee5-1d76-4f7b-bab5-99c395e6569b',
  '31084174-d6ff-4a3e-b670-cca6256a7f31',
  'sub_1Rc1IwJvbqr5stJMFhBUocRq',
  'trialing',
  now(),
  1299,
  'gbp',
  now(),
  now()
);
