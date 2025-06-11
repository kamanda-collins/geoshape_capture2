import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { FileUpload } from '@/components/FileUpload';

interface ImportTabsProps {
  onShapefileLoad: (geoJSON: any, filename: string) => void;
}

export const ImportTabs: React.FC<ImportTabsProps> = ({ onShapefileLoad }) => {
  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">Import GIS Data</span>
        </div>
        
        <Tabs defaultValue="file" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="file">File</TabsTrigger>
            <TabsTrigger value="api">API</TabsTrigger>
            <TabsTrigger value="csv">CSV</TabsTrigger>
          </TabsList>
          
          <TabsContent value="file" className="mt-4">
            <FileUpload onShapefileLoad={onShapefileLoad} />
          </TabsContent>
          
          <TabsContent value="api" className="mt-4">
            <div className="p-4 text-center text-sm text-gray-500">
              API integration coming soon...
            </div>
          </TabsContent>
          
          <TabsContent value="csv" className="mt-4">
            <div className="p-4 text-center text-sm text-gray-500">
              CSV import is handled within the File tab for now.
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
}; 