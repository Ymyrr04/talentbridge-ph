DROP POLICY "Client inserts own job posts" ON public.job_posts;
CREATE POLICY "Client or admin inserts own job posts" ON public.job_posts FOR INSERT TO authenticated
WITH CHECK (owner_id = auth.uid() AND (public.has_role(auth.uid(),'client') OR public.has_role(auth.uid(),'admin')));