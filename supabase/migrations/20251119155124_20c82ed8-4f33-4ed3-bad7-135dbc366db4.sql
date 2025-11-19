-- Update Stripe Price IDs to match the correct pricing
UPDATE platform_subscription_plans 
SET 
  stripe_monthly_price_id = 'price_1ST2VIJYNQBAYpmiTg0sLKNt',
  stripe_annual_price_id = 'price_1ST2WMJYNQBAYpmiv1WiReQA',
  updated_at = NOW()
WHERE name = 'Starter';

UPDATE platform_subscription_plans 
SET 
  stripe_monthly_price_id = 'price_1ST2WxJYNQBAYpmiDGp7Tlof',
  stripe_annual_price_id = 'price_1ST2XeJYNQBAYpmiuuOFLAsO',
  updated_at = NOW()
WHERE name = 'Standard';

UPDATE platform_subscription_plans 
SET 
  stripe_monthly_price_id = 'price_1ST2YUJYNQBAYpmie8zUM8K4',
  stripe_annual_price_id = 'price_1ST2Z0JYNQBAYpmisJlDEukL',
  updated_at = NOW()
WHERE name = 'Booster';

UPDATE platform_subscription_plans 
SET 
  stripe_monthly_price_id = 'price_1ST2ZoJYNQBAYpmiWsH2cn6g',
  stripe_annual_price_id = 'price_1ST2aJJYNQBAYpmib2vlJBcX',
  updated_at = NOW()
WHERE name = 'Pro';