-- Fix remaining function search path security issues
CREATE OR REPLACE FUNCTION public.increment_post_likes(post_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  UPDATE posts SET like_count = like_count + 1 WHERE id = post_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.decrement_post_likes(post_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  UPDATE posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = post_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.increment_post_comments(post_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  UPDATE posts SET comment_count = comment_count + 1 WHERE id = post_id;
END;
$function$;