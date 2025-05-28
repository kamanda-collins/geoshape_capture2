
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, LogOut, BarChart3, Lock } from 'lucide-react';
import { AuthProvider, useAuth } from '@/components/Auth/AuthProvider';
import { AuthModal } from '@/components/Auth/AuthModal';
import { MapContainer } from '@/components/Map/MapContainer';
import { MapCreator } from '@/components/Map/MapCreator';
import { MapLayers } from '@/components/MapLayers';
import { SearchBar } from '@/components/SearchBar';
import { FileUpload } from '@/components/FileUpload';
import { FeedbackPanel } from '@/components/Feedback/FeedbackPanel';
import { AnalyticsDashboard } from '@/components/Analytics/AnalyticsDashboard';
import { useFeatures } from '@/hooks/useFeatures';
import { useToast } from '@/hooks/use-toast';

const ADMIN_EMAIL = 'admin@geoshape.com'; // Replace with your email

const IndexContent = () => {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [currentMapLayer, setCurrentMapLayer] = useState('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
  const [currentShape, setCurrentShape] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('map');
  const [searchLocation, setSearchLocation] = useState<{lat: number; lng: number; name: string; boundingBox?: number[]} | undefined>();
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  
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
      setIsAdminAuthenticated(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleAdminLogin = () => {
    // Simple admin authentication - in production, use proper auth
    if (adminPassword === 'geoshape2024' || (user && user.email === ADMIN_EMAIL)) {
      setIsAdminAuthenticated(true);
      setAdminPassword('');
      toast({
        title: "Admin Access Granted",
        description: "You now have access to analytics and feedback.",
      });
    } else {
      toast({
        title: "Access Denied",
        description: "Invalid admin credentials.",
        variant: "destructive"
      });
    }
  };

  const isAdmin = user?.email === ADMIN_EMAIL || isAdminAuthenticated;

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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="map">Map Creator</TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-1">
              <BarChart3 className="h-3 w-3" />
              Analytics & Feedback
              {!isAdmin && <Lock className="h-3 w-3" />}
            </TabsTrigger>
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
                      searchLocation={searchLocation}
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
                
                <MapCreator
                  currentShape={currentShape}
                  searchLocation={searchLocation}
                  onClearShape={handleClearShape}
                />
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="analytics">
            {!isAdmin ? (
              <Card className="p-8 text-center">
                <div className="space-y-4">
                  <Lock className="h-12 w-12 text-gray-400 mx-auto" />
                  <h3 className="text-lg font-medium">Admin Access Required</h3>
                  <p className="text-gray-600">
                    Enter the admin password to access analytics and feedback data.
                  </p>
                  <div className="max-w-sm mx-auto space-y-2">
                    <Input
                      type="password"
                      placeholder="Enter admin password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
                    />
                    <Button onClick={handleAdminLogin} className="w-full">
                      Access Admin Panel
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AnalyticsDashboard />
                <FeedbackPanel featureId="general" />
              </div>
            )}
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
