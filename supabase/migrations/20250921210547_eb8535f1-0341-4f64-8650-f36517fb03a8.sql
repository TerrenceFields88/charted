-- Update RLS policies to require authentication for better security

-- Update profiles table policy to require authentication
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Authenticated users can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Update follows table policy to require authentication  
DROP POLICY IF EXISTS "Users can view all follows" ON public.follows;
CREATE POLICY "Authenticated users can view all follows" 
ON public.follows 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Update likes table policy to require authentication
DROP POLICY IF EXISTS "Users can view all likes" ON public.likes;
CREATE POLICY "Authenticated users can view all likes" 
ON public.likes 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Update comments table policy to require authentication
DROP POLICY IF EXISTS "Users can view all comments" ON public.comments;
CREATE POLICY "Authenticated users can view all comments" 
ON public.comments 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Update posts table policy to require authentication
DROP POLICY IF EXISTS "Users can view all posts" ON public.posts;
CREATE POLICY "Authenticated users can view all posts" 
ON public.posts 
FOR SELECT 
USING (auth.role() = 'authenticated');