import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { MinaProvider } from './providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Mina Bridge',
  description: 'Cross-chain bridge to Hyperliquid - Bridge from 40+ chains directly to your trading account',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans`}>
        <MinaProvider>
          {children}
        </MinaProvider>
      </body>
    </html>
  );
}
