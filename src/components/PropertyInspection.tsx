import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, XCircle, Camera, MessageSquare, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Import des images
import chambre1_1 from "@/assets/chambre1-1.jpg";
import chambre1_2 from "@/assets/chambre1-2.jpg";
import chambre1_3 from "@/assets/chambre1-3.jpg";
import chambre1_4 from "@/assets/chambre1-4.jpg";
import chambre2_1 from "@/assets/chambre2-1.jpg";
import chambre2_2 from "@/assets/chambre2-2.jpg";
import chambre2_3 from "@/assets/chambre2-3.jpg";
import cuisineMeubles1 from "@/assets/cuisine-meubles-1.jpg";
import cuisineMeubles2 from "@/assets/cuisine-meubles-2.jpg";
import cuisineMeubles3 from "@/assets/cuisine-meubles-3.jpg";
import cuisineFour from "@/assets/cuisine-four.jpg";
import cuisineFrigo from "@/assets/cuisine-frigo.jpg";
import cuisineCouvert from "@/assets/cuisine-couvert.jpg";
import salonTv1 from "@/assets/salon-tv-1.jpg";
import salonTv2 from "@/assets/salon-tv-2.jpg";
import salonTv3 from "@/assets/salon-tv-3.jpg";
import salonCanape1 from "@/assets/salon-canape-1.jpg";
import salonCanape2 from "@/assets/salon-canape-2.jpg";
import salonCanape3 from "@/assets/salon-canape-3.jpg";

interface InspectionItem {
  id: string;
  name: string;
  photos: string[];
  status: 'pending' | 'ok' | 'issue' | 'na';
  comment?: string;
  userPhotos?: string[];
}

interface InspectionStep {
  id: string;
  title: string;
  items: InspectionItem[];
}

const inspectionSteps: InspectionStep[] = [
  {
    id: 'chambre1',
    title: 'Chambre 1',
    items: [
      {
        id: 'chambre1-main',
        name: 'Chambre 1',
        photos: [chambre1_1, chambre1_2, chambre1_3, chambre1_4],
        status: 'pending'
      }
    ]
  },
  {
    id: 'chambre2',
    title: 'Chambre 2', 
    items: [
      {
        id: 'chambre2-main',
        name: 'Chambre 2',
        photos: [chambre2_1, chambre2_2, chambre2_3],
        status: 'pending'
      }
    ]
  },
  {
    id: 'cuisine',
    title: 'Cuisine',
    items: [
      {
        id: 'cuisine-meubles',
        name: 'Meubles',
        photos: [cuisineMeubles1, cuisineMeubles2, cuisineMeubles3],
        status: 'pending'
      },
      {
        id: 'cuisine-four',
        name: 'Four',
        photos: [cuisineFour],
        status: 'pending'
      },
      {
        id: 'cuisine-frigo',
        name: 'Frigo',
        photos: [cuisineFrigo],
        status: 'pending'
      },
      {
        id: 'cuisine-couvert',
        name: 'Couverts',
        photos: [cuisineCouvert],
        status: 'pending'
      }
    ]
  },
  {
    id: 'salon',
    title: 'Salon',
    items: [
      {
        id: 'salon-tv',
        name: 'TV',
        photos: [salonTv1, salonTv2, salonTv3],
        status: 'pending'
      },
      {
        id: 'salon-canape',
        name: 'Canapé',
        photos: [salonCanape1, salonCanape2, salonCanape3],
        status: 'pending'
      }
    ]
  }
];

