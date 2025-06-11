export const config = {
  huggingFaceToken: import.meta.env.VITE_HUGGINGFACE_TOKEN || '',
  earthEngineToken: import.meta.env.VITE_EARTH_ENGINE_TOKEN || '',
} as const;

// Validate required environment variables
const requiredEnvVars = ['VITE_HUGGINGFACE_TOKEN'] as const;

for (const envVar of requiredEnvVars) {
  if (!import.meta.env[envVar]) {
    console.warn(`Missing required environment variable: ${envVar}`);
  }
} 