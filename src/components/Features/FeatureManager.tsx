
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Trash2 } from 'lucide-react';
import { useFeatures } from '@/hooks/useFeatures';
import { useAuth } from '@/components/Auth/AuthProvider';

interface FeatureManagerProps {
  currentShape?: any;
  onShapeSaved?: () => void;
}

export const FeatureManager: React.FC<FeatureManagerProps> = ({ 
  currentShape, 
  onShapeSaved 
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [visibility, setVisibility] = useState('public');
  const [isLoading, setIsLoading] = useState(false);
  
  const { features, saveFeature, deleteFeature } = useFeatures();
  const { user } = useAuth();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !currentShape) return;

    setIsLoading(true);
    try {
      await saveFeature({
        name,
        description,
        geo: JSON.stringify(currentShape),
        category,
        visibility
      });
      
      // Reset form
      setName('');
      setDescription('');
      setCategory('general');
      setVisibility('public');
      
      onShapeSaved?.();
    } catch (error) {
      // Error handled in hook
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Save new feature form */}
      {user && currentShape && (
        <Card className="p-4">
          <form onSubmit={handleSave} className="space-y-3">
            <div className="flex items-center gap-2">
              <Save className="h-4 w-4 text-blue-500" />
              <h3 className="font-medium text-sm">Save Feature</h3>
            </div>
            
            <div>
              <Label className="text-xs">Name*</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Feature name"
                className="h-8"
                required
              />
            </div>
            
            <div>
              <Label className="text-xs">Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                className="h-16 text-xs"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="building">Building</SelectItem>
                    <SelectItem value="road">Road</SelectItem>
                    <SelectItem value="water">Water</SelectItem>
                    <SelectItem value="land_use">Land Use</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-xs">Visibility</Label>
                <Select value={visibility} onValueChange={setVisibility}>
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="organization">Organization</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button type="submit" size="sm" className="w-full" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Feature"}
            </Button>
          </form>
        </Card>
      )}

      {/* Feature list */}
      <Card className="p-4">
        <h3 className="font-medium text-sm mb-3">Recent Features</h3>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {features.slice(0, 10).map((feature) => (
            <div key={feature.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div className="flex-1">
                <p className="text-xs font-medium">{feature.name}</p>
                <p className="text-xs text-gray-500">{feature.category}</p>
              </div>
              {user?.id === feature.user_id && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteFeature(feature.id)}
                  className="h-6 w-6 p-0"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
