-- Add dollar price to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS price_usd numeric DEFAULT NULL;

-- Add UID/ID label config to topup_games
ALTER TABLE public.topup_games ADD COLUMN IF NOT EXISTS uid_label text DEFAULT 'Game UID';
ALTER TABLE public.topup_games ADD COLUMN IF NOT EXISTS id_label text DEFAULT 'Player ID';

-- Create topup_history table for saving user selections (even before payment)
CREATE TABLE IF NOT EXISTS public.topup_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  game_name text,
  game_uid text,
  player_name text,
  server_name text,
  package_label text,
  package_price numeric DEFAULT 0,
  payment_method text,
  status text DEFAULT 'draft',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.topup_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own topup history"
  ON public.topup_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own topup history"
  ON public.topup_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own topup history"
  ON public.topup_history FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all topup history"
  ON public.topup_history FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));
