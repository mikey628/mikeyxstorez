-- Add tier_prices to products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS tier_prices jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Add reseller_tier to applications
ALTER TABLE public.reseller_applications
  ADD COLUMN IF NOT EXISTS reseller_tier text NOT NULL DEFAULT 'basic';

-- Payment methods table
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  method_type text NOT NULL DEFAULT 'qr',
  currency text DEFAULT 'USD',
  qr_url text,
  instructions text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active payment methods"
  ON public.payment_methods FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage payment methods"
  ON public.payment_methods FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_payment_methods_updated_at
  BEFORE UPDATE ON public.payment_methods
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Topup on/off setting
INSERT INTO public.site_settings (key, value)
  VALUES ('topup_enabled', 'true')
  ON CONFLICT (key) DO NOTHING;