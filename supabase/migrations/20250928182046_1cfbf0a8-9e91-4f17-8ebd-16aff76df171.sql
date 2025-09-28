-- Allow public viewing of app content while requiring authentication for actions

-- Update profiles table to allow public viewing
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;
CREATE POLICY "Anyone can view profiles" 
ON public.profiles 
FOR SELECT 
USING (true);

-- Update follows table to allow public viewing
DROP POLICY IF EXISTS "Authenticated users can view all follows" ON public.follows;
CREATE POLICY "Anyone can view follows" 
ON public.follows 
FOR SELECT 
USING (true);

-- Update likes table to allow public viewing
DROP POLICY IF EXISTS "Authenticated users can view all likes" ON public.likes;
CREATE POLICY "Anyone can view likes" 
ON public.likes 
FOR SELECT 
USING (true);

-- Update comments table to allow public viewing
DROP POLICY IF EXISTS "Authenticated users can view all comments" ON public.comments;
CREATE POLICY "Anyone can view comments" 
ON public.comments 
FOR SELECT 
USING (true);

-- Update posts table to allow public viewing
DROP POLICY IF EXISTS "Authenticated users can view all posts" ON public.posts;
CREATE POLICY "Anyone can view posts" 
ON public.posts 
FOR SELECT 
USING (true);