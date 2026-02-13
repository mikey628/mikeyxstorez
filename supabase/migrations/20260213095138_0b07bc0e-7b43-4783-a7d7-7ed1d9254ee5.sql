
-- Add is_approved column to profiles for login approval system
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_approved boolean NOT NULL DEFAULT false;

-- Add photo_url to profiles for profile section
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS photo_url text;

-- Add duration_days to products for key duration selection
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS duration_days integer[] DEFAULT '{30}';

-- Add file_url to products for downloadable files
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS file_url text;

-- Create storage bucket for product files
INSERT INTO storage.buckets (id, name, public) VALUES ('product-files', 'product-files', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for user avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for product-files
CREATE POLICY "Anyone can view product files"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-files');

CREATE POLICY "Admins can upload product files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-files' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete product files"
ON storage.objects FOR DELETE
USING (bucket_id = 'product-files' AND public.has_role(auth.uid(), 'admin'));

-- Storage policies for avatars
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add selected_duration to keys table (how many days the key is valid for)
ALTER TABLE public.keys ADD COLUMN IF NOT EXISTS duration_days integer DEFAULT 30;

-- Auto-approve admin accounts (set existing admin to approved)
UPDATE public.profiles SET is_approved = true WHERE user_id IN (SELECT user_id FROM public.user_roles WHERE role = 'admin');
