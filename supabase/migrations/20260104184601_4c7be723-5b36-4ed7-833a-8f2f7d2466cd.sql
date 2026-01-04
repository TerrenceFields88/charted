-- Create table for AI trading signals journal
CREATE TABLE public.ai_signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  symbol TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('LONG', 'SHORT')),
  entry_price NUMERIC NOT NULL,
  target_price NUMERIC NOT NULL,
  stop_loss NUMERIC NOT NULL,
  confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH')),
  timeframe TEXT NOT NULL,
  reasoning TEXT,
  key_factors JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost', 'cancelled')),
  actual_exit_price NUMERIC,
  profit_loss_percent NUMERIC,
  notes TEXT,
  signal_source TEXT DEFAULT 'live' CHECK (signal_source IN ('live', 'chart_upload')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  closed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.ai_signals ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own signals" 
ON public.ai_signals 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own signals" 
ON public.ai_signals 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own signals" 
ON public.ai_signals 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own signals" 
ON public.ai_signals 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_ai_signals_user_id ON public.ai_signals(user_id);
CREATE INDEX idx_ai_signals_status ON public.ai_signals(status);
CREATE INDEX idx_ai_signals_created_at ON public.ai_signals(created_at DESC);

-- Create function to update timestamps
CREATE TRIGGER update_ai_signals_updated_at
BEFORE UPDATE ON public.ai_signals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();