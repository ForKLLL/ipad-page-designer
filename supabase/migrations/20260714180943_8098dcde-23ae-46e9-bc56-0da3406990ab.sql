
DROP POLICY IF EXISTS "Anyone can submit results" ON public.results;

CREATE POLICY "Anyone can submit valid results"
ON public.results
FOR INSERT
TO anon, authenticated
WITH CHECK (
  b_value BETWEEN 0 AND 100
  AND char_length(shade_name) BETWEEN 1 AND 40
  AND hex ~ '^#[0-9A-Fa-f]{6}$'
  AND char_length(analysis) BETWEEN 1 AND 4000
  AND (free_text IS NULL OR char_length(free_text) <= 500)
);
