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

module.exports = nextConfig;
