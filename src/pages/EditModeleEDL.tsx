import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Trash2, Upload } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

type Etape = {
  id: string;
  nom: string;
  ordre: number;
  commentaire: string | null;
  pieces: Piece[];
};

type Piece = {
  id: string;
  nom: string;
  commentaire: string | null;
  photos: Photo[];
};

type Photo = {
  id: string;
  file_name: string;
  file_path: string;
  commentaire: string | null;
};

export default function EditModeleEDL() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [modele, setModele] = useState({
    nom: '',
    property_name: '',
    description: '',
  });
  
  const [etapes, setEtapes] = useState<Etape[]>([]);

  useEffect(() => {
    if (id && id !== 'nouveau') {
      loadModele();
    } else {
      setLoading(false);
    }
  }, [id]);

  const loadModele = async () => {
    try {
      // Charger le modèle
      const { data: modeleData, error: modeleError } = await supabase
        .from('modele_etats_des_lieux')
        .select('*')
        .eq('id', id)
        .single();

      if (modeleError) throw modeleError;
      
      setModele({
        nom: modeleData.nom,
        property_name: modeleData.property_name,
        description: modeleData.description || '',
      });

      // Charger les étapes
      const { data: etapesData, error: etapesError } = await supabase
        .from('edl_etapes')
        .select('*')
        .eq('modele_id', id)
        .order('ordre');

      if (etapesError) throw etapesError;

      // Pour chaque étape, charger les pièces
      const etapesWithPieces = await Promise.all(
        (etapesData || []).map(async (etape) => {
          const { data: piecesData } = await supabase
            .from('edl_pieces')
            .select('*')
            .eq('etape_id', etape.id);

          // Pour chaque pièce, charger les photos
          const piecesWithPhotos = await Promise.all(
            (piecesData || []).map(async (piece) => {
              const { data: photosData } = await supabase
                .from('edl_photos')
                .select('*')
                .eq('piece_id', piece.id);

              return {
                ...piece,
                photos: photosData || [],
              };
            })
          );

          return {
            ...etape,
            pieces: piecesWithPhotos,
          };
        })
      );

      setEtapes(etapesWithPieces);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!modele.nom || !modele.property_name) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      let modeleId = id;

      if (id === 'nouveau') {
        // Créer un nouveau modèle
        const { data, error } = await supabase
          .from('modele_etats_des_lieux')
          .insert({
            nom: modele.nom,
            property_name: modele.property_name,
            description: modele.description,
            created_by: user?.id,
          })
          .select()
          .single();

        if (error) throw error;
        modeleId = data.id;
      } else {
        // Mettre à jour le modèle existant
        const { error } = await supabase
          .from('modele_etats_des_lieux')
          .update({
            nom: modele.nom,
            property_name: modele.property_name,
            description: modele.description,
          })
          .eq('id', id);

        if (error) throw error;
      }

      // Sauvegarder les étapes
      for (const etape of etapes) {
        if (etape.id.startsWith('new-')) {
          // Nouvelle étape
          const { data: newEtape, error } = await supabase
            .from('edl_etapes')
            .insert({
              modele_id: modeleId,
              nom: etape.nom,
              ordre: etape.ordre,
              commentaire: etape.commentaire,
            })
            .select()
            .single();

          if (error) throw error;

          // Sauvegarder les pièces de cette étape
          for (const piece of etape.pieces) {
            const { error: pieceError } = await supabase
              .from('edl_pieces')
              .insert({
                etape_id: newEtape.id,
                nom: piece.nom,
                commentaire: piece.commentaire,
              });

            if (pieceError) throw pieceError;
          }
        } else {
          // Étape existante - mise à jour
          const { error } = await supabase
            .from('edl_etapes')
            .update({
              nom: etape.nom,
              ordre: etape.ordre,
              commentaire: etape.commentaire,
            })
            .eq('id', etape.id);

          if (error) throw error;
        }
      }

      toast({
        title: "Succès",
        description: "Le modèle a été sauvegardé",
      });

      navigate('/modeles-edl');
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const addEtape = () => {
    const newEtape: Etape = {
      id: `new-${Date.now()}`,
      nom: '',
      ordre: etapes.length,
      commentaire: null,
      pieces: [],
    };
    setEtapes([...etapes, newEtape]);
  };

  const removeEtape = (etapeId: string) => {
    setEtapes(etapes.filter(e => e.id !== etapeId));
  };

  const updateEtape = (etapeId: string, field: string, value: any) => {
    setEtapes(etapes.map(e => 
      e.id === etapeId ? { ...e, [field]: value } : e
    ));
  };

  const addPiece = (etapeId: string) => {
    setEtapes(etapes.map(e => {
      if (e.id === etapeId) {
        const newPiece: Piece = {
          id: `new-${Date.now()}`,
          nom: '',
          commentaire: null,
          photos: [],
        };
        return { ...e, pieces: [...e.pieces, newPiece] };
      }
      return e;
    }));
  };

  const removePiece = (etapeId: string, pieceId: string) => {
    setEtapes(etapes.map(e => {
      if (e.id === etapeId) {
        return { ...e, pieces: e.pieces.filter(p => p.id !== pieceId) };
      }
      return e;
    }));
  };

  const updatePiece = (etapeId: string, pieceId: string, field: string, value: any) => {
    setEtapes(etapes.map(e => {
      if (e.id === etapeId) {
        return {
          ...e,
          pieces: e.pieces.map(p => 
            p.id === pieceId ? { ...p, [field]: value } : p
          ),
        };
      }
      return e;
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/modeles-edl')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
            <div>
              <h1 className="text-3xl font-bold">
                {id === 'nouveau' ? 'Nouveau modèle' : 'Modifier le modèle'}
              </h1>
              <p className="text-muted-foreground">
                Configurez votre modèle d'état des lieux
              </p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nom">Nom du modèle *</Label>
              <Input
                id="nom"
                value={modele.nom}
                onChange={(e) => setModele({ ...modele, nom: e.target.value })}
                placeholder="Ex: État des lieux standard"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="property">Bien immobilier *</Label>
              <Input
                id="property"
                value={modele.property_name}
                onChange={(e) => setModele({ ...modele, property_name: e.target.value })}
                placeholder="Ex: Appartement 2 pièces"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={modele.description}
                onChange={(e) => setModele({ ...modele, description: e.target.value })}
                placeholder="Description optionnelle"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Étapes</CardTitle>
                <CardDescription>
                  Ajoutez les différentes étapes de l'état des lieux
                </CardDescription>
              </div>
              <Button onClick={addEtape} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Ajouter une étape
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {etapes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucune étape. Commencez par en ajouter une.
              </div>
            ) : (
              <Accordion type="single" collapsible className="space-y-4">
                {etapes.map((etape, index) => (
                  <AccordionItem key={etape.id} value={etape.id}>
                    <AccordionTrigger>
                      <div className="flex items-center justify-between w-full pr-4">
                        <span>{etape.nom || `Étape ${index + 1}`}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeEtape(etape.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label>Nom de l'étape</Label>
                        <Input
                          value={etape.nom}
                          onChange={(e) => updateEtape(etape.id, 'nom', e.target.value)}
                          placeholder="Ex: Entrée"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Commentaire</Label>
                        <Textarea
                          value={etape.commentaire || ''}
                          onChange={(e) => updateEtape(etape.id, 'commentaire', e.target.value)}
                          placeholder="Commentaire optionnel"
                        />
                      </div>

                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-4">
                          <Label>Pièces</Label>
                          <Button
                            onClick={() => addPiece(etape.id)}
                            size="sm"
                            variant="outline"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Ajouter une pièce
                          </Button>
                        </div>
                        
                        {etape.pieces.length === 0 ? (
                          <p className="text-sm text-muted-foreground">Aucune pièce</p>
                        ) : (
                          <div className="space-y-3">
                            {etape.pieces.map((piece) => (
                              <Card key={piece.id}>
                                <CardContent className="pt-6 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <Label>Nom de la pièce</Label>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removePiece(etape.id, piece.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  <Input
                                    value={piece.nom}
                                    onChange={(e) => updatePiece(etape.id, piece.id, 'nom', e.target.value)}
                                    placeholder="Ex: Salon"
                                  />
                                  <div className="space-y-2">
                                    <Label>Commentaire</Label>
                                    <Textarea
                                      value={piece.commentaire || ''}
                                      onChange={(e) => updatePiece(etape.id, piece.id, 'commentaire', e.target.value)}
                                      placeholder="Commentaire optionnel"
                                    />
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
