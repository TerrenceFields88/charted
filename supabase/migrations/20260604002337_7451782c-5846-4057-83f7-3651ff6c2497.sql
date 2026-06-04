
CREATE TABLE public.chart_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  symbol TEXT,
  timeframe TEXT,
  image_url TEXT,
  bias TEXT NOT NULL,
  setup_name TEXT,
  trend TEXT,
  pattern TEXT,
  support_levels JSONB NOT NULL DEFAULT '[]'::jsonb,
  resistance_levels JSONB NOT NULL DEFAULT '[]'::jsonb,
  entry_price NUMERIC,
  stop_loss NUMERIC,
  target_price NUMERIC,
  risk_reward NUMERIC,
  confidence INTEGER NOT NULL DEFAULT 50,
  timeframe_outlook TEXT,
  key_observations JSONB NOT NULL DEFAULT '[]'::jsonb,
  risks JSONB NOT NULL DEFAULT '[]'::jsonb,
  summary TEXT,
  raw_response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.chart_analyses TO authenticated;
GRANT ALL ON public.chart_analyses TO service_role;

ALTER TABLE public.chart_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own chart analyses" ON public.chart_analyses
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own chart analyses" ON public.chart_analyses
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own chart analyses" ON public.chart_analyses
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own chart analyses" ON public.chart_analyses
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER trg_chart_analyses_updated_at
  BEFORE UPDATE ON public.chart_analyses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_chart_analyses_user_created ON public.chart_analyses(user_id, created_at DESC);
