'use client';

import { SWRConfig } from 'swr';

export function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
        dedupingInterval: 5000,
        errorRetryCount: 2,
        errorRetryInterval: 3000,
        shouldRetryOnError: (err: any) => {
          if (err?.response?.status === 401 || err?.response?.status === 403) return false;
          return true;
        },
      }}
    >
      {children}
    </SWRConfig>
  );
}
