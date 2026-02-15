
-- Add duration_prices JSONB column to products for per-duration pricing
-- Format: {"1": 300, "7": 700, "30": 2000}
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS duration_prices jsonb DEFAULT '{}';

-- Backfill existing products: set all durations to current price_points
UPDATE public.products 
SET duration_prices = (
  SELECT jsonb_object_agg(d::text, price_points)
  FROM unnest(duration_days) AS d
)
WHERE duration_prices = '{}' OR duration_prices IS NULL;
