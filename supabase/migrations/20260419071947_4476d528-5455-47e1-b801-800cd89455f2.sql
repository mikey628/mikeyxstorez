-- Allow any authenticated user to view unused keys so stock counts work on Products page.
-- Used keys remain visible only to their owner (existing policy covers that).
CREATE POLICY "Anyone authenticated can view unused keys"
ON public.keys
FOR SELECT
TO authenticated
USING (is_used = false);