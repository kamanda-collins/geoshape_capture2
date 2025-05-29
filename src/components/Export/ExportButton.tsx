
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Download, FileText, Image, Share2 } from 'lucide-react';
import { useAuth } from '@/components/Auth/AuthProvider';
import { AuthModal } from '@/components/Auth/AuthModal';
import { useToast } from '@/hooks/use-toast';

interface ExportButtonProps {
  currentShape: any;
  onExport?: (format: 'pdf' | 'png' | 'geojson') => void;
}

export const ExportButton: React.FC<ExportButtonProps> = ({ currentShape, onExport }) => {
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleExportClick = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setShowExportDialog(true);
  };

  const handleExport = async (format: 'pdf' | 'png' | 'geojson') => {
    if (!currentShape) {
      toast({
        title: "No shape to export",
        description: "Please draw a shape on the map first.",
        variant: "destructive"
      });
      return;
    }

    try {
      if (format === 'geojson') {
        const dataStr = JSON.stringify(currentShape, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `shape-${Date.now()}.geojson`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else if (format === 'png') {
        await exportMapAsImage();
      } else if (format === 'pdf') {
        await exportMapAsPDF();
      }

      toast({
        title: "Export successful",
        description: `Map exported as ${format.toUpperCase()}`
      });
      
      setShowExportDialog(false);
      if (onExport) onExport(format);
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: "Export failed",
        description: "There was an error exporting your map.",
        variant: "destructive"
      });
    }
  };

  const exportMapAsImage = async () => {
    const mapContainer = document.querySelector('.leaflet-container') as HTMLElement;
    if (!mapContainer) throw new Error('Map container not found');

    const { default: html2canvas } = await import('html2canvas');
    const canvas = await html2canvas(mapContainer, {
      useCORS: true,
      allowTaint: true,
      scale: 2
    });
    
    const link = document.createElement('a');
    link.download = `map-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const exportMapAsPDF = async () => {
    const mapContainer = document.querySelector('.leaflet-container') as HTMLElement;
    if (!mapContainer) throw new Error('Map container not found');

    const { default: html2canvas } = await import('html2canvas');
    const { jsPDF } = await import('jspdf');
    
    const canvas = await html2canvas(mapContainer, {
      useCORS: true,
      allowTaint: true,
      scale: 2
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });
    
    const imgWidth = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.setFontSize(10);
    pdf.text(`Generated on ${new Date().toLocaleDateString()}`, 10, imgHeight + 10);
    pdf.save(`map-${Date.now()}.pdf`);
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    setShowExportDialog(true);
  };

  return (
    <>
      <Button onClick={handleExportClick} className="flex items-center gap-2">
        <Share2 className="h-4 w-4" />
        Export Map
      </Button>

      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Your Map</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Button
              onClick={() => handleExport('png')}
              className="flex items-center gap-2 justify-start"
              variant="outline"
            >
              <Image className="h-4 w-4" />
              Export as PNG Image
            </Button>
            <Button
              onClick={() => handleExport('pdf')}
              className="flex items-center gap-2 justify-start"
              variant="outline"
            >
              <FileText className="h-4 w-4" />
              Export as PDF
            </Button>
            <Button
              onClick={() => handleExport('geojson')}
              className="flex items-center gap-2 justify-start"
              variant="outline"
            >
              <Download className="h-4 w-4" />
              Download GeoJSON
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AuthModal 
        open={showAuthModal} 
        onOpenChange={setShowAuthModal}
        onAuthSuccess={handleAuthSuccess}
      />
    </>
  );
};
