import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CheckCircle, AlertCircle, XCircle, Camera, MessageSquare, ChevronLeft, ChevronRight, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

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
  userPhotos?: Array<{url: string; comment: string}>;
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [steps, setSteps] = useState<InspectionStep[]>(inspectionSteps);
  const [currentView, setCurrentView] = useState<'inspection' | 'summary' | 'signature'>('inspection');
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{stepId: string, itemId: string} | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [currentPhotoComment, setCurrentPhotoComment] = useState('');
  const [inspectionId, setInspectionId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [fullscreenImageIndex, setFullscreenImageIndex] = useState(0);
  const [allPhotosForFullscreen, setAllPhotosForFullscreen] = useState<string[]>([]);
  const [isSignatureSaved, setIsSignatureSaved] = useState(false);
  const [signingInProgress, setSigningInProgress] = useState(false);
  const { toast } = useToast();

  // Créer une nouvelle inspection au démarrage
  useEffect(() => {
    if (user && !inspectionId) {
      createInspection();
    }
  }, [user]);

  const createInspection = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('inspections')
        .insert({
          user_id: user.id,
          property_name: 'Appartement Airbnb',
          status: 'in_progress'
        })
        .select()
        .single();

      if (error) throw error;
      setInspectionId(data.id);
    } catch (error) {
      console.error('Erreur lors de la création de l\'inspection:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer l'inspection",
        variant: "destructive"
      });
    }
  };

  const updateItemStatus = (stepId: string, itemId: string, status: InspectionItem['status']) => {
    if (status === 'issue') {
      setSelectedItem({stepId, itemId});
      setPhotoDialogOpen(true);
      return;
    }
    
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

  const uploadToStorage = async (file: File, itemName: string) => {
    if (!user) throw new Error('Utilisateur non connecté');
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('inspection-photos')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    return {
      filePath,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type
    };
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const confirmProblem = async () => {
    if (!selectedItem || !inspectionId) return;
    setSaving(true);
    
    try {
      const currentItem = steps
        .find(step => step.id === selectedItem.stepId)
        ?.items.find(item => item.id === selectedItem.itemId);
      
      const isNewProblem = currentItem?.status !== 'issue';
      
      // Vérifier qu'il y a au moins une photo ou un commentaire
      if (!uploadedFile && !currentPhotoComment.trim()) {
        toast({
          title: "Photo ou commentaire requis",
          description: "Veuillez ajouter une photo ou un commentaire",
          variant: "destructive"
        });
        setSaving(false);
        return;
      }

      // Créer ou mettre à jour l'élément dans la DB
      const { data: inspectionItem, error: itemError } = await supabase
        .from('inspection_items')
        .upsert({
          inspection_id: inspectionId,
          step_id: selectedItem.stepId,
          item_id: selectedItem.itemId,
          name: currentItem?.name || '',
          status: isNewProblem ? 'issue' : currentItem?.status || 'pending',
          comment: currentItem?.comment || ''
        }, {
          onConflict: 'inspection_id,step_id,item_id'
        })
        .select()
        .single();

      if (itemError) throw itemError;

      let photoUrl = null;
      
      // Upload de la photo si présente
      if (uploadedFile && inspectionItem) {
        const photoData = await uploadToStorage(uploadedFile, currentItem?.name || 'item');
        
        const { error: photoError } = await supabase
          .from('inspection_photos')
          .insert({
            inspection_item_id: inspectionItem.id,
            file_path: photoData.filePath,
            file_name: photoData.fileName,
            file_size: photoData.fileSize,
            mime_type: photoData.mimeType,
            is_user_photo: true
          });

        if (photoError) throw photoError;

        // Récupérer l'URL publique de la photo
        const { data: { publicUrl } } = supabase.storage
          .from('inspection-photos')
          .getPublicUrl(photoData.filePath);
        
        photoUrl = publicUrl;
      }

      // Mettre à jour l'état local avec photo et commentaire individuels
      setSteps(steps.map(step => 
        step.id === selectedItem.stepId ? {
          ...step,
          items: step.items.map(item => 
            item.id === selectedItem.itemId ? { 
              ...item, 
              status: isNewProblem ? 'issue' : (item.status || 'pending'),
              userPhotos: [...(item.userPhotos || []), {
                url: photoUrl || '',
                comment: currentPhotoComment.trim()
              }].filter(photo => photo.url || photo.comment)
            } : item
          )
        } : step
      ));

      toast({
        title: uploadedFile || currentPhotoComment ? "Ajout enregistré" : "Commentaire enregistré",
        description: "Les informations ont été sauvegardées avec succès"
      });

      setPhotoDialogOpen(false);
      setSelectedItem(null);
      setUploadedFile(null);
      setCurrentPhotoComment('');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les données",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSignature = async () => {
    if (!inspectionId || !user) return;
    
    setSigningInProgress(true);
    try {
      // Mettre à jour le statut de l'inspection à 'completed'
      const { error } = await supabase
        .from('inspections')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', inspectionId);

      if (error) throw error;

      setIsSignatureSaved(true);
      toast({
        title: "Signature enregistrée",
        description: "L'état des lieux a été finalisé avec succès",
      });
    } catch (error) {
      console.error('Erreur lors de la signature:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la signature",
        variant: "destructive"
      });
    } finally {
      setSigningInProgress(false);
    }
  };

  const handleReturnToLogin = () => {
    navigate('/auth');
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

  const validateAllItems = () => {
    const allItems = getAllItems();
    const pendingItems = allItems.filter(item => item.status === 'pending');
    return pendingItems;
  };

  const scrollToFirstPendingItem = (pendingItems: InspectionItem[]) => {
    if (pendingItems.length === 0) return;
    
    const firstPendingItem = pendingItems[0];
    const stepWithPendingItem = steps.find(step => 
      step.items.some(item => item.id === firstPendingItem.id)
    );
    
    if (stepWithPendingItem) {
      const stepIndex = steps.findIndex(step => step.id === stepWithPendingItem.id);
      setCurrentStepIndex(stepIndex);
      
      toast({
        title: "Validation incomplète",
        description: `Veuillez valider l'élément "${firstPendingItem.name}" dans la section "${stepWithPendingItem.title}"`,
        variant: "destructive"
      });
    }
  };

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
                 {item.userPhotos && item.userPhotos.length > 0 && (
                           <div className="space-y-3">
                             <p className="text-sm font-medium text-card-foreground">Photos et commentaires du problème :</p>
                             <div className="grid grid-cols-4 gap-3">
                                {item.userPhotos.map((photo, photoIndex) => (
                                  <div key={photoIndex} className="border border-destructive/20 rounded-lg p-3 bg-destructive/5">
                                    {photo.url && (
                                      <img 
                                        src={photo.url} 
                                        alt={`Problème ${item.name} - Photo ${photoIndex + 1}`}
                                        className="w-full h-32 object-cover rounded-lg border-2 border-destructive cursor-pointer hover:opacity-80 transition-opacity mb-2"
                                        onClick={() => {
                                          const allPhotos = [...item.photos, ...(item.userPhotos?.map(p => p.url).filter(Boolean) || [])];
                                          const photoIndex = allPhotos.indexOf(photo.url);
                                          setAllPhotosForFullscreen(allPhotos);
                                          setFullscreenImageIndex(photoIndex);
                                          setFullscreenImage(photo.url);
                                        }}
                                      />
                                    )}
                                    {photo.comment && (
                                      <p className="text-sm text-card-foreground italic">"{photo.comment}"</p>
                                    )}
                                  </div>
                                ))}
                             </div>
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
          <Button onClick={() => {
            const pendingItems = validateAllItems();
            if (pendingItems.length > 0) {
              scrollToFirstPendingItem(pendingItems);
              setCurrentView('inspection');
              return;
            }
            setCurrentView('signature');
          }} className="bg-primary text-primary-foreground">
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

            <Button 
              className="w-full bg-primary text-primary-foreground" 
              onClick={handleSignature}
              disabled={signingInProgress}
            >
              {signingInProgress ? "Signature en cours..." : "Signer et finaliser"}
            </Button>
            
            {isSignatureSaved && (
              <Button 
                className="w-full mt-4" 
                variant="outline"
                onClick={handleReturnToLogin}
              >
                Retour à la page de connexion
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Etat des lieux - Félicie</h1>
        <p className="text-muted-foreground">Vérifiez chaque élément et validez l'état du logement</p>
      </div>

      {/* Progress Bar - Fixed */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border pb-4 mb-4">
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
      </div>

      {/* Step Navigation - Fixed */}
      <div className="sticky top-20 z-10 bg-background/95 backdrop-blur-sm border-b border-border pb-4 mb-4">
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
      </div>

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
      <div className="grid grid-cols-4 gap-4">
                 {item.photos.map((photo, index) => (
                   <div key={index} className="relative">
                      <img 
                        src={photo} 
                        alt={`${item.name} - Photo ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-border cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => {
                          const allPhotos = [...item.photos, ...(item.userPhotos?.map(p => p.url).filter(Boolean) || [])];
                          const photoIndex = allPhotos.indexOf(photo);
                          setAllPhotosForFullscreen(allPhotos);
                          setFullscreenImageIndex(photoIndex);
                          setFullscreenImage(photo);
                        }}
                      />
                   </div>
                 ))}
               </div>

               {/* Affichage des commentaires et photos utilisateur pour les problèmes */}
               {item.status === 'issue' && (item.comment || (item.userPhotos && item.userPhotos.length > 0)) && (
                 <div className="mt-4 space-y-3 border-t border-destructive/20 pt-3">
                   {item.comment && (
                     <div className="bg-destructive/5 p-3 rounded-lg border border-destructive/20">
                       <div className="flex items-start gap-2">
                         <MessageSquare className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                         <div>
                           <p className="text-sm font-medium text-destructive mb-1">Problème signalé :</p>
                           <p className="text-sm text-card-foreground">{item.comment}</p>
                         </div>
                       </div>
                     </div>
                   )}
                    {item.userPhotos && item.userPhotos.length > 0 && (
                      <div className="space-y-3">
                        <p className="text-sm font-medium text-destructive flex items-center gap-1">
                          <Camera className="h-4 w-4" />
                          Photos et commentaires du problème :
                        </p>
                          <div className="grid grid-cols-4 gap-3">
                           {item.userPhotos.map((photo, photoIndex) => (
                             <div key={photoIndex} className="border border-destructive/20 rounded-lg p-2 bg-destructive/5">
                               {photo.url && (
                                 <img 
                                   src={photo.url} 
                                   alt={`Problème ${item.name} - Photo ${photoIndex + 1}`}
                                   className="w-full h-32 object-cover rounded-lg border-2 border-destructive cursor-pointer hover:opacity-80 transition-opacity mb-2"
                                   onClick={() => {
                                     const allPhotos = [...item.photos, ...(item.userPhotos?.map(p => p.url).filter(Boolean) || [])];
                                     const photoIndex = allPhotos.indexOf(photo.url);
                                     setAllPhotosForFullscreen(allPhotos);
                                     setFullscreenImageIndex(photoIndex);
                                     setFullscreenImage(photo.url);
                                   }}
                                 />
                               )}
                               {photo.comment && (
                                 <p className="text-xs text-card-foreground italic">"{photo.comment}"</p>
                               )}
                             </div>
                           ))}
                         </div>
                      </div>
                    )}
                 </div>
               )}

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
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog pour signaler un problème */}
      <Dialog open={photoDialogOpen} onOpenChange={setPhotoDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {steps.find(step => step.id === selectedItem?.stepId)
                ?.items.find(item => item.id === selectedItem?.itemId)?.status === 'issue' 
                ? "Ajouter une photo au problème" 
                : "Ajouter une photo ou signaler un problème"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Ajouter une photo
              </label>
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="photo-upload"
                />
                <label
                  htmlFor="photo-upload"
                  className="cursor-pointer flex flex-col items-center space-y-2"
                >
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {uploadedFile ? uploadedFile.name : "Cliquez pour ajouter une photo"}
                  </span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Commentaire pour cette photo
              </label>
              <Textarea
                placeholder="Décrivez le problème observé sur cette photo..."
                value={currentPhotoComment}
                onChange={(e) => setCurrentPhotoComment(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setPhotoDialogOpen(false);
                setSelectedItem(null);
                setUploadedFile(null);
                setCurrentPhotoComment('');
              }}
            >
              Annuler
            </Button>
            <Button 
              onClick={confirmProblem}
              disabled={saving || (!uploadedFile && !currentPhotoComment.trim())}
            >
              {saving ? "Sauvegarde..." : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fullscreen Image Dialog */}
      <Dialog open={!!fullscreenImage} onOpenChange={() => setFullscreenImage(null)}>
        <DialogContent className="max-w-4xl w-full h-[90vh] p-0 bg-black/95">
          <div className="relative w-full h-full flex items-center justify-center">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
              onClick={() => setFullscreenImage(null)}
            >
              <X className="h-6 w-6" />
            </Button>
            
            {/* Navigation arrows */}
            {allPhotosForFullscreen.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20"
                  onClick={() => {
                    const prevIndex = fullscreenImageIndex > 0 ? fullscreenImageIndex - 1 : allPhotosForFullscreen.length - 1;
                    setFullscreenImageIndex(prevIndex);
                    setFullscreenImage(allPhotosForFullscreen[prevIndex]);
                  }}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20"
                  onClick={() => {
                    const nextIndex = fullscreenImageIndex < allPhotosForFullscreen.length - 1 ? fullscreenImageIndex + 1 : 0;
                    setFullscreenImageIndex(nextIndex);
                    setFullscreenImage(allPhotosForFullscreen[nextIndex]);
                  }}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </>
            )}
            
            {fullscreenImage && (
              <img
                src={fullscreenImage}
                alt="Image en plein écran"
                className="max-w-full max-h-full object-contain"
              />
            )}
            
            {/* Photo counter */}
            {allPhotosForFullscreen.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                {fullscreenImageIndex + 1} / {allPhotosForFullscreen.length}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}