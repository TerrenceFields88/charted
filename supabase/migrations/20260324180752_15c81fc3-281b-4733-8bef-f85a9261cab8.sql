-- Restrict brokerage_accounts SELECT to only return non-sensitive columns via RLS
-- Remove the current permissive SELECT policy and replace with one that hides encrypted fields
-- Actually, RLS can't filter columns - instead restrict to authenticated only
-- The encrypted fields are already only readable by the owning user via RLS

-- Fix follows, likes, comments: restrict SELECT to authenticated users
DROP POLICY IF EXISTS "Anyone can view follows" ON public.follows;
CREATE POLICY "Authenticated users can view follows"
ON public.follows FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "Anyone can view likes" ON public.likes;
CREATE POLICY "Authenticated users can view likes"
ON public.likes FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "Anyone can view comments" ON public.comments;
CREATE POLICY "Authenticated users can view comments"
ON public.comments FOR SELECT TO authenticated
USING (true);

-- Restrict brokerage_accounts: change all policies to authenticated role
DROP POLICY IF EXISTS "Users can view their own brokerage accounts" ON public.brokerage_accounts;
CREATE POLICY "Users can view their own brokerage accounts"
ON public.brokerage_accounts FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own brokerage accounts" ON public.brokerage_accounts;
CREATE POLICY "Users can create their own brokerage accounts"
ON public.brokerage_accounts FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own brokerage accounts" ON public.brokerage_accounts;
CREATE POLICY "Users can update their own brokerage accounts"
ON public.brokerage_accounts FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own brokerage accounts" ON public.brokerage_accounts;
CREATE POLICY "Users can delete their own brokerage accounts"
ON public.brokerage_accounts FOR DELETE TO authenticated
USING (auth.uid() = user_id);