export default function PropertyInspection() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [steps, setSteps] = useState<InspectionStep[]>(inspectionSteps);
  const [currentView, setCurrentView] = useState<'inspection' | 'summary' | 'signature'>('inspection');
  const { toast } = useToast();

  const updateItemStatus = (stepId: string, itemId: string, status: InspectionItem['status']) => {
    setSteps(steps.map(step => 
      step.id === stepId ? {
        ...step,
        items: step.items.map(item => 
          item.id === itemId ? { ...item, status } : item
        )
      } : step
    ));
  };

  const updateItemComment = (stepId: string, itemId: string, comment: string) => {
    setSteps(steps.map(step => 
      step.id === stepId ? {
        ...step,
        items: step.items.map(item => 
          item.id === itemId ? { ...item, comment } : item
        )
      } : step
    ));
  };

  const addUserPhoto = (stepId: string, itemId: string) => {
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

  const getAllItems = () => {
    return steps.flatMap(step => step.items);
  };

  const completedItems = getAllItems().filter(item => item.status !== 'pending').length;
  const totalItems = getAllItems().length;
  const progressPercentage = (completedItems / totalItems) * 100;

  const currentStep = steps[currentStepIndex];

  const nextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      setCurrentView('summary');
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  if (currentView === 'summary') {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Récapitulatif de l'état des lieux</h1>
          <p className="text-muted-foreground">Vérifiez les informations avant signature</p>
        </div>

        <div className="grid gap-4">
          {steps.map((step) => (
            <Card key={step.id} className="border border-border">
              <CardHeader>
                <CardTitle className="text-xl text-card-foreground">{step.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {step.items.map((item) => (
                  <div key={item.id} className="border-l-4 border-l-primary pl-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getStatusIcon(item.status)}
                          <h3 className="font-semibold text-card-foreground">{item.name}</h3>
                          {getStatusBadge(item.status)}
                        </div>
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
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex gap-4 justify-center">
          <Button variant="outline" onClick={() => setCurrentView('inspection')}>
            Retour à l'inspection
          </Button>
          <Button onClick={() => setCurrentView('signature')} className="bg-primary text-primary-foreground">
            Procéder à la signature
          </Button>
        </div>
      </div>
    );
  }

  if (currentView === 'signature') {
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
                <MessageSquare className="h-12 w-12 mx-auto mb-2" />
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
            <span className="text-sm font-medium text-card-foreground">Progression globale</span>
            <span className="text-sm text-muted-foreground">{completedItems}/{totalItems}</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Step Navigation */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Étape {currentStepIndex + 1} sur {steps.length}</span>
              <h2 className="text-xl font-semibold text-card-foreground">{currentStep.title}</h2>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={prevStep}
                disabled={currentStepIndex === 0}
              >
                <ChevronLeft className="h-4 w-4" />
                Précédent
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={nextStep}
              >
                {currentStepIndex === steps.length - 1 ? 'Terminer' : 'Suivant'}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Step Items */}
      <div className="grid gap-6">
        {currentStep.items.map((item) => (
          <Card key={item.id} className="border border-border hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-card-foreground">
                  {item.name}
                </CardTitle>
                {getStatusBadge(item.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Photos par défaut */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {item.photos.map((photo, index) => (
                  <div key={index} className="relative">
                    <img 
                      src={photo} 
                      alt={`${item.name} - Photo ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-border"
                    />
                  </div>
                ))}
              </div>

              {/* Status Buttons */}
              <div className="flex gap-2">
                <Button
                  variant={item.status === 'ok' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateItemStatus(currentStep.id, item.id, 'ok')}
                  className={item.status === 'ok' ? 'bg-success text-success-foreground' : ''}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  OK
                </Button>
                <Button
                  variant={item.status === 'issue' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateItemStatus(currentStep.id, item.id, 'issue')}
                  className={item.status === 'issue' ? 'bg-destructive text-destructive-foreground' : ''}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Problème
                </Button>
                <Button
                  variant={item.status === 'na' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateItemStatus(currentStep.id, item.id, 'na')}
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
                  onChange={(e) => updateItemComment(currentStep.id, item.id, e.target.value)}
                  className="min-h-[80px] resize-none"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addUserPhoto(currentStep.id, item.id)}
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
    </div>
  );
}