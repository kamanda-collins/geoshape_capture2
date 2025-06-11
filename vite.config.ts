import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    server: {
      host: "::",
      port: 3000,
      strictPort: false, // Allow fallback to another port if 3000 is taken
      hmr: {
        overlay: true,
      },
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      sourcemap: true,
      chunkSizeWarningLimit: 1000,
    },
    optimizeDeps: {
      include: ['react', 'react-dom'],
    },
    define: {
      // Only expose specific environment variables that your app needs
      // Replace these with your actual environment variable names
      'process.env.VITE_HUGGINGFACE_TOKEN': JSON.stringify(env.VITE_HUGGINGFACE_TOKEN || env.HUGGINGFACE_TOKEN),
      'process.env.VITE_EARTH_ENGINE_TOKEN': JSON.stringify(env.VITE_EARTH_ENGINE_TOKEN || env.EARTH_ENGINE_TOKEN),
      'process.env.NODE_ENV': JSON.stringify(env.NODE_ENV),
      // Add any other specific environment variables your app uses
      // 'process.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL),
      // 'process.env.VITE_OTHER_VAR': JSON.stringify(env.VITE_OTHER_VAR),
    }
  };
});