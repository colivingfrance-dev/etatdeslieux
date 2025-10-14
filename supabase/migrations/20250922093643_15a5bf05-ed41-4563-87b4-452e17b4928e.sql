-- Créer une table pour stocker les PDFs d'état des lieux
CREATE TABLE public.inspection_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inspection_id UUID NOT NULL REFERENCES public.inspections(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  signature_data TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.inspection_reports ENABLE ROW LEVEL SECURITY;

-- Create policies for report access
CREATE POLICY "Les utilisateurs peuvent voir leurs propres rapports" 
ON public.inspection_reports 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.inspections 
  WHERE inspections.id = inspection_reports.inspection_id 
  AND inspections.user_id = auth.uid()
));

CREATE POLICY "Les utilisateurs peuvent créer leurs propres rapports" 
ON public.inspection_reports 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.inspections 
  WHERE inspections.id = inspection_reports.inspection_id 
  AND inspections.user_id = auth.uid()
));

-- Add trigger for timestamps
CREATE TRIGGER update_inspection_reports_updated_at
BEFORE UPDATE ON public.inspection_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();