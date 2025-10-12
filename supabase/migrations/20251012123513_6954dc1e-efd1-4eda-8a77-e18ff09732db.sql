-- Créer la table des modèles d'état des lieux
CREATE TABLE public.modele_etats_des_lieux (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_name TEXT NOT NULL,
  nom TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Créer la table des étapes d'un état des lieux
CREATE TABLE public.edl_etapes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  modele_id UUID NOT NULL REFERENCES public.modele_etats_des_lieux(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  ordre INTEGER NOT NULL DEFAULT 0,
  commentaire TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Créer la table des pièces dans une étape
CREATE TABLE public.edl_pieces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  etape_id UUID NOT NULL REFERENCES public.edl_etapes(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  commentaire TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Créer la table des photos des pièces
CREATE TABLE public.edl_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  piece_id UUID NOT NULL REFERENCES public.edl_pieces(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  commentaire TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activer RLS
ALTER TABLE public.modele_etats_des_lieux ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edl_etapes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edl_pieces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edl_photos ENABLE ROW LEVEL SECURITY;

-- Policies pour modele_etats_des_lieux
CREATE POLICY "Superadmins can view all modeles" 
ON public.modele_etats_des_lieux FOR SELECT 
USING (has_role(auth.uid(), 'superadmin'::app_role));

CREATE POLICY "Admins can view their modeles" 
ON public.modele_etats_des_lieux FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role) AND auth.uid() = created_by);

CREATE POLICY "Clients can view their modeles" 
ON public.modele_etats_des_lieux FOR SELECT 
USING (has_role(auth.uid(), 'client'::app_role) AND auth.uid() = created_by);

CREATE POLICY "Superadmins can insert modeles" 
ON public.modele_etats_des_lieux FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role));

CREATE POLICY "Admins can insert modeles" 
ON public.modele_etats_des_lieux FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND auth.uid() = created_by);

CREATE POLICY "Clients can insert modeles" 
ON public.modele_etats_des_lieux FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'client'::app_role) AND auth.uid() = created_by);

CREATE POLICY "Superadmins can update modeles" 
ON public.modele_etats_des_lieux FOR UPDATE 
USING (has_role(auth.uid(), 'superadmin'::app_role));

CREATE POLICY "Admins can update their modeles" 
ON public.modele_etats_des_lieux FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role) AND auth.uid() = created_by);

CREATE POLICY "Clients can update their modeles" 
ON public.modele_etats_des_lieux FOR UPDATE 
USING (has_role(auth.uid(), 'client'::app_role) AND auth.uid() = created_by);

CREATE POLICY "Superadmins can delete modeles" 
ON public.modele_etats_des_lieux FOR DELETE 
USING (has_role(auth.uid(), 'superadmin'::app_role));

CREATE POLICY "Admins can delete their modeles" 
ON public.modele_etats_des_lieux FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role) AND auth.uid() = created_by);

CREATE POLICY "Clients can delete their modeles" 
ON public.modele_etats_des_lieux FOR DELETE 
USING (has_role(auth.uid(), 'client'::app_role) AND auth.uid() = created_by);

-- Policies pour edl_etapes
CREATE POLICY "Users can view etapes of their modeles" 
ON public.edl_etapes FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.modele_etats_des_lieux m 
  WHERE m.id = edl_etapes.modele_id 
  AND (m.created_by = auth.uid() OR has_role(auth.uid(), 'superadmin'::app_role))
));

CREATE POLICY "Users can insert etapes in their modeles" 
ON public.edl_etapes FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.modele_etats_des_lieux m 
  WHERE m.id = edl_etapes.modele_id 
  AND (m.created_by = auth.uid() OR has_role(auth.uid(), 'superadmin'::app_role))
));

CREATE POLICY "Users can update etapes of their modeles" 
ON public.edl_etapes FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.modele_etats_des_lieux m 
  WHERE m.id = edl_etapes.modele_id 
  AND (m.created_by = auth.uid() OR has_role(auth.uid(), 'superadmin'::app_role))
));

