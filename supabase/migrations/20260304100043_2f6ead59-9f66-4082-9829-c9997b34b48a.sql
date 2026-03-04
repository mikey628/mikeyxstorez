
-- Create topup_requests table
CREATE TABLE public.topup_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  game_uid TEXT NOT NULL,
  product_name TEXT NOT NULL,
  duration_label TEXT NOT NULL,
  amount_paid NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'qr',
  payment_proof_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  fake_score INTEGER DEFAULT 0,
  admin_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.topup_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert topup requests" ON public.topup_requests
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all topup requests" ON public.topup_requests
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update topup requests" ON public.topup_requests
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_topup_requests_updated_at
  BEFORE UPDATE ON public.topup_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create topup_packages table
CREATE TABLE public.topup_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  duration_days INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.topup_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active topup packages" ON public.topup_packages
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage topup packages" ON public.topup_packages
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_topup_packages_updated_at
  BEFORE UPDATE ON public.topup_packages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add payment-proofs and topup-qr storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-proofs', 'payment-proofs', false)
  ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) VALUES ('topup-qr', 'topup-qr', true)
  ON CONFLICT (id) DO NOTHING;

-- Storage policies for payment proofs
CREATE POLICY "Anyone can upload payment proofs" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'payment-proofs');

CREATE POLICY "Admins can view payment proofs" ON storage.objects
  FOR SELECT USING (bucket_id = 'payment-proofs' AND has_role(auth.uid(), 'admin'::app_role));

-- Storage policies for topup QR images (public)
CREATE POLICY "Anyone can view topup qr" ON storage.objects
  FOR SELECT USING (bucket_id = 'topup-qr');

CREATE POLICY "Admins can manage topup qr" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'topup-qr' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update topup qr" ON storage.objects
  FOR UPDATE USING (bucket_id = 'topup-qr' AND has_role(auth.uid(), 'admin'::app_role));

-- Seed default site_settings for topup
INSERT INTO public.site_settings (key, value) VALUES
  ('topup_payment_method', 'qr'),
  ('topup_processing_time', '5-30 minutes'),
  ('topup_qr_url', ''),
  ('require_approval', 'true')
ON CONFLICT DO NOTHING;

-- Seed default topup packages
INSERT INTO public.topup_packages (label, price, duration_days, sort_order) VALUES
  ('Weekly Lite', 50, 3, 1),
  ('Weekly', 100, 7, 2),
  ('Monthly', 300, 30, 3);
