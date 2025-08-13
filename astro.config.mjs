// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://zero-call.org',
  // No base path needed since this will be the root domain
  output: 'static',
  build: {
    assets: 'assets'
  }
});
