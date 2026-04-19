
-- Add image_url to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Bonus rules table (admin-managed: buy N keys, get M free)
CREATE TABLE IF NOT EXISTS public.bonus_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  min_keys INTEGER NOT NULL,
  free_keys INTEGER NOT NULL,
  product_id UUID NULL,         -- NULL = applies to all products
  is_active BOOLEAN NOT NULL DEFAULT true,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bonus_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active bonus rules"
  ON public.bonus_rules FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage bonus rules"
  ON public.bonus_rules FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_bonus_rules_updated_at
  BEFORE UPDATE ON public.bonus_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage policies for product images bucket (reuse product-files bucket; it's already public)
-- (no change needed - product-files bucket already exists & public)

-- Seed reseller_benefits_text setting (admin-editable)
INSERT INTO public.site_settings (key, value)
VALUES ('reseller_benefits_text', E'💰 Extra Discount on Bulk Purchases\n🔑 Free Keys on Selected Plans\n⚡ Instant Delivery & Fast Access\n🛡️ 100% Safe & Secure System\n📈 High Profit Margin\n🎯 Priority Support for Resellers\n💎 Limited Time Bonus')
ON CONFLICT (key) DO NOTHING;
