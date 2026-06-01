-- ============================================
-- CHARTED AI — Foundation: AI Coach + Trader DNA
-- ============================================

-- Trader DNA: AI-classified archetype + behavioral profile per user
CREATE TABLE public.trader_dna (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  archetype TEXT NOT NULL DEFAULT 'Unclassified',
  archetype_confidence INTEGER NOT NULL DEFAULT 0 CHECK (archetype_confidence BETWEEN 0 AND 100),
  strengths JSONB NOT NULL DEFAULT '[]'::jsonb,
  weaknesses JSONB NOT NULL DEFAULT '[]'::jsonb,
  biases JSONB NOT NULL DEFAULT '[]'::jsonb,
  best_session TEXT,
  worst_session TEXT,
  recommended_strategies JSONB NOT NULL DEFAULT '[]'::jsonb,
  summary TEXT,
  last_calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.trader_dna TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trader_dna TO authenticated;
GRANT ALL ON public.trader_dna TO service_role;

ALTER TABLE public.trader_dna ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trader DNA is publicly viewable"
ON public.trader_dna FOR SELECT USING (true);

CREATE POLICY "Users can manage own DNA"
ON public.trader_dna FOR ALL
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_trader_dna_updated_at
BEFORE UPDATE ON public.trader_dna
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- AI Coach Reports: weekly + ad-hoc performance reviews
CREATE TABLE public.ai_coach_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  report_type TEXT NOT NULL DEFAULT 'weekly' CHECK (report_type IN ('daily','weekly','monthly','adhoc')),
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  headline TEXT NOT NULL,
  summary TEXT NOT NULL,
  strengths JSONB NOT NULL DEFAULT '[]'::jsonb,
  mistakes JSONB NOT NULL DEFAULT '[]'::jsonb,
  emotional_insights JSONB NOT NULL DEFAULT '[]'::jsonb,
  focus_tasks JSONB NOT NULL DEFAULT '[]'::jsonb,
  discipline_score INTEGER CHECK (discipline_score BETWEEN 0 AND 100),
  consistency_score INTEGER CHECK (consistency_score BETWEEN 0 AND 100),
  risk_mgmt_score INTEGER CHECK (risk_mgmt_score BETWEEN 0 AND 100),
  overall_rating INTEGER CHECK (overall_rating BETWEEN 0 AND 100),
  tier TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_coach_reports TO authenticated;
GRANT ALL ON public.ai_coach_reports TO service_role;

ALTER TABLE public.ai_coach_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own coach reports"
ON public.ai_coach_reports FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users insert own coach reports"
ON public.ai_coach_reports FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own coach reports"
ON public.ai_coach_reports FOR DELETE
USING (auth.uid() = user_id);

CREATE INDEX idx_ai_coach_reports_user_created ON public.ai_coach_reports(user_id, created_at DESC);