import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import { VitePWA } from "vite-plugin-pwa";

const APP_NAME = process.env.VITE_APP_NAME || "Procurement Management System";
const APP_SHORT_NAME = process.env.VITE_APP_SHORT_NAME || "PMS";
const THEME_COLOR = process.env.VITE_THEME_COLOR || "#197dfa";

export default defineConfig({
  plugins: [
    react(),
    svgr({
      svgrOptions: {
        svgoConfig: {
          plugins: [
            { name: "prefixIds", params: { prefixIds: true, prefixClassNames: true } },
          ],
        },
      },
    }),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.png", "favicon.svg", "icons.svg"],
      manifest: {
        name: APP_NAME,
        short_name: APP_SHORT_NAME,
        description:
          "Procurement management — purchase orders, stores, inventory, and quality control.",
        theme_color: THEME_COLOR,
        background_color: "#f2f2f7",
        display: "standalone",
        orientation: "any",
        scope: "/",
        start_url: "/login",
        categories: ["business", "productivity"],
        icons: [
          {
            src: "favicon.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "favicon.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "favicon.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2}"],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "gstatic-fonts-cache",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
        type: "module",
      },
    }),
  ],
  server: {
    host: "127.0.0.1",
    port: 5173,
    open: true,
    proxy: {
      "/api": {
        target: "http://localhost:5020",
        changeOrigin: true,
      },
    },
  },
});
