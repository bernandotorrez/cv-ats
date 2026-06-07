DROP POLICY IF EXISTS "Admins manage user subscriptions" ON public.user_subscriptions;

CREATE POLICY "Admins manage user subscriptions"
  ON public.user_subscriptions
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
