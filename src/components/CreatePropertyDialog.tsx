import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Building } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function CreatePropertyDialog({ onPropertyCreated }: { onPropertyCreated?: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    propertyName: '',
    clientId: '',
    status: 'in_progress',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    try {
      // Get user role to determine if admin_id should be set
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      const userRole = roleData?.role;
      
      // Prepare inspection data
      const inspectionData: any = {
        property_name: formData.propertyName,
        user_id: formData.clientId || user.id,
        status: formData.status,
      };

      // If admin or superadmin, set admin_id
      if (userRole === 'admin' || userRole === 'superadmin') {
        inspectionData.admin_id = user.id;
      }

      const { error } = await supabase
        .from('inspections')
        .insert(inspectionData);

      if (error) throw error;

      toast({
        title: 'Bien immobilier créé',
        description: 'Le nouveau bien a été ajouté avec succès'
      });

      setOpen(false);
      setFormData({
        propertyName: '',
        clientId: '',
        status: 'in_progress',
      });
      
      if (onPropertyCreated) onPropertyCreated();
    } catch (error: any) {
      console.error('Error creating property:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer le bien immobilier',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Building className="mr-2 h-4 w-4" />
          Nouveau Bien Immobilier
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Créer un nouveau bien immobilier</DialogTitle>
          <DialogDescription>
            Renseignez les informations du bien
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="propertyName">Nom du bien *</Label>
            <Input
              id="propertyName"
              required
              placeholder="Ex: Appartement 3 pièces - Centre ville"
              value={formData.propertyName}
              onChange={(e) => setFormData(prev => ({ ...prev, propertyName: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientId">ID du client (optionnel)</Label>
            <Input
              id="clientId"
              placeholder="Laissez vide pour vous assigner"
              value={formData.clientId}
              onChange={(e) => setFormData(prev => ({ ...prev, clientId: e.target.value }))}
            />
            <p className="text-sm text-muted-foreground">
              Si vide, le bien sera assigné à votre compte
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Statut *</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in_progress">En cours</SelectItem>
                <SelectItem value="completed">Terminé</SelectItem>
              </SelectContent>
            </Select>
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
