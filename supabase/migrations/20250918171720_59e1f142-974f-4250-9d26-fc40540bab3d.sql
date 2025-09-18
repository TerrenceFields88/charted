-- Add foreign key relationship between posts and profiles
ALTER TABLE public.posts 
ADD CONSTRAINT fk_posts_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;