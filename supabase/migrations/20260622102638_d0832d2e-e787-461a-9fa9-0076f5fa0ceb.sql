CREATE TABLE public.results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  b_value INT NOT NULL,
  shade_name TEXT NOT NULL,
  hex TEXT NOT NULL,
  analysis TEXT NOT NULL,
  free_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.results TO anon, authenticated;
GRANT ALL ON public.results TO service_role;
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view results" ON public.results FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can submit results" ON public.results FOR INSERT TO anon, authenticated WITH CHECK (true);