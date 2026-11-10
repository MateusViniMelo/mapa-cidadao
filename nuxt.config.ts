import { fileURLToPath } from "node:url";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  alias: {
    generated: fileURLToPath(new URL("./generated", import.meta.url)),
  },
  nitro: {
    ignore: ["**/*.test.ts"],
  },
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },
  app: {
    head: {
      titleTemplate: 'Mapa Cidadão',
      link: [
        {
          rel: "apple-touch-icon",
          sizes: "180x180",
          href: "/apple-touch-icon.png",
        },
        {
          rel: "icon",
          type: "image/png",
          sizes: "32x32",
          href: "/favicon-32x32.png",
        },
        {
          rel: "icon",
          type: "image/png",
          sizes: "16x16",
          href: "/favicon-16x16.png",
        },
        { rel: "manifest", href: "/site.webmanifest" },
      ],
    },
  },

  components: [
    {
      path: "~/components",
      pathPrefix: false,
    },
  ],
  modules: [
    "@nuxt/fonts",
    "@nuxt/icon",
    "@nuxt/image",
    "@nuxt/ui",
    "@pinia/nuxt",
  ],
  css: ["~/assets/css/main.css"],
  ui: {
    theme: {
      colors: [
        "primary",
        "secondary",
        "tertiary",
        "info",
        "success",
        "warning",
        "error",
      ],
    },
  },
});
