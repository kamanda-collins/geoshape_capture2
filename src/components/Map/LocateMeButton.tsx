import React from 'react';

interface LocateMeButtonProps {
  onLocate: (lat: number, lng: number) => void;
}

export const LocateMeButton: React.FC<LocateMeButtonProps> = ({ onLocate }) => {
  const handleClick = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          onLocate(latitude, longitude);
        },
        (err) => alert("Failed to fetch location: " + err.message),
        { enableHighAccuracy: true }
      );
    } else {
      alert("Geolocation not supported on this device.");
    }
  };

  return (
    <button
      onClick={handleClick}
      className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-md shadow z-50"
    >
      📍 Use My Location
    </button>
  );
};