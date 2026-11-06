import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  i18n: {
    defaultLocale: 'tr',
    locales: ['tr', 'en'],
    routing: {
      prefixDefaultLocale: true,
      // src/pages/index.astro owns the "/" -> "/tr/" redirect.
      redirectToDefaultLocale: false,
    },
  },
});
