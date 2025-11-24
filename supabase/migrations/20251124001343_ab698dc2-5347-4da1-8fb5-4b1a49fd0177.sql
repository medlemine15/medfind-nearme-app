-- Add RLS policies for drugs table to allow pharmacies to manage their own drugs

-- Policy for pharmacies to view their own drugs
CREATE POLICY "Pharmacies can view their own drugs"
  ON public.drugs
  FOR SELECT
  USING (auth.uid() = pharmacy_id);

-- Policy for pharmacies to insert their own drugs
CREATE POLICY "Pharmacies can insert their own drugs"
  ON public.drugs
  FOR INSERT
  WITH CHECK (auth.uid() = pharmacy_id);

-- Policy for pharmacies to update their own drugs
CREATE POLICY "Pharmacies can update their own drugs"
  ON public.drugs
  FOR UPDATE
  USING (auth.uid() = pharmacy_id);

-- Policy for pharmacies to delete their own drugs
CREATE POLICY "Pharmacies can delete their own drugs"
  ON public.drugs
  FOR DELETE
  USING (auth.uid() = pharmacy_id);