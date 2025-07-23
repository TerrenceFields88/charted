-- Add security constraints and validation functions
-- Content length constraints
ALTER TABLE posts ADD CONSTRAINT content_length_check CHECK (char_length(content) BETWEEN 1 AND 2000);
ALTER TABLE posts ADD CONSTRAINT prediction_text_length_check CHECK (prediction_text IS NULL OR char_length(prediction_text) BETWEEN 1 AND 500);

ALTER TABLE profiles ADD CONSTRAINT username_length_check CHECK (char_length(username) BETWEEN 1 AND 50);
ALTER TABLE profiles ADD CONSTRAINT display_name_length_check CHECK (display_name IS NULL OR char_length(display_name) BETWEEN 1 AND 100);
ALTER TABLE profiles ADD CONSTRAINT bio_length_check CHECK (bio IS NULL OR char_length(bio) BETWEEN 1 AND 500);

ALTER TABLE comments ADD CONSTRAINT comment_content_length_check CHECK (char_length(content) BETWEEN 1 AND 1000);

ALTER TABLE communities ADD CONSTRAINT community_name_length_check CHECK (char_length(name) BETWEEN 1 AND 100);
ALTER TABLE communities ADD CONSTRAINT community_description_length_check CHECK (description IS NULL OR char_length(description) BETWEEN 1 AND 1000);

-- Add validation for usernames (alphanumeric and underscores only)
ALTER TABLE profiles ADD CONSTRAINT username_format_check CHECK (username ~ '^[a-zA-Z0-9_]+$');

-- Add constraints for prediction confidence
ALTER TABLE posts ADD CONSTRAINT prediction_confidence_range_check CHECK (prediction_confidence IS NULL OR (prediction_confidence >= 0 AND prediction_confidence <= 100));

-- Create audit log table for security monitoring
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on audit logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only allow viewing audit logs for admin users (for now, just allow users to see their own)
CREATE POLICY "Users can view their own audit logs" 
ON public.audit_logs 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create function to sanitize and validate content
CREATE OR REPLACE FUNCTION public.sanitize_content(content TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Remove potential script tags and dangerous content
  content := regexp_replace(content, '<script[^>]*>.*?</script>', '', 'gi');
  content := regexp_replace(content, '<iframe[^>]*>.*?</iframe>', '', 'gi');
  content := regexp_replace(content, 'javascript:', '', 'gi');
  content := regexp_replace(content, 'vbscript:', '', 'gi');
  content := regexp_replace(content, 'onload=', '', 'gi');
  content := regexp_replace(content, 'onerror=', '', 'gi');
  content := regexp_replace(content, 'onclick=', '', 'gi');
  
  -- Trim whitespace
  content := trim(content);
  
  RETURN content;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to sanitize content before insert/update
CREATE OR REPLACE FUNCTION public.sanitize_post_content()
RETURNS TRIGGER AS $$
BEGIN
  NEW.content := public.sanitize_content(NEW.content);
  IF NEW.prediction_text IS NOT NULL THEN
    NEW.prediction_text := public.sanitize_content(NEW.prediction_text);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER sanitize_posts_trigger
  BEFORE INSERT OR UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.sanitize_post_content();

-- Create trigger to sanitize profile content
CREATE OR REPLACE FUNCTION public.sanitize_profile_content()
RETURNS TRIGGER AS $$
BEGIN
  NEW.username := lower(trim(NEW.username));
  IF NEW.display_name IS NOT NULL THEN
    NEW.display_name := public.sanitize_content(NEW.display_name);
  END IF;
  IF NEW.bio IS NOT NULL THEN
    NEW.bio := public.sanitize_content(NEW.bio);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER sanitize_profiles_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.sanitize_profile_content();

-- Create trigger to sanitize comment content
CREATE OR REPLACE FUNCTION public.sanitize_comment_content()
RETURNS TRIGGER AS $$
BEGIN
  NEW.content := public.sanitize_content(NEW.content);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER sanitize_comments_trigger
  BEFORE INSERT OR UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.sanitize_comment_content();