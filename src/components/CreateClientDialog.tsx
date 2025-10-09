import { useState, useEffect } from 'react';
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
  const [properties, setProperties] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    password: '',
    tel: '',
    dateNaissance: '',
    lieuNaissance: '',
    role: 'client' as 'superadmin' | 'admin' | 'client',
    assignedProperties: [] as string[],
  });

  useEffect(() => {
    if (open) {
      loadProperties();
    }
  }, [open]);

  const loadProperties = async () => {
    const { data } = await supabase
      .from('inspections')
      .select('id, property_name')
      .order('created_at', { ascending: false });
    
    if (data) setProperties(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Vérification des permissions
    if (formData.role === 'superadmin' && userRole !== 'superadmin') {
      toast({
        title: 'Erreur',
        description: 'Seul un superadmin peut créer des comptes superadmin',
        variant: 'destructive'
      });
      return;
    }
    
    setLoading(true);
    try {
      // Créer le compte utilisateur dans Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            nom: formData.nom,
            prenom: formData.prenom
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Échec de la création du compte');

      const newUserId = authData.user.id;

      // Créer le rôle de l'utilisateur
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: newUserId,
          role: formData.role
        });

      if (roleError) throw roleError;

      // Si c'est un admin, créer le profil admin
      if (formData.role === 'admin') {
        const { error: adminError } = await supabase
          .from('admin_profiles')
          .insert({
            user_id: newUserId,
            max_locations: 5,
            created_by: user.id
          });

        if (adminError) throw adminError;
      }

      // Générer un ID unique pour le locataire
      const idLocataire = `CLI-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // Insérer dans la table locataires
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

      // Si des biens sont assignés, mettre à jour les inspections
      if (formData.assignedProperties.length > 0) {
        const { error: updateError } = await supabase
          .from('inspections')
          .update({ user_id: newUserId })
          .in('id', formData.assignedProperties);

        if (updateError) throw updateError;
      }

      toast({
        title: 'Client créé',
        description: `Le compte ${formData.role} a été créé avec succès`
      });

      setOpen(false);
      setFormData({
        nom: '',
        prenom: '',
        email: '',
        password: '',
        tel: '',
        dateNaissance: '',
        lieuNaissance: '',
        role: 'client',
        assignedProperties: [],
      });
      
      if (onClientCreated) onClientCreated();
    } catch (error: any) {
      console.error('Error creating client:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer le client',
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Créer un nouveau client</DialogTitle>
          <DialogDescription>
            Renseignez les informations du client
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
              onValueChange={(value: any) => setFormData(prev => ({ ...prev, role: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="client">Client</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                {userRole === 'superadmin' && (
                  <SelectItem value="superadmin">SuperAdmin</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

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

          {formData.role === 'client' && properties.length > 0 && (
            <div className="space-y-2">
              <Label>Attribuer des biens immobiliers</Label>
              <div className="border rounded-md p-3 max-h-40 overflow-y-auto space-y-2">
                {properties.map((property) => (
                  <label key={property.id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.assignedProperties.includes(property.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData(prev => ({
                            ...prev,
                            assignedProperties: [...prev.assignedProperties, property.id]
                          }));
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            assignedProperties: prev.assignedProperties.filter(id => id !== property.id)
                          }));
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">{property.property_name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

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
