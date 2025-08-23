import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true
      },
      includeAssets: ['favicon.ico', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Mentalità - Crea la tua forza mentale nello sport',
        short_name: 'Mentalità',
        description: 'Crea la tua forza mentale nello sport - Mental coaching per atleti',
        theme_color: '#0085ff',
        background_color: '#111827',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        orientation: 'portrait-primary',
        categories: ['sports', 'health', 'fitness'],
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable any'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable any'
          }
        ],
        shortcuts: [
          {
            name: 'Esercizi',
            short_name: 'Esercizi',
            description: 'Vai agli esercizi mentali',
            url: '/exercises',
            icons: [{ src: '/icon-192.png', sizes: '192x192' }]
          },
          {
            name: 'Profilo',
            short_name: 'Profilo',
            description: 'Il mio profilo',
            url: '/profile',
            icons: [{ src: '/icon-192.png', sizes: '192x192' }]
          }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024, // 4MB limit
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
            handler: 'NetworkOnly'
          },
          {
            urlPattern: /^https:\/\/.*\.firebaseapp\.com\/.*/i,
            handler: 'NetworkOnly'
          },
          {
            urlPattern: /^https:\/\/identitytoolkit\.googleapis\.com\/.*/i,
            handler: 'NetworkOnly'
          },
          {
            urlPattern: /^https:\/\/storage\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'firebase-storage-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              }
            }
          }
        ]
      }
    })
  ],
  base: '/',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'firebase-vendor': ['firebase/app', 'firebase/firestore', 'firebase/auth'],
          'ui-vendor': ['lucide-react'],
          
          // Admin chunks (lazy loaded)
          'admin-core': [
            'src/components/admin/AdminDashboard.jsx',
            'src/components/admin/UserManager.jsx'
          ],
          'admin-content': [
            'src/components/admin/content/ExerciseManager.jsx',
            'src/components/admin/content/ArticleManager.jsx',
            'src/components/admin/content/AudioManager.jsx',
            'src/components/admin/content/VideoManager.jsx'
          ],
          'admin-premium': [
            'src/components/admin/premium/PremiumRequestsManager.jsx',
            'src/components/admin/premium/PremiumPlansManager.jsx'
          ],
          'admin-settings': [
            'src/components/admin/settings/QuestionnaireTemplatesManager.jsx',
            'src/components/admin/settings/OnboardingSettingsManager.jsx'
          ],
          
          // User chunks
          'user-core': [
            'src/components/user/UserDashboard.jsx',
            'src/pages/HomePage.jsx'
          ],
          'user-exercises': [
            'src/pages/ExercisesPage.jsx',
            'src/pages/ExercisePracticePage.jsx'
          ],
          'user-content': [
            'src/pages/VideosPage.jsx',
            'src/pages/AudioPage.jsx',
            'src/pages/ArticlesPage.jsx'
          ],
          
          // Onboarding chunks
          'onboarding': [
            'src/pages/OnboardingExercisesPage.jsx',
            'src/pages/OnboardingInteractivePage.jsx',
            'src/pages/InitialQuestionnairePage.jsx'
          ]
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    target: 'es2015',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'firebase/app', 'firebase/firestore', 'firebase/auth']
  }
})
