
-- PREDICTIONS
CREATE TABLE public.predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  symbol TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('long','short')),
  entry_price NUMERIC,
  target_price NUMERIC,
  stop_loss NUMERIC,
  confidence INTEGER NOT NULL DEFAULT 50 CHECK (confidence BETWEEN 1 AND 100),
  timeframe TEXT NOT NULL DEFAULT '1d',
  thesis TEXT,
  chart_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','correct','wrong','expired','cancelled')),
  resolved_price NUMERIC,
  resolved_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  agree_count INTEGER NOT NULL DEFAULT 0,
  disagree_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.predictions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.predictions TO authenticated;
GRANT ALL ON public.predictions TO service_role;

ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Predictions are publicly viewable" ON public.predictions FOR SELECT USING (true);
CREATE POLICY "Users create own predictions" ON public.predictions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own predictions" ON public.predictions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own predictions" ON public.predictions FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_predictions_user_created ON public.predictions(user_id, created_at DESC);
CREATE INDEX idx_predictions_status ON public.predictions(status);
CREATE INDEX idx_predictions_symbol ON public.predictions(symbol);

CREATE TRIGGER trg_predictions_updated_at
BEFORE UPDATE ON public.predictions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- TRADER SCORES
CREATE TABLE public.trader_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  total_predictions INTEGER NOT NULL DEFAULT 0,
  correct_predictions INTEGER NOT NULL DEFAULT 0,
  wrong_predictions INTEGER NOT NULL DEFAULT 0,
  pending_predictions INTEGER NOT NULL DEFAULT 0,
  accuracy_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  best_streak INTEGER NOT NULL DEFAULT 0,
  reputation_points INTEGER NOT NULL DEFAULT 0,
  rank_tier TEXT NOT NULL DEFAULT 'Rookie',
  avg_confidence NUMERIC(5,2) NOT NULL DEFAULT 0,
  last_calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.trader_scores TO anon;
GRANT SELECT ON public.trader_scores TO authenticated;
GRANT ALL ON public.trader_scores TO service_role;

ALTER TABLE public.trader_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trader scores are publicly viewable" ON public.trader_scores FOR SELECT USING (true);

CREATE INDEX idx_trader_scores_reputation ON public.trader_scores(reputation_points DESC);
CREATE INDEX idx_trader_scores_accuracy ON public.trader_scores(accuracy_percentage DESC);

CREATE TRIGGER trg_trader_scores_updated_at
BEFORE UPDATE ON public.trader_scores
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- PREDICTION VOTES
CREATE TABLE public.prediction_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id UUID NOT NULL REFERENCES public.predictions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  vote TEXT NOT NULL CHECK (vote IN ('agree','disagree')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (prediction_id, user_id)
);

GRANT SELECT ON public.prediction_votes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prediction_votes TO authenticated;
GRANT ALL ON public.prediction_votes TO service_role;

ALTER TABLE public.prediction_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Votes are publicly viewable" ON public.prediction_votes FOR SELECT USING (true);
CREATE POLICY "Users create own votes" ON public.prediction_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own votes" ON public.prediction_votes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own votes" ON public.prediction_votes FOR DELETE USING (auth.uid() = user_id);

-- Vote count maintenance
CREATE OR REPLACE FUNCTION public.handle_prediction_vote()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.vote = 'agree' THEN UPDATE predictions SET agree_count = agree_count + 1 WHERE id = NEW.prediction_id;
    ELSE UPDATE predictions SET disagree_count = disagree_count + 1 WHERE id = NEW.prediction_id; END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.vote = 'agree' THEN UPDATE predictions SET agree_count = GREATEST(agree_count - 1, 0) WHERE id = OLD.prediction_id;
    ELSE UPDATE predictions SET disagree_count = GREATEST(disagree_count - 1, 0) WHERE id = OLD.prediction_id; END IF;
  ELSIF TG_OP = 'UPDATE' AND OLD.vote IS DISTINCT FROM NEW.vote THEN
    IF NEW.vote = 'agree' THEN
      UPDATE predictions SET agree_count = agree_count + 1, disagree_count = GREATEST(disagree_count - 1, 0) WHERE id = NEW.prediction_id;
    ELSE
      UPDATE predictions SET disagree_count = disagree_count + 1, agree_count = GREATEST(agree_count - 1, 0) WHERE id = NEW.prediction_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_prediction_vote_count
