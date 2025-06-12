// Environment variables
const ENV = {
  HUGGINGFACE_TOKEN: import.meta.env.VITE_HUGGINGFACE_TOKEN,
  EARTH_ENGINE_TOKEN: import.meta.env.VITE_EARTH_ENGINE_TOKEN,
} as const;

// Type-safe environment variable access
export const getEnv = (key: keyof typeof ENV) => {
  const value = ENV[key];
  if (!value) {
    console.warn(`Missing environment variable: ${key}`);
  }
  return value;
};

// Specific getters
export const getHuggingFaceToken = () => getEnv('HUGGINGFACE_TOKEN');
export const getEarthEngineToken = () => getEnv('EARTH_ENGINE_TOKEN'); 