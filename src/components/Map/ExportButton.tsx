import React from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ExportButtonProps {
  onExport: () => void;
  disabled?: boolean;
}

export const ExportButton: React.FC<ExportButtonProps> = ({ onExport, disabled = false }) => {
  const handleExport = async () => {
    const map = document.getElementById('map');
    const controls = document.querySelector('.leaflet-control-container') as HTMLElement;

    if (controls) controls.style.display = 'none';

    if (map) {
      const canvas = await html2canvas(map);
      const imgData = canvas.toDataURL('image/png');

      // Option 1: Download as PNG
      const link = document.createElement('a');
      link.href = imgData;
      link.download = 'map_export.png';
      link.click();

      // Option 2: Download as PDF
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height],
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save('map_export.pdf');
    }

    if (controls) controls.style.display = 'block';
  };

  return (
    <div className="absolute top-4 right-4 z-[1000] space-x-2">
      <button
        onClick={handleExport}
        disabled={disabled}
        className={`
          px-4 py-2 rounded-md shadow-lg
          ${disabled 
            ? 'bg-gray-300 cursor-not-allowed' 
            : 'bg-green-600 hover:bg-green-700 text-white'
          }
          focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
          transition-colors duration-200
        `}
      >
        Export Map
      </button>
    </div>
  );
}; 