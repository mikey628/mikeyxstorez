
-- Reseller applications table
CREATE TABLE public.reseller_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  seller_name TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  tiktok_channel TEXT,
  avg_followers TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.reseller_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create own application" ON public.reseller_applications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own application" ON public.reseller_applications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all applications" ON public.reseller_applications FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_reseller_applications_updated_at BEFORE UPDATE ON public.reseller_applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Reseller products table
CREATE TABLE public.reseller_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price_credits NUMERIC NOT NULL DEFAULT 0,
  duration_days INTEGER[] DEFAULT '{30}'::integer[],
  duration_prices JSONB DEFAULT '{}'::jsonb,
  stock INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.reseller_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage reseller products" ON public.reseller_products FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Approved resellers can view active products" ON public.reseller_products FOR SELECT TO authenticated USING (
  is_active = true AND EXISTS (
    SELECT 1 FROM public.reseller_applications WHERE user_id = auth.uid() AND status = 'approved'
  )
);

CREATE TRIGGER update_reseller_products_updated_at BEFORE UPDATE ON public.reseller_products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Reseller keys table
CREATE TABLE public.reseller_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key_code TEXT NOT NULL,
  product_id UUID NOT NULL REFERENCES public.reseller_products(id) ON DELETE CASCADE,
  duration_days INTEGER DEFAULT 30,
  is_used BOOLEAN NOT NULL DEFAULT false,
  used_by UUID,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.reseller_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage reseller keys" ON public.reseller_keys FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Approved resellers can view own keys" ON public.reseller_keys FOR SELECT TO authenticated USING (used_by = auth.uid());
