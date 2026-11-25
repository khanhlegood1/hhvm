import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// `VITE_BASE` is set by the GitHub Pages workflow so assets resolve under
// /hhvm/. Local builds keep relative asset paths.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const base = env.VITE_BASE || "./";

  return {
    plugins: [react()],
    base,
    server: { host: "0.0.0.0", port: 5173, strictPort: true, allowedHosts: true },
    preview: { host: "0.0.0.0", port: 4173, strictPort: true, allowedHosts: true },
    build: {
      chunkSizeWarningLimit: 2300,
      // The manual is ~2 MB of text: keeping it in its own chunk means a
      // returning reader only re-downloads the app shell when it changes.
      rollupOptions: {
        output: {
          manualChunks: {
            manual: ["./src/content/manual.json"],
            vendor: ["react", "react-dom", "marked", "lucide-react"],
          },
        },
      },
    },
  };
});
