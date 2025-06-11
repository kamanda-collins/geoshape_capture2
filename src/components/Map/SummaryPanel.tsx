import React from 'react';

interface SummaryPanelProps {
  totalFeatures: number;
  totalArea: number;
  featureTypes: { [key: string]: number };
  recentArea?: number;
  riskScore?: number;
}

export const SummaryPanel: React.FC<SummaryPanelProps> = ({
  totalFeatures,
  totalArea,
  featureTypes,
  recentArea,
  riskScore
}) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-lg max-w-sm">
      <h3 className="text-lg font-semibold mb-3">📊 Map Summary</h3>
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-600">Total Features:</span>
          <span className="font-medium">{totalFeatures}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Total Area:</span>
          <span className="font-medium">
            {totalArea > 0 ? `${totalArea.toLocaleString()} m²` : '—'}
          </span>
        </div>

        {Object.keys(featureTypes).length > 0 && (
          <div className="mt-3">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Feature Types:</h4>
            <div className="space-y-1">
              {Object.entries(featureTypes).map(([type, count]) => (
                <div key={type} className="flex justify-between text-sm">
                  <span className="text-gray-600 capitalize">{type}:</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {(recentArea !== undefined && recentArea > 0) && (riskScore !== undefined) && (
          <div className="mt-4 pt-3 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2">🆕 Latest Drawn Shape</h4>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Area:</span>
                <span className="font-medium">{recentArea.toFixed(2)} m²</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Risk Score:</span>
                <span className="font-medium">{riskScore.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};