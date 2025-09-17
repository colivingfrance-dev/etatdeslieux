-- Créer le bucket pour les photos d'inspection
INSERT INTO storage.buckets (id, name, public) VALUES ('inspection-photos', 'inspection-photos', true);

-- Créer la table pour les inspections
CREATE TABLE public.inspections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  property_name TEXT NOT NULL,
  inspection_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'signed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Créer la table pour les éléments d'inspection
CREATE TABLE public.inspection_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inspection_id UUID REFERENCES public.inspections(id) ON DELETE CASCADE NOT NULL,
  step_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'ok', 'issue', 'na')),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(inspection_id, step_id, item_id)
);

-- Créer la table pour les photos d'inspection
CREATE TABLE public.inspection_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inspection_item_id UUID REFERENCES public.inspection_items(id) ON DELETE CASCADE NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  is_user_photo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activer RLS sur toutes les tables
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_photos ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour inspections
CREATE POLICY "Les utilisateurs peuvent voir leurs propres inspections" 
ON public.inspections 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent créer leurs propres inspections" 
ON public.inspections 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent modifier leurs propres inspections" 
ON public.inspections 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

-- Politiques RLS pour inspection_items
CREATE POLICY "Les utilisateurs peuvent voir les éléments de leurs inspections" 
ON public.inspection_items 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.inspections 
    WHERE id = inspection_items.inspection_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Les utilisateurs peuvent créer des éléments dans leurs inspections" 
ON public.inspection_items 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.inspections 
    WHERE id = inspection_items.inspection_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Les utilisateurs peuvent modifier les éléments de leurs inspections" 
ON public.inspection_items 
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.inspections 
    WHERE id = inspection_items.inspection_id 
    AND user_id = auth.uid()
  )
);

-- Politiques RLS pour inspection_photos
CREATE POLICY "Les utilisateurs peuvent voir les photos de leurs inspections" 
ON public.inspection_photos 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.inspection_items ii
    JOIN public.inspections i ON ii.inspection_id = i.id
    WHERE ii.id = inspection_photos.inspection_item_id 
    AND i.user_id = auth.uid()
  )
);

CREATE POLICY "Les utilisateurs peuvent ajouter des photos à leurs inspections" 
ON public.inspection_photos 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.inspection_items ii
    JOIN public.inspections i ON ii.inspection_id = i.id
    WHERE ii.id = inspection_photos.inspection_item_id 
    AND i.user_id = auth.uid()
  )
);

-- Politiques Storage pour le bucket inspection-photos
CREATE POLICY "Les photos d'inspection sont publiquement lisibles" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'inspection-photos');

CREATE POLICY "Les utilisateurs peuvent uploader leurs photos d'inspection" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'inspection-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers pour updated_at
CREATE TRIGGER update_inspections_updated_at
  BEFORE UPDATE ON public.inspections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inspection_items_updated_at
  BEFORE UPDATE ON public.inspection_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();