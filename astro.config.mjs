// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";

import icon from "astro-icon";

import vercel from "@astrojs/vercel";

// https://astro.build/config
export default defineConfig({
  site: 'https://mastertim.xyz',
  output:'server',
  integrations: [mdx(), sitemap(), tailwind(), icon()],
  adapter: vercel({
    includeFiles: ['./data/vectordb']
  }),
  redirects: {
    '/cv': '/cv.pdf'
  }
});