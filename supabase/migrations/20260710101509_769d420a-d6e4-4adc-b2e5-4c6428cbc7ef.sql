
CREATE TABLE public.reference_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  content text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.reference_documents TO anon, authenticated;
GRANT ALL ON public.reference_documents TO service_role;

ALTER TABLE public.reference_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active reference documents"
  ON public.reference_documents FOR SELECT
  USING (is_active = true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_reference_documents_updated_at
  BEFORE UPDATE ON public.reference_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
