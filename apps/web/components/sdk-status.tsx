'use client';

import { useMina } from '@/app/providers';
import { SDK_VERSION, HYPEREVM_CHAIN_ID } from '@mina-bridge/sdk';

export function SdkStatus() {
  const { isReady, error } = useMina();

  return (
    <div className="mt-8 text-caption text-text-muted flex items-center justify-center gap-2">
      <span
        className={`inline-block w-2 h-2 rounded-full ${
          isReady ? 'bg-success' : error ? 'bg-error' : 'bg-warning'
        }`}
      />
      <span>
        SDK v{SDK_VERSION} | initialized: {isReady ? 'true' : 'false'} | Target: {HYPEREVM_CHAIN_ID}
      </span>
    </div>
  );
}
