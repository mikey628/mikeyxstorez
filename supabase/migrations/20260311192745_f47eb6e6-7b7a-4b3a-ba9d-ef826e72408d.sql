-- Allow topup admins to view topup requests
CREATE POLICY "Topup admins can view topup requests"
ON public.topup_requests
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.topup_admins
    WHERE topup_admins.user_id = auth.uid()
  )
);

-- Allow topup admins to update topup request status
CREATE POLICY "Topup admins can update topup requests status"
ON public.topup_requests
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.topup_admins
    WHERE topup_admins.user_id = auth.uid()
  )
);

-- Enable realtime for topup_requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.topup_requests;