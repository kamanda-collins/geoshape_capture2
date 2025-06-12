import { getEarthEngineToken } from '@/lib/env';

export const calculateNDVI = async (coordinates: [number, number][]) => {
  const token = getEarthEngineToken();
  if (!token) {
    throw new Error('Earth Engine token not found');
  }

  try {
    // Your Earth Engine API call here
    const response = await fetch('YOUR_EARTH_ENGINE_API_ENDPOINT', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ coordinates }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error calling Earth Engine API:', error);
    throw error;
  }
}; 