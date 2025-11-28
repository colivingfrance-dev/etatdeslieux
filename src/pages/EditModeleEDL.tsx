import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, GripVertical } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface Piece {
  id?: string;
  nom: string;
  commentaire: string;
}

interface Etape {
  id?: string;
  nom: string;
  commentaire: string;
  ordre: number;
  pieces: Piece[];
}

interface ModeleData {
  nom: string;
  property_name: string;
  description: string;
  etapes: Etape[];
}

export default function EditModeleEDL() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [modele, setModele] = useState<ModeleData>({
    nom: "",
    property_name: "",
    description: "",
    etapes: [],
  });

  useEffect(() => {
    if (id && id !== "nouveau") {
      loadModele();
    }
  }, [id]);

  const loadModele = async () => {
    if (!id || id === "nouveau") return;

    try {
      setLoading(true);

      const { data: modeleData, error: modeleError } = await supabase
        .from("modele_etats_des_lieux")
        .select("*")
        .eq("id", id)
        .single();

      if (modeleError) throw modeleError;

      const { data: etapesData, error: etapesError } = await supabase
        .from("edl_etapes")
        .select(`
          *,
          edl_pieces (*)
        `)
        .eq("modele_id", id)
        .order("ordre", { ascending: true });

      if (etapesError) throw etapesError;

      const etapes = etapesData.map((etape: any) => ({
        id: etape.id,
        nom: etape.nom,
        commentaire: etape.commentaire || "",
        ordre: etape.ordre,
        pieces: etape.edl_pieces.map((piece: any) => ({
          id: piece.id,
          nom: piece.nom,
          commentaire: piece.commentaire || "",
        })),
      }));

      setModele({
        nom: modeleData.nom,
        property_name: modeleData.property_name,
        description: modeleData.description || "",
        etapes,
      });
    } catch (error: any) {
      toast.error("Erreur lors du chargement du modèle");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!modele.nom || !modele.property_name) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      let modeleId = id;

      if (!id || id === "nouveau") {
        const { data, error } = await supabase
          .from("modele_etats_des_lieux")
          .insert({
            nom: modele.nom,
            property_name: modele.property_name,
            description: modele.description,
            created_by: user.id,
          })
          .select()
          .single();

        if (error) throw error;
        modeleId = data.id;
      } else {
        const { error } = await supabase
          .from("modele_etats_des_lieux")
          .update({
            nom: modele.nom,
            property_name: modele.property_name,
            description: modele.description,
          })
          .eq("id", id);

        if (error) throw error;
      }

      // Sauvegarder les étapes
      for (const [index, etape] of modele.etapes.entries()) {
        let etapeId = etape.id;

        if (!etapeId) {
          const { data, error } = await supabase
            .from("edl_etapes")
            .insert({
              modele_id: modeleId,
              nom: etape.nom,
              commentaire: etape.commentaire,
              ordre: index,
            })
            .select()
            .single();

          if (error) throw error;
          etapeId = data.id;
        } else {
          const { error } = await supabase
            .from("edl_etapes")
            .update({
              nom: etape.nom,
              commentaire: etape.commentaire,
              ordre: index,
            })
            .eq("id", etapeId);

          if (error) throw error;
        }

        // Sauvegarder les pièces
        for (const piece of etape.pieces) {
          if (!piece.id) {
            const { error } = await supabase
              .from("edl_pieces")
              .insert({
                etape_id: etapeId,
                nom: piece.nom,
                commentaire: piece.commentaire,
              });

            if (error) throw error;
          } else {
            const { error } = await supabase
              .from("edl_pieces")
              .update({
                nom: piece.nom,
                commentaire: piece.commentaire,
              })
              .eq("id", piece.id);

            if (error) throw error;
          }
        }
      }

      toast.success("Modèle enregistré avec succès");
      navigate("/modeles-edl");
    } catch (error: any) {
      toast.error("Erreur lors de l'enregistrement");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const addEtape = () => {
    setModele({
      ...modele,
      etapes: [
        ...modele.etapes,
        {
          nom: "",
          commentaire: "",
          ordre: modele.etapes.length,
          pieces: [],
        },
      ],
    });
  };

  const removeEtape = (index: number) => {
    setModele({
      ...modele,
      etapes: modele.etapes.filter((_, i) => i !== index),
    });
  };

  const updateEtape = (index: number, field: string, value: string) => {
    const newEtapes = [...modele.etapes];
    newEtapes[index] = { ...newEtapes[index], [field]: value };
    setModele({ ...modele, etapes: newEtapes });
  };

  const addPiece = (etapeIndex: number) => {
    const newEtapes = [...modele.etapes];
    newEtapes[etapeIndex].pieces.push({
      nom: "",
      commentaire: "",
    });
    setModele({ ...modele, etapes: newEtapes });
  };

  const removePiece = (etapeIndex: number, pieceIndex: number) => {
    const newEtapes = [...modele.etapes];
    newEtapes[etapeIndex].pieces = newEtapes[etapeIndex].pieces.filter(
      (_, i) => i !== pieceIndex
    );
    setModele({ ...modele, etapes: newEtapes });
  };

  const updatePiece = (
    etapeIndex: number,
    pieceIndex: number,
    field: string,
    value: string
  ) => {
    const newEtapes = [...modele.etapes];
    newEtapes[etapeIndex].pieces[pieceIndex] = {
      ...newEtapes[etapeIndex].pieces[pieceIndex],
      [field]: value,
    };
    setModele({ ...modele, etapes: newEtapes });
  };

  if (loading && id && id !== "nouveau") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate("/modeles-edl")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {id === "nouveau" ? "Nouveau modèle" : "Modifier le modèle"}
            </h1>
            <p className="text-muted-foreground">
              Configurez votre modèle d'état des lieux
            </p>
          </div>
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
              <Label htmlFor="property_name">Nom du bien *</Label>
              <Input
                id="property_name"
                value={modele.property_name}
                onChange={(e) =>
                  setModele({ ...modele, property_name: e.target.value })
                }
                placeholder="Ex: Appartement Paris 15ème"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={modele.description}
                onChange={(e) =>
                  setModele({ ...modele, description: e.target.value })
                }
                placeholder="Description optionnelle du modèle"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Étapes de l'inspection</CardTitle>
              <Button onClick={addEtape} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une étape
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {modele.etapes.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Aucune étape. Cliquez sur "Ajouter une étape" pour commencer.
              </p>
            ) : (
              <Accordion type="single" collapsible className="space-y-4">
                {modele.etapes.map((etape, etapeIndex) => (
                  <AccordionItem
                    key={etapeIndex}
                    value={`etape-${etapeIndex}`}
                    className="border border-border rounded-lg px-4"
                  >
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2 flex-1">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">
                          {etape.nom || `Étape ${etapeIndex + 1}`}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label>Nom de l'étape</Label>
                        <Input
                          value={etape.nom}
                          onChange={(e) =>
                            updateEtape(etapeIndex, "nom", e.target.value)
                          }
                          placeholder="Ex: Cuisine"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Commentaire étape</Label>
                        <Textarea
                          value={etape.commentaire}
                          onChange={(e) =>
                            updateEtape(etapeIndex, "commentaire", e.target.value)
                          }
                          placeholder="Commentaire général sur l'étape"
                        />
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Pièces / Éléments</Label>
                          <Button
                            onClick={() => addPiece(etapeIndex)}
                            size="sm"
                            variant="outline"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Ajouter une pièce
                          </Button>
                        </div>

                        {etape.pieces.map((piece, pieceIndex) => (
                          <Card key={pieceIndex} className="bg-muted/50">
                            <CardContent className="p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <Label className="text-sm">
                                  Pièce {pieceIndex + 1}
                                </Label>
                                <Button
                                  onClick={() => removePiece(etapeIndex, pieceIndex)}
                                  size="sm"
                                  variant="ghost"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                              <Input
                                value={piece.nom}
                                onChange={(e) =>
                                  updatePiece(
                                    etapeIndex,
                                    pieceIndex,
                                    "nom",
                                    e.target.value
                                  )
                                }
                                placeholder="Nom de la pièce"
                              />
                              <Textarea
                                value={piece.commentaire}
                                onChange={(e) =>
                                  updatePiece(
                                    etapeIndex,
                                    pieceIndex,
                                    "commentaire",
                                    e.target.value
                                  )
                                }
                                placeholder="Commentaire sur cette pièce"
                                className="min-h-[60px]"
                              />
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      <Button
                        onClick={() => removeEtape(etapeIndex)}
                        variant="destructive"
                        size="sm"
                        className="w-full"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer cette étape
                      </Button>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-4 justify-end">
          <Button variant="outline" onClick={() => navigate("/modeles-edl")}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </div>
    </div>
  );
}
