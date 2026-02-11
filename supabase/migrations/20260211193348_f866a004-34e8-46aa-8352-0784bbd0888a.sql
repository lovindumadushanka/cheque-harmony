
-- Create branches table
CREATE TABLE public.branches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own branches" ON public.branches FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own branches" ON public.branches FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own branches" ON public.branches FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own branches" ON public.branches FOR UPDATE USING (auth.uid() = user_id);
