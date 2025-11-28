import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus, Edit, Trash2, ArrowLeft } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ModeleEDL {
  id: string;
  nom: string;
  property_name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export default function ModelesEDL() {
  const navigate = useNavigate();
  const [modeles, setModeles] = useState<ModeleEDL[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    loadModeles();
  }, []);

  const loadModeles = async () => {
    try {
      const { data, error } = await supabase
        .from("modele_etats_des_lieux")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setModeles(data || []);
    } catch (error: any) {
      toast.error("Erreur lors du chargement des modèles");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from("modele_etats_des_lieux")
        .delete()
        .eq("id", deleteId);

      if (error) throw error;

      toast.success("Modèle supprimé avec succès");
      loadModeles();
    } catch (error: any) {
      toast.error("Erreur lors de la suppression");
      console.error(error);
    } finally {
      setDeleteId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Modèles État des Lieux</h1>
              <p className="text-muted-foreground">Gérez vos modèles d'inspections</p>
            </div>
          </div>
          <Button
            onClick={() => navigate("/modeles-edl/nouveau")}
            className="bg-primary text-primary-foreground"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouveau modèle
          </Button>
        </div>

        {modeles.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground mb-4">
                Aucun modèle d'état des lieux pour le moment
              </p>
              <Button
                onClick={() => navigate("/modeles-edl/nouveau")}
                variant="outline"
              >
                Créer mon premier modèle
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {modeles.map((modele) => (
              <Card key={modele.id} className="border border-border">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl text-card-foreground">
                        {modele.nom}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Bien: {modele.property_name}
                      </p>
                      {modele.description && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {modele.description}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/modeles-edl/${modele.id}`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteId(modele.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Créé le {new Date(modele.created_at).toLocaleDateString("fr-FR")}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce modèle ? Cette action est
              irréversible et supprimera également toutes les étapes et pièces
              associées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
