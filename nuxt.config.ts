import { fileURLToPath } from "node:url";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  alias: {
    generated: fileURLToPath(new URL("./generated", import.meta.url)),
  },
  nitro: {
    ignore: ["**/*.test.ts"],
    ...(process.env.VERCEL ? { preset: "vercel" as const } : {}),
    externals: {
      external: ["pg"],
    },
  },
  compatibilityDate: "2024-11-01",
  devtools: { enabled: process.env.NODE_ENV === "development" },
  app: {
    head: {
      titleTemplate: 'Mapa Cidadão',
      link: [
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        {
          rel: "preconnect",
          href: "https://fonts.gstatic.com",
          crossorigin: "",
        },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,560;1,9..144,560&display=swap",
        },
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
    "@nuxt/icon",
    "@nuxt/image",
    "@nuxt/ui",
    "@pinia/nuxt",
  ],
  css: ["~/assets/css/main.css"],
  runtimeConfig: {
    public: {
      cartoApiKey: process.env.NUXT_PUBLIC_CARTO_API_KEY || "",
    },
  },
  ui: {
    fonts: false,
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
