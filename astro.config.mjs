// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://benchmarkdigital.agency',
  output: 'static',
  trailingSlash: 'never',
  build: {
    // /plans.html is served at /plans by Cloudflare Pages
    format: 'file',
    // ~15 KB of CSS total; inlining removes the render-blocking request
    inlineStylesheets: 'always',
  },
  integrations: [
    sitemap({
      filter: (page) => !/\/(thank-you|404)$/.test(page.replace(/\/$/, '')),
    }),
  ],
});
