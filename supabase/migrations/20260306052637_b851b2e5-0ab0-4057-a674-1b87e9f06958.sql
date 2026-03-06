
-- Add topup_servers table for server selection
CREATE TABLE public.topup_servers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  flag text DEFAULT '🌐',
  logo_url text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.topup_servers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage topup servers"
  ON public.topup_servers
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active topup servers"
  ON public.topup_servers
  FOR SELECT
  USING (is_active = true);

-- Add image_url to topup_packages
ALTER TABLE public.topup_packages ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.topup_packages ADD COLUMN IF NOT EXISTS description text;

-- Add server_id to topup_requests
ALTER TABLE public.topup_requests ADD COLUMN IF NOT EXISTS server_id uuid REFERENCES public.topup_servers(id) ON DELETE SET NULL;
ALTER TABLE public.topup_requests ADD COLUMN IF NOT EXISTS server_name text;
ALTER TABLE public.topup_requests ADD COLUMN IF NOT EXISTS game_name text DEFAULT 'Unknown';

-- Add topup_admin to user roles (create function to check topup admin)
-- We'll use site_settings to store topup admin emails as a simple approach
-- Insert 3 QR code settings
INSERT INTO public.site_settings (key, value) VALUES 
  ('esewa_qr_url', NULL),
  ('khalti_qr_url', NULL),
  ('bank_qr_url', NULL),
  ('topup_notification_email', 'asminchy79@gmail.com')
ON CONFLICT (key) DO NOTHING;

-- Add topup_admins table for separate topup admin management
CREATE TABLE public.topup_admins (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  email text NOT NULL,
  added_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.topup_admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Main admins can manage topup admins"
  ON public.topup_admins
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Topup admins can view own record"
  ON public.topup_admins
  FOR SELECT
  USING (user_id = auth.uid());
