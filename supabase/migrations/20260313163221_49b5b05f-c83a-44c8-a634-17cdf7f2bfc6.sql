
-- Create topup_games table for game-based product management
CREATE TABLE IF NOT EXISTS public.topup_games (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  image_url text,
  emoji text DEFAULT '🎮',
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.topup_games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage topup games"
  ON public.topup_games FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active topup games"
  ON public.topup_games FOR SELECT
  USING (is_active = true);

-- Add game_id reference and extras to topup_packages
ALTER TABLE public.topup_packages
  ADD COLUMN IF NOT EXISTS game_id uuid REFERENCES public.topup_games(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS diamonds integer,
  ADD COLUMN IF NOT EXISTS emoji text DEFAULT '💎';

-- Create chat_sessions table
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  user_email text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chat sessions"
  ON public.chat_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create chat sessions"
  ON public.chat_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all chat sessions"
  ON public.chat_sessions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  sender_role text NOT NULL DEFAULT 'user',
  sender_id uuid,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in own sessions"
  ON public.chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_sessions
      WHERE id = chat_messages.session_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages in own sessions"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_sessions
      WHERE id = chat_messages.session_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all messages"
  ON public.chat_messages FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_sessions;

-- Site settings for chat
INSERT INTO public.site_settings (key, value)
VALUES
  ('chat_welcome_message', 'Welcome! 👋 How can we help you today?'),
  ('chat_response_time', '5-15 minutes'),
  ('chat_enabled', 'true')
ON CONFLICT (key) DO NOTHING;
