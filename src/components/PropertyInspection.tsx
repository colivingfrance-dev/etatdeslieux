import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, XCircle, Camera, MessageSquare, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface InspectionItem {
  id: string;
  category: string;
  item: string;
  description: string;
  status: 'pending' | 'ok' | 'issue' | 'na';
  comment?: string;
  photos?: string[];
}

const mockItems: InspectionItem[] = [
  {
    id: '1',
    category: 'Salon',
    item: 'Murs et peinture',
    description: 'Vérifier l\'état des murs, absence de trous, rayures ou taches',
    status: 'pending'
  },
  {
    id: '2',
    category: 'Salon',
    item: 'Sol et revêtement',
    description: 'Contrôler l\'état du parquet, carrelage ou moquette',
    status: 'pending'
  },
  {
    id: '3',
    category: 'Cuisine',
    item: 'Électroménager',
    description: 'Test de fonctionnement des appareils (frigo, four, plaques)',
    status: 'pending'
  },
  {
    id: '4',
    category: 'Cuisine',
    item: 'Robinetterie',
    description: 'Vérifier l\'étanchéité et le bon fonctionnement',
    status: 'pending'
  },
  {
    id: '5',
    category: 'Salle de bain',
    item: 'Sanitaires',
    description: 'État des toilettes, lavabo, douche/baignoire',
    status: 'pending'
  },
  {
    id: '6',
    category: 'Chambre',
    item: 'Literie',
    description: 'Propreté et état du matelas, oreillers, draps',
    status: 'pending'
  }
];

export default function PropertyInspection() {
  const [items, setItems] = useState<InspectionItem[]>(mockItems);
  const [currentStep, setCurrentStep] = useState<'inspection' | 'summary' | 'signature'>('inspection');
  const { toast } = useToast();

  const updateItemStatus = (id: string, status: InspectionItem['status']) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, status } : item
    ));
  };

  const updateItemComment = (id: string, comment: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, comment } : item
    ));
  };

  const addPhoto = (id: string) => {
    toast({
      title: "Fonctionnalité à venir",
      description: "L'ajout de photos sera disponible après connexion à Supabase",
    });
  };

  const getStatusIcon = (status: InspectionItem['status']) => {
    switch (status) {
      case 'ok':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'issue':
        return <XCircle className="h-5 w-5 text-destructive" />;
      case 'na':
        return <AlertCircle className="h-5 w-5 text-warning" />;
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: InspectionItem['status']) => {
    switch (status) {
      case 'ok':
        return <Badge className="bg-success text-success-foreground">OK</Badge>;
      case 'issue':
        return <Badge className="bg-destructive text-destructive-foreground">Problème</Badge>;
      case 'na':
        return <Badge className="bg-warning text-warning-foreground">N/A</Badge>;
      default:
        return <Badge variant="outline">À vérifier</Badge>;
    }
  };

  const completedItems = items.filter(item => item.status !== 'pending').length;
  const progressPercentage = (completedItems / items.length) * 100;

  if (currentStep === 'summary') {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Récapitulatif de l'état des lieux</h1>
          <p className="text-muted-foreground">Vérifiez les informations avant signature</p>
        </div>

        <div className="grid gap-4">
          {items.map((item) => (
            <Card key={item.id} className="border border-border">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(item.status)}
                      <h3 className="font-semibold text-card-foreground">{item.category} - {item.item}</h3>
                      {getStatusBadge(item.status)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                    {item.comment && (
                      <div className="bg-muted p-3 rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          <MessageSquare className="h-4 w-4 inline mr-1" />
                          {item.comment}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex gap-4 justify-center">
          <Button variant="outline" onClick={() => setCurrentStep('inspection')}>
            Retour à l'inspection
          </Button>
          <Button onClick={() => setCurrentStep('signature')} className="bg-primary text-primary-foreground">
            Procéder à la signature
          </Button>
        </div>
      </div>
    );
  }

  if (currentStep === 'signature') {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Signature électronique</h1>
          <p className="text-muted-foreground">Signez pour valider l'état des lieux</p>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="h-48 border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-muted/20">
              <div className="text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-2" />
                <p>Zone de signature</p>
                <p className="text-sm">(Fonctionnalité disponible après connexion Supabase)</p>
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground space-y-2">
              <p>En signant ce document, je confirme avoir vérifié l'état du logement et accepte les constats effectués.</p>
              <p>Date: {new Date().toLocaleDateString('fr-FR')}</p>
            </div>

            <Button className="w-full bg-primary text-primary-foreground" onClick={() => {
              toast({
                title: "Signature enregistrée",
                description: "L'état des lieux a été finalisé avec succès",
              });
            }}>
              Signer et finaliser
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">État des lieux - Airbnb</h1>
        <p className="text-muted-foreground">Vérifiez chaque élément et validez l'état du logement</p>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-card-foreground">Progression</span>
            <span className="text-sm text-muted-foreground">{completedItems}/{items.length}</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Inspection Items */}
      <div className="grid gap-4">
        {items.map((item) => (
          <Card key={item.id} className="border border-border hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-card-foreground">
                  {item.category} - {item.item}
                </CardTitle>
                {getStatusBadge(item.status)}
              </div>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status Buttons */}
              <div className="flex gap-2">
                <Button
                  variant={item.status === 'ok' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateItemStatus(item.id, 'ok')}
                  className={item.status === 'ok' ? 'bg-success text-success-foreground' : ''}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  OK
                </Button>
                <Button
                  variant={item.status === 'issue' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateItemStatus(item.id, 'issue')}
                  className={item.status === 'issue' ? 'bg-destructive text-destructive-foreground' : ''}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Problème
                </Button>
                <Button
                  variant={item.status === 'na' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateItemStatus(item.id, 'na')}
                  className={item.status === 'na' ? 'bg-warning text-warning-foreground' : ''}
                >
                  <AlertCircle className="h-4 w-4 mr-1" />
                  N/A
                </Button>
              </div>

              {/* Comment Section */}
              <div className="space-y-2">
                <Textarea
                  placeholder="Ajouter un commentaire (optionnel)..."
                  value={item.comment || ''}
                  onChange={(e) => updateItemComment(item.id, e.target.value)}
                  className="min-h-[80px] resize-none"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addPhoto(item.id)}
                  className="w-full"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Ajouter une photo
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center">
        <Button 
          onClick={() => setCurrentStep('summary')}
          disabled={completedItems === 0}
          className="bg-primary text-primary-foreground px-8"
        >
          Voir le récapitulatif ({completedItems}/{items.length})
        </Button>
      </div>
    </div>
  );
}