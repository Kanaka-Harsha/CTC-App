import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Citizen Traffic Camera',
        short_name: 'CTC App',
        description: 'Official Citizen Traffic Camera Incident Reporting App',
        theme_color: '#0056b3',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'CTC_Main.png',
            sizes: '192x192 512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})
