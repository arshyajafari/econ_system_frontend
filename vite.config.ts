import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      registerType: "autoUpdate",

      injectRegister: "auto",

      manifest: {
        name: "Econ System",
        short_name: "Econ System",
        description: "Econ System ordering and management application",

        start_url: "/",
        scope: "/",

        display: "standalone",

        background_color: "#ffffff",
        theme_color: "#ffffff",

        icons: [
          {
            src: "/pwa-192.svg",
            sizes: "192x192",
            type: "image/svg+xml",
          },
          {
            src: "/pwa-512.svg",
            sizes: "512x512",
            type: "image/svg+xml",
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
