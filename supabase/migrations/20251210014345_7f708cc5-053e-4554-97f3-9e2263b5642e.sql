-- Add RLS policy for pharmacy registration
CREATE POLICY "Users can insert pharmacies"
ON public.pharmacies
FOR INSERT
WITH CHECK (true);

-- Add policy for pharmacies to update their own records
CREATE POLICY "Pharmacies can update their own record"
ON public.pharmacies
FOR UPDATE
USING (auth.uid() = user_id);