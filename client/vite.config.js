import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // API calls go to the Express server, so cookies stay on one origin
    proxy: { "/api": { target: "http://localhost:4000", changeOrigin: false } },
  },
});
