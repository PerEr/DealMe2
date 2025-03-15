/**
 * Get the server's base URL using window.location in the browser
 * or environment variables as fallback
 */
export function getServerBaseUrl(): string {
  // In the browser, use window.location.origin (most reliable approach)
  if (typeof window !== 'undefined') {
    // Extract hostname and check if it's localhost/127.0.0.1
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      // For local development, use the configured IP from env if available
      const serverIp = process.env.NEXT_PUBLIC_SERVER_IP;
      if (serverIp) {
        return `${window.location.protocol}//${serverIp}:${window.location.port}`;
      }
    }
    return window.location.origin;
  }
  
  // When running on the server side or during SSR, use a default value
  // that will be replaced on the client side with the correct value
  return process.env.NEXT_PUBLIC_SERVER_URL || 'http://192.168.68.104:3000';
}

/**
 * Generates a full join URL for a table
 */
export function getTableJoinUrl(tableGuid: string): string {
  const baseUrl = getServerBaseUrl();
  return `${baseUrl}/table/${tableGuid}/sitdown`;
}