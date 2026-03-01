
CREATE TABLE public.offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'offer',
  price_points INTEGER,
  duration_days INTEGER,
  key_code TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage offers"
  ON public.offers FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active offers"
  ON public.offers FOR SELECT
  USING (is_active = true);

CREATE TRIGGER update_offers_updated_at
  BEFORE UPDATE ON public.offers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO storage.buckets (id, name, public)
VALUES ('logo-media', 'logo-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view logo media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'logo-media');

CREATE POLICY "Admins can manage logo media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'logo-media' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete logo media"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'logo-media' AND has_role(auth.uid(), 'admin'::app_role));
