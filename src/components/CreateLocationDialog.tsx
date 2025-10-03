import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { PlusCircle, Upload } from 'lucide-react';

export function CreateLocationDialog({ onLocationCreated }: { onLocationCreated?: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    nomBatiment: '',
    nomLogement: '',
    adresseRue: '',
    adresseCp: '',
    adresseVille: '',
    adressePays: 'France',
  });

  const [files, setFiles] = useState<{
    etatDesLieux?: File;
    etatDesLieuxSortie?: File;
    identite?: File;
    bail?: File;
    caution?: File;
    reglement?: File;
  }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    try {
      // Upload files to storage if they exist
      const uploadedPaths: any = {};
      
      for (const [key, file] of Object.entries(files)) {
        if (file) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
          const filePath = `${user.id}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('inspection-photos')
            .upload(filePath, file);

          if (uploadError) throw uploadError;
          uploadedPaths[`${key}_path`] = filePath;
        }
      }

      // Generate unique ID for location
      const idLocataire = `LOC-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // Insert into locataires table
      const { error } = await supabase
        .from('locataires')
        .insert({
          id_locataire: idLocataire,
          nom: 'À renseigner',
          prenom: 'À renseigner',
          nom_batiment: formData.nomBatiment,
          nom_logement: formData.nomLogement,
          adresse_rue: formData.adresseRue,
          adresse_cp: formData.adresseCp,
          adresse_ville: formData.adresseVille,
          adresse_pays: formData.adressePays,
          created_by: user.id,
          ...uploadedPaths
        });

      if (error) throw error;

      toast({
        title: 'Location créée',
        description: 'La nouvelle location a été ajoutée avec succès'
      });

      setOpen(false);
      setFormData({
        nomBatiment: '',
        nomLogement: '',
        adresseRue: '',
        adresseCp: '',
        adresseVille: '',
        adressePays: 'France',
      });
      setFiles({});
      
      if (onLocationCreated) onLocationCreated();
    } catch (error: any) {
      console.error('Error creating location:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer la location',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (key: string, file: File | undefined) => {
    setFiles(prev => ({ ...prev, [key]: file }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nouvelle Location
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Créer une nouvelle location</DialogTitle>
          <DialogDescription>
            Renseignez les informations de la location
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nomBatiment">Nom du bâtiment *</Label>
              <Input
                id="nomBatiment"
                required
                value={formData.nomBatiment}
                onChange={(e) => setFormData(prev => ({ ...prev, nomBatiment: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nomLogement">Nom du logement *</Label>
              <Input
                id="nomLogement"
                required
                value={formData.nomLogement}
                onChange={(e) => setFormData(prev => ({ ...prev, nomLogement: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adresseRue">Adresse *</Label>
            <Input
              id="adresseRue"
              required
              value={formData.adresseRue}
              onChange={(e) => setFormData(prev => ({ ...prev, adresseRue: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="adresseCp">Code postal *</Label>
              <Input
                id="adresseCp"
                required
                value={formData.adresseCp}
                onChange={(e) => setFormData(prev => ({ ...prev, adresseCp: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adresseVille">Ville *</Label>
              <Input
                id="adresseVille"
                required
                value={formData.adresseVille}
                onChange={(e) => setFormData(prev => ({ ...prev, adresseVille: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adressePays">Pays *</Label>
              <Input
                id="adressePays"
                required
                value={formData.adressePays}
                onChange={(e) => setFormData(prev => ({ ...prev, adressePays: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-medium">Documents (optionnels)</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="etatDesLieux">État des lieux</Label>
                <Input
                  id="etatDesLieux"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange('etatDesLieux', e.target.files?.[0])}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="etatDesLieuxSortie">État des lieux sortie</Label>
                <Input
                  id="etatDesLieuxSortie"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange('etatDesLieuxSortie', e.target.files?.[0])}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="identite">Pièce d'identité</Label>
                <Input
                  id="identite"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange('identite', e.target.files?.[0])}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bail">Bail</Label>
                <Input
                  id="bail"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange('bail', e.target.files?.[0])}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="caution">Caution</Label>
                <Input
                  id="caution"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange('caution', e.target.files?.[0])}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reglement">Règlement</Label>
                <Input
                  id="reglement"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange('reglement', e.target.files?.[0])}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Création...' : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
