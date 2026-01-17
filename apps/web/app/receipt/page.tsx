import { Suspense } from 'react';
import { Metadata } from 'next';
import { ReceiptDisplay } from './receipt-display';

export const metadata: Metadata = {
  title: 'Bridge Receipt - Mina',
  description: 'View your bridge transaction receipt from Mina Bridge',
  openGraph: {
    title: 'Mina Bridge Receipt',
    description: 'View bridge transaction details',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mina Bridge Receipt',
    description: 'View bridge transaction details',
  },
};

function LoadingReceipt() {
  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-accent-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-text-muted">Loading receipt...</p>
      </div>
    </div>
  );
}

export default function ReceiptPage() {
  return (
    <Suspense fallback={<LoadingReceipt />}>
      <ReceiptDisplay />
    </Suspense>
  );
}
