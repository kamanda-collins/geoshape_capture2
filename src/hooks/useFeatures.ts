
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/Auth/AuthProvider';

export interface Feature {
  id: string;
  name: string;
  description: string;
  geo: any;
  user_id: string;
  category: string;
  visibility: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export const useFeatures = () => {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const loadFeatures = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('features')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFeatures(data || []);
    } catch (error: any) {
      console.error('Error loading features:', error);
      toast({
        title: "Error loading features",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveFeature = async (featureData: {
    name: string;
    description?: string;
    geo: string;
    category?: string;
    visibility?: string;
    tags?: string[];
  }) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to save features.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('features')
        .insert([{
          ...featureData,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      setFeatures(prev => [data, ...prev]);
      toast({
        title: "Feature saved",
        description: `"${featureData.name}" has been saved successfully!`
      });

      return data;
    } catch (error: any) {
      console.error('Error saving feature:', error);
      toast({
        title: "Save failed",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  const deleteFeature = async (featureId: string) => {
    try {
      const { error } = await supabase
        .from('features')
        .delete()
        .eq('id', featureId);

      if (error) throw error;

      setFeatures(prev => prev.filter(f => f.id !== featureId));
      toast({
        title: "Feature deleted",
        description: "Feature has been deleted successfully."
      });
    } catch (error: any) {
      console.error('Error deleting feature:', error);
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    loadFeatures();
  }, []);

  return {
    features,
    loading,
    loadFeatures,
    saveFeature,
    deleteFeature
  };
};
