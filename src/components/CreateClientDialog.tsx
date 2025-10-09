import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { UserPlus } from 'lucide-react';

export function CreateClientDialog({ onClientCreated }: { onClientCreated?: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user, userRole } = useAuth();

  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    tel: '',
    dateNaissance: '',
    lieuNaissance: '',
    role: 'client' as 'superadmin' | 'admin' | 'client',
    password: '',
    maxLocations: '5',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Vérifier que seuls les superadmins peuvent créer des superadmins ou admins
    if (userRole !== 'superadmin' && (formData.role === 'superadmin' || formData.role === 'admin')) {
      toast({
        title: 'Erreur',
        description: 'Seul un superadmin peut créer des comptes admin ou superadmin',
        variant: 'destructive'
      });
      return;
    }
    
    setLoading(true);
    try {
      // 1. Créer le compte utilisateur via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.prenom,
            last_name: formData.nom,
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Utilisateur non créé');

      const newUserId = authData.user.id;

      // 2. Créer le rôle dans user_roles
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: newUserId,
          role: formData.role,
        });

      if (roleError) throw roleError;

      // 3. Si c'est un admin, créer le profil admin
      if (formData.role === 'admin') {
        const { error: profileError } = await supabase
          .from('admin_profiles')
          .insert({
            user_id: newUserId,
            max_locations: parseInt(formData.maxLocations),
            created_by: user.id,
          });

        if (profileError) throw profileError;
      }

      // 4. Créer l'entrée dans locataires
      const idLocataire = `CLI-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const { error: locataireError } = await supabase
        .from('locataires')
        .insert({
          id_locataire: idLocataire,
          nom: formData.nom,
          prenom: formData.prenom,
          email: formData.email,
          tel: formData.tel,
          date_naissance: formData.dateNaissance || null,
          lieu_naissance: formData.lieuNaissance || null,
          created_by: user.id,
        });

      if (locataireError) throw locataireError;

      toast({
        title: 'Utilisateur créé',
        description: `Le compte ${formData.role} a été créé avec succès`
      });

      setOpen(false);
      setFormData({
        nom: '',
        prenom: '',
        email: '',
        tel: '',
        dateNaissance: '',
        lieuNaissance: '',
        role: 'client',
        password: '',
        maxLocations: '5',
      });
      
      if (onClientCreated) onClientCreated();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer l\'utilisateur',
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
          <UserPlus className="mr-2 h-4 w-4" />
          Nouveau Client
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
          <DialogDescription>
            Renseignez les informations de l'utilisateur et ses droits
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nom">Nom *</Label>
              <Input
                id="nom"
                required
                value={formData.nom}
                onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prenom">Prénom *</Label>
              <Input
                id="prenom"
                required
                value={formData.prenom}
                onChange={(e) => setFormData(prev => ({ ...prev, prenom: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe *</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Rôle *</Label>
            <Select
              value={formData.role}
              onValueChange={(value) => setFormData(prev => ({ ...prev, role: value as any }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="client">Client</SelectItem>
                {userRole === 'superadmin' && (
                  <>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="superadmin">SuperAdmin</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          {formData.role === 'admin' && (
            <div className="space-y-2">
              <Label htmlFor="maxLocations">Nombre max de locations</Label>
              <Input
                id="maxLocations"
                type="number"
                min="1"
                value={formData.maxLocations}
                onChange={(e) => setFormData(prev => ({ ...prev, maxLocations: e.target.value }))}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="tel">Téléphone</Label>
            <Input
              id="tel"
              type="tel"
              value={formData.tel}
              onChange={(e) => setFormData(prev => ({ ...prev, tel: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateNaissance">Date de naissance</Label>
              <Input
                id="dateNaissance"
                type="date"
                value={formData.dateNaissance}
                onChange={(e) => setFormData(prev => ({ ...prev, dateNaissance: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lieuNaissance">Lieu de naissance</Label>
              <Input
                id="lieuNaissance"
                value={formData.lieuNaissance}
                onChange={(e) => setFormData(prev => ({ ...prev, lieuNaissance: e.target.value }))}
              />
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