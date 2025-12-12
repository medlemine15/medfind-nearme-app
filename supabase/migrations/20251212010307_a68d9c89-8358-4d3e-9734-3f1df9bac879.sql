-- Create medicines table
CREATE TABLE public.medicines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  dosage TEXT,
  form TEXT,
  price FLOAT8,
  quantity INT4 DEFAULT 0,
  pharmacy_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view medicines"
ON public.medicines
FOR SELECT
USING (true);

CREATE POLICY "Pharmacies can insert their own medicines"
ON public.medicines
FOR INSERT
WITH CHECK (auth.uid() = pharmacy_id);

CREATE POLICY "Pharmacies can update their own medicines"
ON public.medicines
FOR UPDATE
USING (auth.uid() = pharmacy_id);

CREATE POLICY "Pharmacies can delete their own medicines"
ON public.medicines
FOR DELETE
USING (auth.uid() = pharmacy_id);

-- Add trigger for updated_at
CREATE TRIGGER update_medicines_updated_at
BEFORE UPDATE ON public.medicines
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();