AFTER INSERT OR UPDATE OR DELETE ON public.prediction_votes
FOR EACH ROW EXECUTE FUNCTION public.handle_prediction_vote();

-- Trader score recalculation
CREATE OR REPLACE FUNCTION public.recalculate_trader_score(p_user_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_total INT; v_correct INT; v_wrong INT; v_pending INT;
  v_accuracy NUMERIC; v_avg_conf NUMERIC; v_streak INT := 0; v_best INT := 0;
  v_points INT; v_tier TEXT; v_cur INT := 0; rec RECORD;
BEGIN
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status='correct'),
    COUNT(*) FILTER (WHERE status='wrong'),
    COUNT(*) FILTER (WHERE status='open'),
    COALESCE(AVG(confidence),0)
  INTO v_total, v_correct, v_wrong, v_pending, v_avg_conf
  FROM predictions WHERE user_id = p_user_id;

  v_accuracy := CASE WHEN (v_correct + v_wrong) > 0
    THEN (v_correct::NUMERIC / (v_correct + v_wrong)) * 100 ELSE 0 END;

  -- streaks from resolved predictions ordered by resolved_at
  FOR rec IN
    SELECT status FROM predictions
    WHERE user_id = p_user_id AND status IN ('correct','wrong')
    ORDER BY resolved_at ASC NULLS LAST
  LOOP
    IF rec.status = 'correct' THEN v_cur := v_cur + 1;
      IF v_cur > v_best THEN v_best := v_cur; END IF;
    ELSE v_cur := 0; END IF;
  END LOOP;
  v_streak := v_cur;

  v_points := (v_correct * 10) - (v_wrong * 3) + (v_best * 5);
  v_tier := CASE
    WHEN v_points >= 5000 AND v_accuracy >= 70 THEN 'Legend'
    WHEN v_points >= 2000 AND v_accuracy >= 60 THEN 'Elite'
    WHEN v_points >= 500 AND v_accuracy >= 55 THEN 'Pro'
    WHEN v_points >= 100 THEN 'Veteran'
    WHEN v_total >= 5 THEN 'Trader'
    ELSE 'Rookie' END;

  INSERT INTO trader_scores (user_id, total_predictions, correct_predictions, wrong_predictions,
    pending_predictions, accuracy_percentage, current_streak, best_streak, reputation_points,
    rank_tier, avg_confidence, last_calculated_at)
  VALUES (p_user_id, v_total, v_correct, v_wrong, v_pending, v_accuracy, v_streak, v_best,
    GREATEST(v_points, 0), v_tier, v_avg_conf, now())
  ON CONFLICT (user_id) DO UPDATE SET
    total_predictions = EXCLUDED.total_predictions,
    correct_predictions = EXCLUDED.correct_predictions,
    wrong_predictions = EXCLUDED.wrong_predictions,
    pending_predictions = EXCLUDED.pending_predictions,
    accuracy_percentage = EXCLUDED.accuracy_percentage,
    current_streak = EXCLUDED.current_streak,
    best_streak = EXCLUDED.best_streak,
    reputation_points = EXCLUDED.reputation_points,
    rank_tier = EXCLUDED.rank_tier,
    avg_confidence = EXCLUDED.avg_confidence,
    last_calculated_at = now(),
    updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_prediction_status_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    PERFORM public.recalculate_trader_score(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_predictions_score_recalc
AFTER INSERT OR UPDATE OF status ON public.predictions
FOR EACH ROW EXECUTE FUNCTION public.trg_prediction_status_change();
