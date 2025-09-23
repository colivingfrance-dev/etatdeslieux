import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CheckCircle, AlertCircle, XCircle, Camera, MessageSquare, ChevronLeft, ChevronRight, Upload, X, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [reportId, setReportId] = useState<string | null>(null);
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

  const generatePDF = async () => {
    if (!inspectionId || !user) return;
    
    setPdfGenerating(true);
    try {
      // Récupérer la signature du canvas
      const canvas = document.getElementById('signature-canvas') as HTMLCanvasElement;
      const signatureData = canvas ? canvas.toDataURL() : '';

      // Créer le PDF avec jsPDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // En-tête - Titre principal
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('État des lieux : Félicie', pageWidth / 2, 25, { align: 'center' });
      
      // Sous-titre avec date et email
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      const signatureDate = new Date().toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      pdf.text(`Date de signature : ${signatureDate}`, pageWidth / 2, 35, { align: 'center' });
      pdf.text(`Créé par : ${user.email}`, pageWidth / 2, 42, { align: 'center' });
      
      let yPosition = 60;
      
      // Données de l'inspection - Style récapitulatif
      for (const step of steps) {
        // Vérifier l'espace disponible pour le titre de section
        if (yPosition > pageHeight - 50) {
          pdf.addPage();
          yPosition = 20;
        }
        
        // Titre de section avec ligne de séparation
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        pdf.text(step.title, 20, yPosition);
        pdf.setDrawColor(59, 130, 246); // couleur primary
        pdf.line(20, yPosition + 2, pageWidth - 20, yPosition + 2);
        yPosition += 15;
        
        for (const item of step.items) {
          // Vérifier l'espace pour chaque item
          if (yPosition > pageHeight - 40) {
            pdf.addPage();
            yPosition = 20;
          }
          
          // Nom de l'item avec statut
          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'bold');
          pdf.text(item.name, 25, yPosition);
          
          // Badge de statut
          const statusText = item.status === 'ok' ? 'OK' : 
                            item.status === 'issue' ? 'PROBLÈME' : 
                            item.status === 'na' ? 'N/A' : 'À VÉRIFIER';
          const statusColor = item.status === 'ok' ? [34, 197, 94] : 
                             item.status === 'issue' ? [239, 68, 68] : 
                             item.status === 'na' ? [156, 163, 175] : [245, 158, 11];
          
          const statusWidth = pdf.getTextWidth(statusText) + 6;
          pdf.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
          pdf.roundedRect(pageWidth - 25 - statusWidth, yPosition - 5, statusWidth, 8, 2, 2, 'F');
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(10);
          pdf.text(statusText, pageWidth - 22 - statusWidth / 2, yPosition, { align: 'center' });
          pdf.setTextColor(0, 0, 0); // Reset color
          
          yPosition += 12;
          
          // Commentaire si présent
          if (item.comment) {
            pdf.setFontSize(11);
            pdf.setFont('helvetica', 'italic');
            pdf.setFillColor(245, 245, 245);
            
            const commentLines = pdf.splitTextToSize(`💬 ${item.comment}`, pageWidth - 60);
            const commentHeight = commentLines.length * 5 + 6;
            pdf.roundedRect(30, yPosition - 2, pageWidth - 60, commentHeight, 2, 2, 'F');
            pdf.text(commentLines, 35, yPosition + 3);
            yPosition += commentHeight + 5;
          }
          
          // Photos des problèmes - affichage en 2 colonnes comme dans le récapitulatif
          if (item.userPhotos && item.userPhotos.length > 0) {
            pdf.setFontSize(11);
            pdf.setFont('helvetica', 'bold');
            pdf.text(`📷 Photos du problème (${item.userPhotos.length}) :`, 30, yPosition);
            yPosition += 8;
            
            // Affichage des photos en 2 colonnes
            const photoWidth = (pageWidth - 80) / 2;
            const photoHeight = 25;
            let photoX = 35;
            let photoCount = 0;
            
            for (const photo of item.userPhotos) {
              if (yPosition + photoHeight + 15 > pageHeight - 20) {
                pdf.addPage();
                yPosition = 20;
                photoX = 35;
                photoCount = 0;
              }
              
              try {
                if (photo.url) {
                  // Dessiner un rectangle pour représenter la photo
                  pdf.setDrawColor(239, 68, 68);
                  pdf.setLineWidth(1);
                  pdf.rect(photoX, yPosition, photoWidth - 5, photoHeight);
                  
                  // Texte indicatif de la photo
                  pdf.setFontSize(9);
                  pdf.setFont('helvetica', 'normal');
                  pdf.text(`Photo ${photoCount + 1}`, photoX + 2, yPosition + 5);
                  
                  // Commentaire de la photo
                  if (photo.comment) {
                    const photoCommentLines = pdf.splitTextToSize(`"${photo.comment}"`, photoWidth - 10);
                    pdf.text(photoCommentLines, photoX + 2, yPosition + 10);
                  }
                }
              } catch (error) {
                console.warn('Erreur lors de l\'ajout de la photo:', error);
              }
              
              photoCount++;
              if (photoCount % 2 === 0) {
                // Passer à la ligne suivante après 2 photos
                yPosition += photoHeight + 5;
                photoX = 35;
              } else {
                // Passer à la colonne suivante
                photoX += photoWidth + 5;
              }
            }
            
            // Ajuster yPosition si nombre impair de photos
            if (item.userPhotos.length % 2 !== 0) {
              yPosition += photoHeight + 5;
            }
          }
          
          yPosition += 8;
        }
        yPosition += 10;
      }
      
      // Signature
      if (yPosition > pageHeight - 80) {
        pdf.addPage();
        yPosition = 20;
      }
      
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Signature électronique', 20, yPosition);
      yPosition += 15;
      
      if (signatureData && signatureData !== 'data:,') {
        try {
          pdf.addImage(signatureData, 'PNG', 20, yPosition, 100, 50);
        } catch (error) {
          console.warn('Erreur lors de l\'ajout de la signature:', error);
        }
      }
      
      // Convertir le PDF en blob
      const pdfBlob = pdf.output('blob');
      
      // Générer un nom de fichier unique avec timestamp pour éviter les conflits
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `etat_des_lieux_felicie_${timestamp}.pdf`;
      
      // Stocker le PDF dans Supabase Storage avec l'option upsert pour éviter l'erreur
      const filePath = `${user.id}/reports/${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from('inspection-photos')
        .upload(filePath, pdfBlob, {
          upsert: true // Permet d'écraser le fichier s'il existe
        });
      
      if (uploadError) throw uploadError;
      
      // Enregistrer les métadonnées du rapport dans la DB
      const { data: report, error: reportError } = await supabase
        .from('inspection_reports')
        .insert({
          inspection_id: inspectionId,
          file_path: filePath,
          file_name: fileName,
          file_size: pdfBlob.size,
          signature_data: signatureData
        })
        .select()
        .single();
      
      if (reportError) throw reportError;
      
      setReportId(report.id);
      
      // Télécharger le PDF
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: "PDF généré avec succès",
        description: "Le rapport a été téléchargé et sauvegardé",
      });
      
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer le PDF",
        variant: "destructive"
      });
    } finally {
      setPdfGenerating(false);
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
      
      // Générer le PDF automatiquement après la signature
      await generatePDF();
      
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
                             <div className="grid grid-cols-2 gap-3">
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
            <div className="relative">
              <canvas
                id="signature-canvas"
                width="400"
                height="200"
                className="w-full h-48 border-2 border-dashed border-border rounded-lg bg-muted/20 cursor-crosshair touch-none"
                onMouseDown={(e) => {
                  const canvas = e.currentTarget;
                  const ctx = canvas.getContext('2d');
                  if (!ctx) return;
                  
                  const rect = canvas.getBoundingClientRect();
                  const x = (e.clientX - rect.left) * (canvas.width / rect.width);
                  const y = (e.clientY - rect.top) * (canvas.height / rect.height);
                  
                  ctx.beginPath();
                  ctx.moveTo(x, y);
                  canvas.setAttribute('data-drawing', 'true');
                }}
                onMouseMove={(e) => {
                  const canvas = e.currentTarget;
                  const ctx = canvas.getContext('2d');
                  if (!ctx || canvas.getAttribute('data-drawing') !== 'true') return;
                  
                  const rect = canvas.getBoundingClientRect();
                  const x = (e.clientX - rect.left) * (canvas.width / rect.width);
                  const y = (e.clientY - rect.top) * (canvas.height / rect.height);
                  
                  ctx.lineWidth = 2;
                  ctx.lineCap = 'round';
                  ctx.strokeStyle = '#000';
                  ctx.lineTo(x, y);
                  ctx.stroke();
                }}
                onMouseUp={(e) => {
                  const canvas = e.currentTarget;
                  canvas.removeAttribute('data-drawing');
                }}
                onTouchStart={(e) => {
                  e.preventDefault();
                  const canvas = e.currentTarget;
                  const ctx = canvas.getContext('2d');
                  if (!ctx) return;
                  
                  const rect = canvas.getBoundingClientRect();
                  const touch = e.touches[0];
                  const x = (touch.clientX - rect.left) * (canvas.width / rect.width);
                  const y = (touch.clientY - rect.top) * (canvas.height / rect.height);
                  
                  ctx.beginPath();
                  ctx.moveTo(x, y);
                  canvas.setAttribute('data-drawing', 'true');
                }}
                onTouchMove={(e) => {
                  e.preventDefault();
                  const canvas = e.currentTarget;
                  const ctx = canvas.getContext('2d');
                  if (!ctx || canvas.getAttribute('data-drawing') !== 'true') return;
                  
                  const rect = canvas.getBoundingClientRect();
                  const touch = e.touches[0];
                  const x = (touch.clientX - rect.left) * (canvas.width / rect.width);
                  const y = (touch.clientY - rect.top) * (canvas.height / rect.height);
                  
                  ctx.lineWidth = 2;
                  ctx.lineCap = 'round';
                  ctx.strokeStyle = '#000';
                  ctx.lineTo(x, y);
                  ctx.stroke();
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  const canvas = e.currentTarget;
                  canvas.removeAttribute('data-drawing');
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center text-muted-foreground">
                  <p className="text-sm">Zone de signature - Dessinez votre signature</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => {
                  const canvas = document.getElementById('signature-canvas') as HTMLCanvasElement;
                  if (canvas) {
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                      ctx.clearRect(0, 0, canvas.width, canvas.height);
                    }
                  }
                }}
              >
                Effacer
              </Button>
            </div>
            
            <div className="text-sm text-muted-foreground space-y-2">
              <p>En signant ce document, je confirme avoir vérifié l'état du logement et accepte les constats effectués.</p>
              <p>Date: {new Date().toLocaleDateString('fr-FR')}</p>
            </div>

            <Button 
              className="w-full bg-primary text-primary-foreground" 
              onClick={handleSignature}
              disabled={signingInProgress || pdfGenerating}
            >
              {signingInProgress ? "Signature en cours..." : pdfGenerating ? "Génération du PDF..." : "Signer et finaliser"}
            </Button>
            
            {isSignatureSaved && (
              <div className="space-y-2">
                {reportId && (
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={generatePDF}
                    disabled={pdfGenerating}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {pdfGenerating ? "Génération..." : "Télécharger le PDF"}
                  </Button>
                )}
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={handleReturnToLogin}
                >
                  Retour à la page de connexion
                </Button>
              </div>
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
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm pb-4">
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

        {/* Step Navigation - Integrated */}
        <Card className="mt-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">Étape {currentStepIndex + 1}/{steps.length}</span>
                <h2 className="text-sm sm:text-lg md:text-xl font-semibold text-card-foreground truncate">{currentStep.title}</h2>
              </div>
              <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="px-2 sm:px-4 text-xs sm:text-sm"
                  onClick={prevStep}
                  disabled={currentStepIndex === 0}
                >
                  <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Précédent</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="px-2 sm:px-4 text-xs sm:text-sm"
                  onClick={nextStep}
                >
                  <span className="hidden sm:inline">{currentStepIndex === steps.length - 1 ? 'Terminer' : 'Suivant'}</span>
                  <span className="sm:hidden">{currentStepIndex === steps.length - 1 ? 'Fin' : ''}</span>
                  <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                 {item.photos.map((photo, index) => (
                   <div key={index} className="relative">
                      <img 
                        src={photo} 
                        alt={`${item.name} - Photo ${index + 1}`}
                        width="188"
                        height="128"
                        loading="lazy"
                        decoding="async"
                        className="w-full h-32 sm:h-32 aspect-square sm:aspect-auto object-cover rounded-lg border border-border cursor-pointer hover:opacity-80 transition-opacity"
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
                           <div className="grid grid-cols-2 gap-3">
                            {item.userPhotos.map((photo, photoIndex) => (
                              <div key={photoIndex} className="border border-destructive/20 rounded-lg p-2 bg-destructive/5">
                                {photo.url && (
                                  <img 
                                    src={photo.url} 
                                    alt={`Problème ${item.name} - Photo ${photoIndex + 1}`}
                                    width="188"
                                    height="128"
                                    loading="lazy"
                                    decoding="async"
                                    className="w-full h-32 sm:h-32 aspect-square sm:aspect-auto object-cover rounded-lg border-2 border-destructive cursor-pointer hover:opacity-80 transition-opacity mb-2"
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
              className="absolute top-4 right-4 z-20 text-white hover:bg-white/20 h-24 w-24"
              onClick={() => setFullscreenImage(null)}
            >
              <X className="h-16 w-16" />
            </Button>
            
            {/* Navigation arrows - zone étendue jusqu'aux bords */}
            {allPhotosForFullscreen.length > 1 && fullscreenImage && (
              <>
                {/* Zone cliquable à gauche - étendue jusqu'au bord gauche */}
                <div
                  className="absolute left-0 top-0 w-1/2 h-full z-10 flex items-center justify-start pl-8 cursor-pointer"
                  onClick={() => {
                    const prevIndex = fullscreenImageIndex > 0 ? fullscreenImageIndex - 1 : allPhotosForFullscreen.length - 1;
                    setFullscreenImageIndex(prevIndex);
                    setFullscreenImage(allPhotosForFullscreen[prevIndex]);
                  }}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20 pointer-events-none h-16 w-16"
                  >
                    <ChevronLeft className="h-16 w-16" />
                  </Button>
                </div>
                
                {/* Zone cliquable à droite - étendue jusqu'au bord droit */}
                <div
                  className="absolute right-0 top-0 w-1/2 h-full z-10 flex items-center justify-end pr-8 cursor-pointer"
                  onClick={() => {
                    const nextIndex = fullscreenImageIndex < allPhotosForFullscreen.length - 1 ? fullscreenImageIndex + 1 : 0;
                    setFullscreenImageIndex(nextIndex);
                    setFullscreenImage(allPhotosForFullscreen[nextIndex]);
                  }}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20 pointer-events-none h-16 w-16"
                  >
                    <ChevronRight className="h-16 w-16" />
                  </Button>
                </div>
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