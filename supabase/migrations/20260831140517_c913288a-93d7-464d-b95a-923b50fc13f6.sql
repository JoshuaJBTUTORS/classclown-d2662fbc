ALTER TABLE public.lesson_proposals DROP CONSTRAINT lesson_proposals_contract_term_check;
ALTER TABLE public.lesson_proposals ADD CONSTRAINT lesson_proposals_contract_term_check
  CHECK (contract_term IN ('month_to_month','3_months','12_months','24_months'));