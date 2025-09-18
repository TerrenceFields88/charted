-- Add post_type column to posts table to support stories
ALTER TABLE public.posts ADD COLUMN post_type TEXT DEFAULT 'post';

-- Add expires_at column for stories (expires after 24 hours)
ALTER TABLE public.posts ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;

-- Create index for better performance when fetching non-expired stories
CREATE INDEX idx_posts_type_expires ON public.posts(post_type, expires_at) WHERE post_type = 'story';

-- Create function to automatically set expires_at for stories
CREATE OR REPLACE FUNCTION set_story_expiration()
RETURNS TRIGGER AS $$
BEGIN
  -- If it's a story, set expiration to 24 hours from now
  IF NEW.post_type = 'story' THEN
    NEW.expires_at = NOW() + INTERVAL '24 hours';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set story expiration
CREATE TRIGGER trigger_set_story_expiration
  BEFORE INSERT ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION set_story_expiration();