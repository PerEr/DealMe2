'use client';

import { useEffect } from 'react';

interface ServerIPInjectorProps {
  serverIP: string;
}

/**
 * This component injects the server IP into the global window object
 * so it can be accessed by the client-side code
 */
export function ServerIPInjector({ serverIP }: ServerIPInjectorProps) {
  useEffect(() => {
    // Add the serverIP to the window object so it can be used by client-side code
    if (typeof window !== 'undefined') {
      // @ts-ignore - We're adding a custom property to the window object
      window._serverIP = serverIP;
    }
  }, [serverIP]);

  // This component doesn't render anything
  return null;
}