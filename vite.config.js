import { defineConfig } from 'vite';
export default defineConfig(({ mode }) => ({
  ...(mode === 'dsh' && {
    base: './',
    plugins: [{
      name: 'dsh-game-entry',
      transformIndexHtml: {
        order: 'pre',
        handler: html => html
          .replace(/^  <meta property="og:.*\n/gm, '')
          .replace(/^  <meta name="twitter:.*\n/gm, '')
          .replace(/^  <link rel="canonical".*\n/gm, '')
          .replace(/<link rel="manifest"[^>]+>/, '')
          .replace(/^  <script (?:defer|type="application\/ld\+json").*\n/gm, ''),
      },
    }],
  }),
  server: { proxy: { '/api': 'http://127.0.0.1:3491' } },
  preview: { proxy: { '/api': 'http://127.0.0.1:3491' } },
}));
