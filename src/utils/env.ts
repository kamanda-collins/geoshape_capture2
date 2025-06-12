export const getHuggingFaceToken = () => {
  const token = import.meta.env.VITE_HUGGINGFACE_TOKEN;
  if (!token) {
    console.warn('Hugging Face token not found in environment variables');
    return null;
  }
  return token;
};

export const getEarthEngineToken = () => {
  const token = import.meta.env.VITE_EARTH_ENGINE_TOKEN;
  if (!token) {
    console.warn('Earth Engine token not found in environment variables');
    return null;
  }
  return token;
}; 