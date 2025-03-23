import React from 'react';

interface ServerIPScriptProps {
  serverIP: string;
}

/**
 * This component adds a script tag that injects the server IP into the window object
 */
export function ServerIPScript({ serverIP }: ServerIPScriptProps) {
  // Create a script that sets the server IP on the window object
  const scriptContent = `
    window._serverIP = "${serverIP}";
    console.log("Server IP injected:", "${serverIP}");
  `;

  // Use dangerouslySetInnerHTML since we're in a server component
  return (
    <script 
      id="server-ip-script" 
      dangerouslySetInnerHTML={{ __html: scriptContent }}
    />
  );
}