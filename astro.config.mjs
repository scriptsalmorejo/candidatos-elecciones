import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// En GitHub Pages el sitio vive en https://<usuario>.github.io/<repo>/
// El workflow define SITE y BASE; en local quedan los valores por defecto.
export default defineConfig({
  site: process.env.SITE || 'http://localhost:4321',
  base: process.env.BASE || '/',
  trailingSlash: 'always',
  vite: { plugins: [tailwindcss()] },
});
