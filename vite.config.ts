// @lovable.dev/vite-tanstack-config already includes core plugins.
// PWA добавляем отдельно через vite.plugins.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    base: '/', //
    plugins: [
      VitePWA({
        strategies: "injectManifest",
        srcDir: "src",
        filename: "sw.ts",
        registerType: "autoUpdate",
        injectRegister: "auto",
        manifest: {
          name: "Flora Boutique",
          short_name: "Flora",
          description: "Авторские букеты. Заказ без регистрации.",
          theme_color: "#FFF6F6",
          background_color: "#FFF6F6",
          display: "standalone",
          start_url: "/",
          lang: "ru",
          icons: [
            {
              src: "/favicon.ico",
              sizes: "48x48",
              type: "image/x-icon",
            },
          ],
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
  },
});
