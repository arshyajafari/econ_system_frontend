import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // Econ System is deployed at the domain root. Keep this aligned with
  // manifest.start_url and manifest.scope so Android can identify the app.
  base: "/",
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      manifest: {
        id: "/",
        name: "Econ System",
        short_name: "Econ System",
        description: "Econ System ordering and management application",
        start_url: "/",
        scope: "/",
        display: "standalone",
        display_override: ["standalone"],
        prefer_related_applications: false,
        orientation: "any",
        background_color: "#ffffff",
        theme_color: "#ffffff",
        categories: ["business", "productivity"],
        icons: [
          {
            src: "/pwa-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/pwa-512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        navigateFallback: "/index.html",
        runtimeCaching: [],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
});
