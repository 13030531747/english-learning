import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({ cacheDir: "D:/english-learning-vite-cache-2", optimizeDeps: { noDiscovery: true }, plugins: [react()], build: { emptyOutDir: false, outDir: "dist-next" } });
