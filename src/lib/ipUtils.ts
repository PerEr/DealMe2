import { networkInterfaces } from 'os';

/**
 * Get the local network IP address of the machine
 * Prefer IPv4 addresses and filter out localhost and virtual interfaces
 */
export function getLocalNetworkIP(): string {
  try {
    const nets = networkInterfaces();
    const results: string[] = [];

    for (const name of Object.keys(nets)) {
      // Skip virtual interfaces and localhost
      if (name.includes('vEthernet') || name.includes('VMware') || name.includes('Virtual') || name.includes('WSL')) {
        continue;
      }

      for (const net of nets[name] || []) {
        // Skip internal, non-IPv4, and localhost addresses
        if (!net.internal && net.family === 'IPv4' && net.address !== '127.0.0.1') {
          results.push(net.address);
        }
      }
    }

    // Return the first valid IP or localhost as fallback
    return results[0] || '127.0.0.1';
  } catch (e) {
    console.error('Failed to get local network IP:', e);
    return '127.0.0.1';
  }
}

/**
 * Extract the host IP from the command line arguments if provided
 * Next.js can be launched with `next start -H 192.168.1.100`
 */
export function getCommandLineIP(): string | null {
  if (typeof process !== 'undefined' && process.argv) {
    const args = process.argv;
    const hostIndex = args.findIndex(arg => arg === '-H' || arg === '--hostname');
    
    if (hostIndex >= 0 && args.length > hostIndex + 1) {
      return args[hostIndex + 1];
    }
  }
  return null;
}

/**
 * Get the server's base URL using window.location in the browser
 * or by detecting the local network IP as fallback
 */
export function getServerBaseUrl(): string {
  // In the browser, use window.location.origin
  if (typeof window !== 'undefined') {
    // Extract hostname and check if it's localhost/127.0.0.1
    const hostname = window.location.hostname;
    const port = window.location.port;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      // For local development, we need the network IP so external devices can connect
      // Use the server-provided value from _serverIP object if available
      // @ts-ignore - This will be injected by the server
      if (window._serverIP) {
        // @ts-ignore - This will be injected by the server
        return `${window.location.protocol}//${window._serverIP}:${port}`;
      }
    }
    return window.location.origin;
  }
  
  // When running on the server side, detect the IP
  const commandLineIP = getCommandLineIP();
  const localNetworkIP = getLocalNetworkIP();
  const ip = commandLineIP || localNetworkIP;
  const port = process.env.PORT || '3000';
  
  return `http://${ip}:${port}`;
}

/**
 * Generates a full join URL for a table
 */
export function getTableJoinUrl(tableGuid: string): string {
  const baseUrl = getServerBaseUrl();
  return `${baseUrl}/table/${tableGuid}/sitdown`;
}