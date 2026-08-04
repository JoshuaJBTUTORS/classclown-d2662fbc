CREATE OR REPLACE VIEW public.stripe_customer_expansion
WITH (security_invoker = true) AS
WITH deduped AS (
  SELECT
    stripe_customer_id,
    month,
    MAX(amount) AS amount,
    MAX(currency) AS currency,
    MAX(customer_email) AS customer_email,
    MAX(customer_name) AS customer_name
  FROM public.stripe_customer_monthly_revenue
  GROUP BY stripe_customer_id, month
),
bounds AS (
  SELECT
    stripe_customer_id,
    MIN(month) AS first_month,
    (SELECT MAX(month) FROM deduped) AS last_month
  FROM deduped
  GROUP BY stripe_customer_id
),
series AS (
  SELECT
    b.stripe_customer_id,
    b.first_month,
    gs.month::date AS month
  FROM bounds b
  CROSS JOIN LATERAL generate_series(b.first_month, b.last_month, interval '1 month') AS gs(month)
),
filled AS (
  SELECT
    s.stripe_customer_id,
    s.month,
    s.first_month,
    COALESCE(d.amount, 0)::numeric AS amount,
    d.currency,
    d.customer_email,
    d.customer_name
  FROM series s
  LEFT JOIN deduped d
    ON d.stripe_customer_id = s.stripe_customer_id
   AND d.month = s.month
),
meta AS (
  SELECT DISTINCT ON (stripe_customer_id)
    stripe_customer_id,
    customer_email,
    customer_name,
    currency
  FROM deduped
  ORDER BY stripe_customer_id, month DESC
),
windowed AS (
  SELECT
    f.stripe_customer_id,
    f.month,
    f.first_month,
    f.amount AS current_mrr,
    COALESCE(LAG(f.amount) OVER (PARTITION BY f.stripe_customer_id ORDER BY f.month), 0)::numeric AS previous_mrr,
    FIRST_VALUE(f.amount) OVER (PARTITION BY f.stripe_customer_id ORDER BY f.month) AS starting_mrr
  FROM filled f
)
SELECT
  w.stripe_customer_id,
  m.customer_email,
  m.customer_name,
  COALESCE(m.currency, 'gbp') AS currency,
  w.month,
  w.first_month AS joined_month,
  w.starting_mrr,
  w.previous_mrr,
  w.current_mrr,
  GREATEST(w.current_mrr - w.previous_mrr, 0) AS expansion_mrr,
  GREATEST(w.previous_mrr - w.current_mrr, 0) AS contraction_mrr,
  (w.current_mrr - w.starting_mrr) AS cumulative_expansion
FROM windowed w
JOIN meta m ON m.stripe_customer_id = w.stripe_customer_id;

GRANT SELECT ON public.stripe_customer_expansion TO authenticated;
GRANT SELECT ON public.stripe_customer_expansion TO service_role;