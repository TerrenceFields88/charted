-- Add parent_id to comments table for nested replies
ALTER TABLE public.comments ADD COLUMN parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE;