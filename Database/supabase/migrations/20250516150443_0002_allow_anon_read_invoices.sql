CREATE POLICY "Allow anonymous read access to invoices for testing"
ON public.invoices
FOR SELECT
TO anon
USING (true);
