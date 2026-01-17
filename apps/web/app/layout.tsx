import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { MinaProvider } from './providers';
import { ServiceWorkerRegistration, OfflineBanner, InstallBanner } from '@/components/shared';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Mina Bridge',
  description: 'Cross-chain bridge to Hyperliquid - Bridge from 40+ chains directly to your trading account',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Mina Bridge',
  },
  applicationName: 'Mina Bridge',
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
      { url: '/icon-512.svg', sizes: '512x512', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: '#7DD3FC',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Mina Bridge" />
        <link rel="apple-touch-icon" href="/icon-192.svg" />
      </head>
      <body className={`${inter.variable} font-sans`}>
        <MinaProvider>
          <OfflineBanner />
          {children}
          <InstallBanner />
          <ServiceWorkerRegistration />
        </MinaProvider>
      </body>
    </html>
  );
}
