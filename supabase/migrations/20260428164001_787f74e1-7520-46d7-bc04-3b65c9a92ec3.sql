
-- 1. Restrict comments/likes/follows policies to authenticated role
DROP POLICY IF EXISTS "Users can create own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can update own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;

CREATE POLICY "Users can create own comments" ON public.comments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON public.comments
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.comments
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own likes" ON public.likes;
DROP POLICY IF EXISTS "Users can delete own likes" ON public.likes;

CREATE POLICY "Users can create own likes" ON public.likes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own likes" ON public.likes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own follows" ON public.follows;
DROP POLICY IF EXISTS "Users can delete own follows" ON public.follows;

CREATE POLICY "Users can create own follows" ON public.follows
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can delete own follows" ON public.follows
  FOR DELETE TO authenticated USING (auth.uid() = follower_id);

-- 2. Replace counter RPCs with triggers (auto-maintain counts)
CREATE OR REPLACE FUNCTION public.handle_like_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_comment_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS likes_count_trigger ON public.likes;
CREATE TRIGGER likes_count_trigger
AFTER INSERT OR DELETE ON public.likes
FOR EACH ROW EXECUTE FUNCTION public.handle_like_count();

DROP TRIGGER IF EXISTS comments_count_trigger ON public.comments;
CREATE TRIGGER comments_count_trigger
AFTER INSERT OR DELETE ON public.comments
FOR EACH ROW EXECUTE FUNCTION public.handle_comment_count();

-- 3. Add ownership checks to existing RPCs (defense-in-depth) and revoke public execute
CREATE OR REPLACE FUNCTION public.increment_post_likes(post_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM likes WHERE likes.post_id = increment_post_likes.post_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Not permitted';
  END IF;
  -- No-op: trigger now maintains count
END;
$$;

CREATE OR REPLACE FUNCTION public.decrement_post_likes(post_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- No-op: trigger now maintains count on DELETE from likes
  RETURN;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_post_comments(post_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM comments WHERE comments.post_id = increment_post_comments.post_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Not permitted';
  END IF;
  -- No-op: trigger now maintains count
END;
$$;

-- Revoke EXECUTE on internal helper functions from anon/authenticated
REVOKE EXECUTE ON FUNCTION public.sanitize_content(text) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.log_security_event(uuid, text, text, uuid, jsonb) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.calculate_trading_performance(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.decrypt_credential(text, text) FROM anon, authenticated, public;
