-- Add chart_symbol field to posts table for TradingView chart integration
ALTER TABLE public.posts ADD COLUMN chart_symbol TEXT;