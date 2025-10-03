import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Users, Building, LogOut, Settings } from 'lucide-react';
import { CreateLocationDialog } from '@/components/CreateLocationDialog';
import { CreateClientDialog } from '@/components/CreateClientDialog';
import { CreatePropertyDialog } from '@/components/CreatePropertyDialog';

type Admin = {
  id: string;
  max_locations: number;
  current_locations: number;
  created_at: string;
};

type Property = {
  id: string;
  property_name: string;
  status: string;
  inspection_date: string;
  admin_id: string | null;
  user_id: string;
};

export default function SuperAdminDashboard() {
  const { signOut } = useAuth();
  const { toast } = useToast();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load admins
      const { data: adminRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (rolesError) throw rolesError;

      if (adminRoles) {
        const adminData: Admin[] = [];
        for (const role of adminRoles) {
          if (!role.user_id) continue;
          
          const { data: profile } = await supabase
            .from('admin_profiles')
            .select('*')
            .eq('user_id', role.user_id)
            .single();

          const { count } = await supabase
            .from('inspections')
            .select('*', { count: 'exact', head: true })
            .eq('admin_id', role.user_id);

          if (profile) {
            adminData.push({
              id: role.user_id,
              max_locations: profile.max_locations,
              current_locations: count || 0,
              created_at: profile.created_at
            });
          }
        }
        setAdmins(adminData);
      }

      // Load all properties
      const { data: inspections, error: inspError } = await supabase
        .from('inspections')
        .select('*')
        .order('created_at', { ascending: false });

      if (inspError) throw inspError;

      if (inspections) {
        setProperties(inspections);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
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
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-6 w-6" />
            <h1 className="text-2xl font-bold">SuperAdmin Dashboard</h1>
          </div>
          <Button variant="outline" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Déconnexion
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Action Buttons */}
        <div className="flex gap-4 flex-wrap">
          <CreateLocationDialog onLocationCreated={loadData} />
          <CreateClientDialog onClientCreated={loadData} />
          <CreatePropertyDialog onPropertyCreated={loadData} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Administrateurs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{admins.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Biens Immobiliers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{properties.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Clients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {new Set(properties.map(p => p.user_id)).size}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Admins Management */}
        <Card>
          <CardHeader>
            <CardTitle>Administrateurs</CardTitle>
            <CardDescription>Liste des administrateurs et leurs quotas</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Locations Actuelles</TableHead>
                  <TableHead>Maximum</TableHead>
                  <TableHead>Date de création</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell className="font-mono text-sm">{admin.id.substring(0, 8)}...</TableCell>
                    <TableCell>{admin.current_locations}</TableCell>
                    <TableCell>{admin.max_locations}</TableCell>
                    <TableCell>
                      {new Date(admin.created_at).toLocaleDateString('fr-FR')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* All Properties */}
        <Card>
          <CardHeader>
            <CardTitle>Tous les Biens Immobiliers</CardTitle>
            <CardDescription>Vue d'ensemble de tous les états des lieux</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bien</TableHead>
                  <TableHead>Client ID</TableHead>
                  <TableHead>Admin ID</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {properties.map((property) => (
                  <TableRow key={property.id}>
                    <TableCell className="font-medium">{property.property_name}</TableCell>
                    <TableCell className="font-mono text-sm">{property.user_id.substring(0, 8)}...</TableCell>
                    <TableCell className="font-mono text-sm">
                      {property.admin_id ? `${property.admin_id.substring(0, 8)}...` : 'Non assigné'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={property.status === 'completed' ? 'default' : 'secondary'}>
                        {property.status === 'completed' ? 'Terminé' : 'En cours'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(property.inspection_date).toLocaleDateString('fr-FR')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
