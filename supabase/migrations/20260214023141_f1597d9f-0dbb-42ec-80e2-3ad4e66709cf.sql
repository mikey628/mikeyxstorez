
-- Create site_settings table for social links etc
CREATE TABLE public.site_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value text,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view settings" ON public.site_settings
FOR SELECT USING (true);

CREATE POLICY "Admins can manage settings" ON public.site_settings
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default social links
INSERT INTO public.site_settings (key, value) VALUES
  ('whatsapp_link', ''),
  ('tiktok_link', ''),
  ('discord_link', '');
