-- Create table to store Google Calendar OAuth tokens for users
CREATE TABLE public.google_calendar_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table to store cheques in database
CREATE TABLE public.cheques (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  cheque_number TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  payee_name TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'cleared', 'bounced')),
  branch TEXT NOT NULL,
  notes TEXT,
  reminder_date DATE,
  is_holiday_adjusted BOOLEAN DEFAULT FALSE,
  holiday_skipped TEXT[],
  google_event_id TEXT,
  synced_to_calendar BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.google_calendar_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cheques ENABLE ROW LEVEL SECURITY;

-- RLS policies for google_calendar_tokens
CREATE POLICY "Users can view their own tokens" 
ON public.google_calendar_tokens 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tokens" 
ON public.google_calendar_tokens 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tokens" 
ON public.google_calendar_tokens 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tokens" 
ON public.google_calendar_tokens 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS policies for cheques
CREATE POLICY "Users can view their own cheques" 
ON public.cheques 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own cheques" 
ON public.cheques 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cheques" 
ON public.cheques 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cheques" 
ON public.cheques 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_google_calendar_tokens_updated_at
BEFORE UPDATE ON public.google_calendar_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cheques_updated_at
BEFORE UPDATE ON public.cheques
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();