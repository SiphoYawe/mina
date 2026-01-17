const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  // Import custom service worker for Background Sync (Story 11.4)
  importScripts: ['/sw-custom.js'],
  // Runtime caching strategies for Story 11.2
  runtimeCaching: [
    // Quotes: Network Only (never cache) - real-time pricing data
    {
      urlPattern: /^https:\/\/.*\.lifi\.io\/.*quote.*/i,
      handler: 'NetworkOnly',
      options: {
        cacheName: 'lifi-quotes',
      },
    },
    // User balances: Stale While Revalidate (30s) - balance checks
    {
      urlPattern: /^https:\/\/.*\.lifi\.io\/.*balance.*/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'lifi-balances',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 30,
        },
      },
    },
    // Chain/token lists: Cache First (1 hour TTL)
    {
      urlPattern: /^https:\/\/.*\.lifi\.io\/.*(chains|tokens|connections).*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'lifi-static-data',
        expiration: {
          maxEntries: 20,
          maxAgeSeconds: 3600, // 1 hour
        },
      },
    },
    // Other LI.FI API calls: Network First with fallback
    {
      urlPattern: /^https:\/\/.*\.lifi\.io\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'lifi-api',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 300, // 5 minutes
        },
        networkTimeoutSeconds: 10,
      },
    },
    // Hyperliquid API: Network Only (real-time trading data)
    {
      urlPattern: /^https:\/\/.*hyperliquid.*/i,
      handler: 'NetworkOnly',
      options: {
        cacheName: 'hyperliquid-api',
      },
    },
    // Static images: Cache First (1 week) - versioned assets
    {
      urlPattern: /\.(png|jpg|jpeg|svg|gif|ico|webp)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'images',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 604800, // 1 week
        },
      },
    },
    // Static fonts: Cache First (1 year)
    {
      urlPattern: /\.(woff|woff2|ttf|otf|eot)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'fonts',
        expiration: {
          maxEntries: 20,
          maxAgeSeconds: 31536000, // 1 year
        },
      },
    },
    // JS/CSS bundles: Cache First (versioned)
    {
      urlPattern: /\/_next\/static\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'next-static',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 31536000, // 1 year (versioned)
        },
      },
    },
    // Next.js data fetching
    {
      urlPattern: /\/_next\/data\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'next-data',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60, // 1 minute
        },
      },
    },
    // Google Fonts
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-stylesheets',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 31536000, // 1 year
        },
      },
    },
    {
      urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-webfonts',
        expiration: {
          maxEntries: 30,
          maxAgeSeconds: 31536000, // 1 year
        },
      },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@siphoyawe/mina-sdk'],
  // Turbopack configuration (Next.js 16+ default bundler)
  turbopack: {
    root: '../../',
    resolveAlias: {
      // Optional wallet connectors we don't use
      '@gemini-wallet/core': { browser: '' },
      'porto': { browser: '' },
      'porto/internal': { browser: '' },
      // React Native packages that aren't needed for web
      '@react-native-async-storage/async-storage': { browser: '' },
    },
  },
  // Keep webpack config for fallback/compatibility
  webpack: (config, { isServer }) => {
    // Fix for optional wagmi connectors that may not be installed
    // These are optional peer dependencies that we don't need for our wallet flow
    config.resolve.alias = {
      ...config.resolve.alias,
      // Optional wallet connectors we don't use
      '@gemini-wallet/core': false,
      'porto': false,
      'porto/internal': false,
      // React Native packages that aren't needed for web
      '@react-native-async-storage/async-storage': false,
    };

    // Handle fallbacks for optional modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    return config;
  },
};

module.exports = withPWA(nextConfig);
