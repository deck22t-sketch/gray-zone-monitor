'use client';

import { useEffect } from 'react';

export function PwaRegistrar() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }
    const basePath = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/$/, '');
    const swUrl = `${basePath}/sw.js`;
    const scope = `${basePath}/`;

    navigator.serviceWorker.register(swUrl, { scope }).catch(() => {
      // Non-fatal in dev or unsupported browsers
    });
  }, []);

  return null;
}
