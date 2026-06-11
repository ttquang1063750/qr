import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler'
      }
    }
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'inline',
      manifest: {
        name: 'QR Art Studio - Premium QR Generator',
        short_name: 'QR Art Studio',
        description: 'Create custom, premium QR codes offline with unique shapes, gradients, watermarks, and text.',
        theme_color: '#4f46e5',
        background_color: '#0a0f1d',
        display: 'standalone',
        orientation: 'any',
        icons: [
          {
            src: 'icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,ico}'],
      }
    })
  ]
});
