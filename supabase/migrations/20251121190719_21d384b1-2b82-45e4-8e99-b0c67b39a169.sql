-- Update subscription plan prices to correct values
-- Starter: £9.99 monthly, £18.36 yearly (was £10.00, £18.36)
UPDATE platform_subscription_plans 
SET price_monthly_pence = 999, price_annual_pence = 11988
WHERE name = 'Starter';

-- Standard: £19.99 monthly, £39.99 yearly (was £20.00, £37.74)
UPDATE platform_subscription_plans 
SET price_monthly_pence = 1999, price_annual_pence = 23988
WHERE name = 'Standard';

-- Booster: £45.00 monthly, £450.00 yearly (was £50.00, £510.00)
UPDATE platform_subscription_plans 
SET price_monthly_pence = 4500, price_annual_pence = 54000
WHERE name = 'Booster';

-- Pro: £98.00 monthly, £980.00 yearly (was £100.00, £1020.00)
UPDATE platform_subscription_plans 
SET price_monthly_pence = 9800, price_annual_pence = 117600
WHERE name = 'Pro';