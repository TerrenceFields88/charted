-- Create brokerage accounts table
CREATE TABLE public.brokerage_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  broker_name TEXT NOT NULL,
  account_id TEXT NOT NULL,
  api_key_encrypted TEXT,
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, broker_name, account_id)
);

-- Create trading performance table
CREATE TABLE public.trading_performance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  brokerage_account_id UUID REFERENCES public.brokerage_accounts(id) ON DELETE CASCADE,
  total_trades INTEGER DEFAULT 0,
  winning_trades INTEGER DEFAULT 0,
  losing_trades INTEGER DEFAULT 0,
  portfolio_value DECIMAL(15,2),
  portfolio_return_percentage DECIMAL(8,4),
  win_rate_percentage DECIMAL(5,2),
  risk_reward_ratio DECIMAL(8,4),
  last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create individual trades table
CREATE TABLE public.trades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  brokerage_account_id UUID REFERENCES public.brokerage_accounts(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  trade_type TEXT NOT NULL CHECK (trade_type IN ('buy', 'sell')),
  quantity DECIMAL(15,8) NOT NULL,
  price DECIMAL(15,8) NOT NULL,
  trade_value DECIMAL(15,2) NOT NULL,
  profit_loss DECIMAL(15,2),
  is_profitable BOOLEAN,
  executed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.brokerage_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for brokerage_accounts
CREATE POLICY "Users can view their own brokerage accounts"
ON public.brokerage_accounts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own brokerage accounts"
ON public.brokerage_accounts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own brokerage accounts"
ON public.brokerage_accounts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own brokerage accounts"
ON public.brokerage_accounts FOR DELETE
USING (auth.uid() = user_id);

-- Create RLS policies for trading_performance
CREATE POLICY "Users can view their own trading performance"
ON public.trading_performance FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trading performance"
ON public.trading_performance FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trading performance"
ON public.trading_performance FOR UPDATE
USING (auth.uid() = user_id);

-- Create RLS policies for trades
CREATE POLICY "Users can view their own trades"
ON public.trades FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trades"
ON public.trades FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trades"
ON public.trades FOR UPDATE
USING (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_brokerage_accounts_updated_at
BEFORE UPDATE ON public.brokerage_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trading_performance_updated_at
BEFORE UPDATE ON public.trading_performance
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trades_updated_at
BEFORE UPDATE ON public.trades
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to calculate trading performance
CREATE OR REPLACE FUNCTION public.calculate_trading_performance(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_total_trades INTEGER;
  v_winning_trades INTEGER;
  v_losing_trades INTEGER;
  v_win_rate DECIMAL(5,2);
  v_avg_profit DECIMAL(15,2);
  v_avg_loss DECIMAL(15,2);
  v_risk_reward_ratio DECIMAL(8,4);
  v_total_pnl DECIMAL(15,2);
  v_portfolio_return DECIMAL(8,4);
BEGIN
  -- Calculate trade statistics
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE is_profitable = true),
    COUNT(*) FILTER (WHERE is_profitable = false),
    SUM(profit_loss)
  INTO v_total_trades, v_winning_trades, v_losing_trades, v_total_pnl
  FROM trades 
  WHERE user_id = p_user_id 
    AND profit_loss IS NOT NULL;

  -- Calculate win rate
  v_win_rate := CASE 
    WHEN v_total_trades > 0 THEN (v_winning_trades::DECIMAL / v_total_trades::DECIMAL) * 100
    ELSE 0 
  END;

  -- Calculate average profit and loss
  SELECT 
    AVG(profit_loss) FILTER (WHERE is_profitable = true),
    ABS(AVG(profit_loss)) FILTER (WHERE is_profitable = false)
  INTO v_avg_profit, v_avg_loss
  FROM trades 
  WHERE user_id = p_user_id 
    AND profit_loss IS NOT NULL;

  -- Calculate risk/reward ratio
  v_risk_reward_ratio := CASE 
    WHEN v_avg_loss > 0 THEN v_avg_profit / v_avg_loss
    ELSE 0 
  END;

  -- Calculate portfolio return (simplified as total PnL percentage)
  v_portfolio_return := CASE 
    WHEN v_total_pnl IS NOT NULL THEN v_total_pnl / 10000 -- Assuming $10,000 base
    ELSE 0 
  END;

  -- Insert or update trading performance
  INSERT INTO trading_performance (
    user_id,
    total_trades,
    winning_trades,
    losing_trades,
    portfolio_return_percentage,
    win_rate_percentage,
    risk_reward_ratio,
    last_calculated_at
  )
  VALUES (
    p_user_id,
    v_total_trades,
    v_winning_trades,
    v_losing_trades,
    v_portfolio_return,
    v_win_rate,
    v_risk_reward_ratio,
    now()
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    total_trades = EXCLUDED.total_trades,
    winning_trades = EXCLUDED.winning_trades,
    losing_trades = EXCLUDED.losing_trades,
    portfolio_return_percentage = EXCLUDED.portfolio_return_percentage,
    win_rate_percentage = EXCLUDED.win_rate_percentage,
    risk_reward_ratio = EXCLUDED.risk_reward_ratio,
    last_calculated_at = EXCLUDED.last_calculated_at,
    updated_at = now();
END;
$$;

-- Add unique constraint to trading_performance
ALTER TABLE public.trading_performance ADD CONSTRAINT unique_user_performance UNIQUE (user_id);