CREATE POLICY "Users can delete etapes of their modeles" 
ON public.edl_etapes FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.modele_etats_des_lieux m 
  WHERE m.id = edl_etapes.modele_id 
  AND (m.created_by = auth.uid() OR has_role(auth.uid(), 'superadmin'::app_role))
));

-- Policies pour edl_pieces
CREATE POLICY "Users can view pieces of their etapes" 
ON public.edl_pieces FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.edl_etapes e 
  JOIN public.modele_etats_des_lieux m ON m.id = e.modele_id
  WHERE e.id = edl_pieces.etape_id 
  AND (m.created_by = auth.uid() OR has_role(auth.uid(), 'superadmin'::app_role))
));

CREATE POLICY "Users can insert pieces in their etapes" 
ON public.edl_pieces FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.edl_etapes e 
  JOIN public.modele_etats_des_lieux m ON m.id = e.modele_id
  WHERE e.id = edl_pieces.etape_id 
  AND (m.created_by = auth.uid() OR has_role(auth.uid(), 'superadmin'::app_role))
));

CREATE POLICY "Users can update pieces of their etapes" 
ON public.edl_pieces FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.edl_etapes e 
  JOIN public.modele_etats_des_lieux m ON m.id = e.modele_id
  WHERE e.id = edl_pieces.etape_id 
  AND (m.created_by = auth.uid() OR has_role(auth.uid(), 'superadmin'::app_role))
));

CREATE POLICY "Users can delete pieces of their etapes" 
ON public.edl_pieces FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.edl_etapes e 
  JOIN public.modele_etats_des_lieux m ON m.id = e.modele_id
  WHERE e.id = edl_pieces.etape_id 
  AND (m.created_by = auth.uid() OR has_role(auth.uid(), 'superadmin'::app_role))
));

-- Policies pour edl_photos
CREATE POLICY "Users can view photos of their pieces" 
ON public.edl_photos FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.edl_pieces p
  JOIN public.edl_etapes e ON e.id = p.etape_id
  JOIN public.modele_etats_des_lieux m ON m.id = e.modele_id
  WHERE p.id = edl_photos.piece_id 
  AND (m.created_by = auth.uid() OR has_role(auth.uid(), 'superadmin'::app_role))
));

CREATE POLICY "Users can insert photos in their pieces" 
ON public.edl_photos FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.edl_pieces p
  JOIN public.edl_etapes e ON e.id = p.etape_id
  JOIN public.modele_etats_des_lieux m ON m.id = e.modele_id
  WHERE p.id = edl_photos.piece_id 
  AND (m.created_by = auth.uid() OR has_role(auth.uid(), 'superadmin'::app_role))
));

CREATE POLICY "Users can update photos of their pieces" 
ON public.edl_photos FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.edl_pieces p
  JOIN public.edl_etapes e ON e.id = p.etape_id
  JOIN public.modele_etats_des_lieux m ON m.id = e.modele_id
  WHERE p.id = edl_photos.piece_id 
  AND (m.created_by = auth.uid() OR has_role(auth.uid(), 'superadmin'::app_role))
));

CREATE POLICY "Users can delete photos of their pieces" 
ON public.edl_photos FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.edl_pieces p
  JOIN public.edl_etapes e ON e.id = p.etape_id
  JOIN public.modele_etats_des_lieux m ON m.id = e.modele_id
  WHERE p.id = edl_photos.piece_id 
  AND (m.created_by = auth.uid() OR has_role(auth.uid(), 'superadmin'::app_role))
));

-- Trigger pour updated_at
CREATE TRIGGER update_modele_etats_des_lieux_updated_at
BEFORE UPDATE ON public.modele_etats_des_lieux
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_edl_etapes_updated_at
BEFORE UPDATE ON public.edl_etapes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_edl_pieces_updated_at
BEFORE UPDATE ON public.edl_pieces
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();