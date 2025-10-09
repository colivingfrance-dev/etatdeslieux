import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Users, Building, LogOut } from 'lucide-react';
import { CreateLocationDialog } from '@/components/CreateLocationDialog';
import { CreateClientDialog } from '@/components/CreateClientDialog';
import { CreatePropertyDialog } from '@/components/CreatePropertyDialog';

type Property = {
  id: string;
  property_name: string;
  status: string;
  inspection_date: string;
  user_id: string;
};

export default function AdminDashboard() {
  const { signOut, user } = useAuth();
  const { toast } = useToast();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [quota, setQuota] = useState({ current: 0, max: 0 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load admin quota
      const { data: adminProfile } = await supabase
        .from('admin_profiles')
        .select('max_locations')
        .eq('user_id', user?.id || '')
        .single();

      const { data: clientInspections, count: uniqueClients } = await supabase
        .from('inspections')
        .select('user_id', { count: 'exact' })
        .eq('admin_id', user?.id || '');

      // Count unique clients
      const uniqueClientIds = clientInspections 
        ? new Set(clientInspections.map(i => i.user_id).filter(Boolean))
        : new Set();

      setQuota({
        current: uniqueClientIds.size,
        max: adminProfile?.max_locations || 0
      });

      // Load properties of admin's clients
      const { data: inspections } = await supabase
        .from('inspections')
        .select('*')
        .eq('admin_id', user?.id || '')
        .order('created_at', { ascending: false });

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
            <Building className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
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
          <CreatePropertyDialog onPropertyCreated={loadData} />
          <CreateClientDialog onClientCreated={loadData} />
          <CreateLocationDialog onLocationCreated={loadData} />
        </div>

        {/* Quota Card */}
        <Card>
          <CardHeader>
            <CardTitle>Quota de Locations</CardTitle>
            <CardDescription>
              Nombre de clients/locations que vous pouvez gérer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">{quota.current}</span>
              <span className="text-xl text-muted-foreground">/ {quota.max}</span>
            </div>
            <div className="mt-2 w-full bg-secondary rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${Math.min((quota.current / quota.max) * 100, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>

        {/* Properties Management */}
        <Card>
          <CardHeader>
            <CardTitle>Biens Immobiliers de vos Clients</CardTitle>
            <CardDescription>États des lieux gérés</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bien</TableHead>
                  <TableHead>Client ID</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {properties.map((property) => (
                  <TableRow key={property.id}>
                    <TableCell className="font-medium">{property.property_name}</TableCell>
                    <TableCell className="font-mono text-sm">{property.user_id.substring(0, 8)}...</TableCell>
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
