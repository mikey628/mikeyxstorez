ALTER TABLE public.credit_requests
ADD COLUMN transaction_code text;

CREATE INDEX idx_credit_requests_transaction_code
ON public.credit_requests (transaction_code);