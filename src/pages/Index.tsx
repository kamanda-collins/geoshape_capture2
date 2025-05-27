
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, LogOut, BarChart3 } from 'lucide-react';
import { AuthProvider, useAuth } from '@/components/Auth/AuthProvider';
import { AuthModal } from '@/components/Auth/AuthModal';
import { MapContainer } from '@/components/Map/MapContainer';
import { MapLayers } from '@/components/MapLayers';
import { SearchBar } from '@/components/SearchBar';
import { FileUpload } from '@/components/FileUpload';
import { FeatureManager } from '@/components/Features/FeatureManager';
import { FeedbackPanel } from '@/components/Feedback/FeedbackPanel';
import { ExportTools } from '@/components/Export/ExportTools';
import { AnalyticsDashboard } from '@/components/Analytics/AnalyticsDashboard';
import { useFeatures } from '@/hooks/useFeatures';

const IndexContent = () => {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [currentMapLayer, setCurrentMapLayer] = useState('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
  const [currentShape, setCurrentShape] = useState<any>(null);
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState('map');
  
  const { user, signOut } = useAuth();
  const { features } = useFeatures();

  const handleLocationSelect = (lat: number, lng: number, name: string) => {
    // This would interact with the map - implement as needed
    console.log('Location selected:', { lat, lng, name });
  };

  const handleLayerChange = (layerUrl: string, layerName: string) => {
    setCurrentMapLayer(layerUrl);
  };

  const handleShapefileLoad = (geoJSON: any, filename: string) => {
    // This would add the shapefile to the map - implement as needed
    console.log('Shapefile loaded:', { geoJSON, filename });
  };

  const handleShapeCreated = (geoJSON: any) => {
    setCurrentShape(geoJSON);
  };

  const handleShapeSaved = () => {
    setCurrentShape(null);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">GeoShape Feedback Portal</h1>
            <p className="text-lg text-gray-600">Collaborative GIS platform for collecting and managing geographic data feedback</p>
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="map">Map & Features</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="map">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Map */}
              <div className="lg:col-span-3">
                <div className="space-y-4">
                  <SearchBar onLocationSelect={handleLocationSelect} />
                  <Card className="p-4 h-[600px]">
                    <MapContainer
                      onShapeCreated={handleShapeCreated}
                      features={features}
                      currentMapLayer={currentMapLayer}
                      onLayerChange={handleLayerChange}
                    />
                  </Card>
                </div>
              </div>

              {/* Controls */}
              <div className="space-y-4">
                <MapLayers 
                  onLayerChange={handleLayerChange}
                  currentLayer={currentMapLayer}
                />
                
                <FileUpload onShapefileLoad={handleShapefileLoad} />
                
                <FeatureManager
                  currentShape={currentShape}
                  onShapeSaved={handleShapeSaved}
                />
                
                {selectedFeatureId && (
                  <FeedbackPanel featureId={selectedFeatureId} />
                )}
                
                <ExportTools />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="analytics">
            <AnalyticsDashboard />
          </TabsContent>
        </Tabs>
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
