
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, LogOut, MessageSquare } from 'lucide-react';
import { AuthProvider, useAuth } from '@/components/Auth/AuthProvider';
import { AuthModal } from '@/components/Auth/AuthModal';
import { MapContainer } from '@/components/Map/MapContainer';
import { MapCreator } from '@/components/Map/MapCreator';
import { MapLayers } from '@/components/MapLayers';
import { SearchBar } from '@/components/SearchBar';
import { FileUpload } from '@/components/FileUpload';
import { FeedbackForm } from '@/components/Feedback/FeedbackForm';
import { AnalyticsDashboard } from '@/components/Analytics/AnalyticsDashboard';
import { ExportButton } from '@/components/Export/ExportButton';
import { useFeatures } from '@/hooks/useFeatures';
import { useToast } from '@/hooks/use-toast';

const ADMIN_EMAIL = 'admin@geoshape.com'; // Replace with your email

const IndexContent = () => {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [currentMapLayer, setCurrentMapLayer] = useState('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
  const [currentShape, setCurrentShape] = useState<any>(null);
  const [searchLocation, setSearchLocation] = useState<{lat: number; lng: number; name: string; boundingBox?: number[]} | undefined>();
  
  const { user, signOut } = useAuth();
  const { features } = useFeatures();
  const { toast } = useToast();

  const handleLocationSelect = (lat: number, lng: number, name: string, boundingBox?: number[]) => {
    console.log('Location selected:', { lat, lng, name, boundingBox });
    setSearchLocation({ lat, lng, name, boundingBox });
  };

  const handleLayerChange = (layerUrl: string, layerName: string) => {
    setCurrentMapLayer(layerUrl);
  };

  const handleShapefileLoad = (geoJSON: any, filename: string) => {
    setCurrentShape(geoJSON);
    console.log('Shapefile loaded:', { geoJSON, filename });
  };

  const handleShapeCreated = (geoJSON: any) => {
    setCurrentShape(geoJSON);
  };

  const handleClearShape = () => {
    setCurrentShape(null);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleExport = (format: 'pdf' | 'png' | 'geojson') => {
    console.log(`Exported as ${format}`);
  };

  const isAdmin = user?.email === ADMIN_EMAIL;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">GeoShape Map Creator</h1>
            <p className="text-lg text-gray-600">Create, edit, and export custom maps with ease</p>
          </div>
          
          <div className="flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  Welcome, {user.email}
                </span>
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <LogOut className="h-3 w-3" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => setAuthModalOpen(true)}
                className="flex items-center gap-1"
              >
                <User className="h-3 w-3" />
                Sign In
              </Button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Map Section */}
          <div className="lg:col-span-3">
            <div className="space-y-4">
              <div className="relative z-10">
                <SearchBar onLocationSelect={handleLocationSelect} />
              </div>
              <Card className="p-4 h-[600px] relative">
                <div className="relative z-0">
                  <MapContainer
                    onShapeCreated={handleShapeCreated}
                    features={features}
                    currentMapLayer={currentMapLayer}
                    onLayerChange={handleLayerChange}
                    searchLocation={searchLocation}
                  />
                </div>
              </Card>
            </div>
          </div>

          {/* Controls Section */}
          <div className="space-y-4">
            <MapLayers 
              onLayerChange={handleLayerChange}
              currentLayer={currentMapLayer}
            />
            
            <FileUpload onShapefileLoad={handleShapefileLoad} />
            
            <MapCreator
              currentShape={currentShape}
              searchLocation={searchLocation}
              onClearShape={handleClearShape}
            />

            {/* Export Section */}
            <Card className="p-4">
              <h3 className="font-medium text-sm mb-4">Export Options</h3>
              <ExportButton 
                currentShape={currentShape}
                onExport={handleExport}
              />
            </Card>

            {/* Feedback Panel for all users */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="h-4 w-4 text-blue-500" />
                <h3 className="font-medium text-sm">Send Feedback</h3>
              </div>
              <FeedbackForm featureId="general" />
            </Card>

            {/* Admin-only Analytics */}
            {isAdmin && (
              <Card className="p-4">
                <AnalyticsDashboard />
              </Card>
            )}
          </div>
        </div>
      </div>

      <AuthModal 
        open={authModalOpen} 
        onOpenChange={setAuthModalOpen} 
      />
    </div>
  );
};

const Index = () => {
  return (
    <AuthProvider>
      <IndexContent />
    </AuthProvider>
  );
};

export default Index;
