import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Pencil, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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

type ModeleEDL = {
  id: string;
  property_name: string;
  nom: string;
  description: string | null;
  created_at: string;
};

export default function ModelesEDL() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [modeles, setModeles] = useState<ModeleEDL[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [modeleToDelete, setModeleToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadModeles();
  }, []);

  const loadModeles = async () => {
    try {
      const { data, error } = await supabase
        .from('modele_etats_des_lieux')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setModeles(data || []);
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

  const handleDelete = async () => {
    if (!modeleToDelete) return;

    try {
      const { error } = await supabase
        .from('modele_etats_des_lieux')
        .delete()
        .eq('id', modeleToDelete);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Le modèle a été supprimé",
      });

      loadModeles();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setModeleToDelete(null);
    }
  };

  const openDeleteDialog = (id: string) => {
    setModeleToDelete(id);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Modèles d'état des lieux</h1>
              <p className="text-muted-foreground">Gérez vos modèles d'état des lieux</p>
            </div>
          </div>
          <Button onClick={() => navigate('/modeles-edl/nouveau')}>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau modèle
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Liste des modèles</CardTitle>
            <CardDescription>
              Tous les modèles d'état des lieux disponibles
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Chargement...</p>
              </div>
            ) : modeles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucun modèle d'état des lieux
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Bien immobilier</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Date de création</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modeles.map((modele) => (
                    <TableRow key={modele.id}>
                      <TableCell className="font-medium">{modele.nom}</TableCell>
                      <TableCell>{modele.property_name}</TableCell>
                      <TableCell>{modele.description || '-'}</TableCell>
                      <TableCell>
                        {new Date(modele.created_at).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/modeles-edl/edit/${modele.id}`)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => openDeleteDialog(modele.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le modèle et toutes ses données seront supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
