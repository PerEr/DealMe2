import { NextApiResponse } from 'next';
import { Table, Player } from './types';

// Simple response-like interface for our connection handler
export interface SSEConnection {
  write: (data: string) => boolean | void;
  end?: () => void;
  on: (event: string, callback: () => void) => any;
}

// Store connections by player GUID and table GUID
const tableConnections = new Map<string, SSEConnection[]>();
const playerConnections = new Map<string, SSEConnection>();

// Keep track of connection IDs to avoid duplicates
const connectionIds = new Set<string>();

// Setup SSE headers for a response
export function setupSSE(res: SSEConnection): void {
  if ('setHeader' in res) {
    (res as any).setHeader('Content-Type', 'text/event-stream');
    (res as any).setHeader('Cache-Control', 'no-cache, no-transform');
    (res as any).setHeader('Connection', 'keep-alive');
    (res as any).setHeader('X-Accel-Buffering', 'no'); // For NGINX
    
    if ('flushHeaders' in res) {
      (res as any).flushHeaders();
    }
  }
}

// Send a message to all connected clients for a table
export function sendTableUpdate(tableGuid: string, table: Table): void {
  const connections = tableConnections.get(tableGuid) || [];
  
  if (connections.length === 0) {
    return; // No connections, so don't bother preparing the data
  }
  
  // Create a safe version of the table with hidden deck cards
  const safeTable = {
    ...table,
    deck: [], // Don't send the deck to clients
  };
  
  const data = `data: ${JSON.stringify({ table: safeTable })}\n\n`;
  const failedConnections: SSEConnection[] = [];
  
  connections.forEach(res => {
    try {
      const result = res.write(data);
      if (result === false) {
        // If write returns false, the connection buffer is full and might be stalled
        console.warn(`Table ${tableGuid} connection buffer full, may be stalled`);
        failedConnections.push(res);
      }
    } catch (error) {
      console.error(`Error sending update to table client: ${error}`);
      failedConnections.push(res);
    }
  });
  
  // Remove failed connections
  if (failedConnections.length > 0) {
    const validConnections = connections.filter(conn => !failedConnections.includes(conn));
    
    if (validConnections.length > 0) {
      tableConnections.set(tableGuid, validConnections);
    } else {
      tableConnections.delete(tableGuid);
    }
    
    // Properly close failed connections
    failedConnections.forEach(conn => {
      try {
        if (conn.end) {
          conn.end();
        }
      } catch (e) {
        // Already closed
      }
    });
  }
}

// Send a message to a specific player
export function sendPlayerUpdate(playerGuid: string, player: Player, table: Table): void {
  const res = playerConnections.get(playerGuid);
  
  if (!res) return;
  
  // Include only necessary data for the player
  const playerData = {
    player,
    tableGuid: table.tableGuid,
    gamePhase: table.gamePhase,
    handId: table.handId,
  };
  
  try {
    const result = res.write(`data: ${JSON.stringify({ player: playerData })}\n\n`);
    
    if (result === false) {
      // If write returns false, the connection buffer is full and might be stalled
      console.warn(`Player ${playerGuid} connection buffer full, may be stalled`);
      playerConnections.delete(playerGuid);
      
      // Close the connection
      if (res.end) {
        res.end();
      }
    }
  } catch (error) {
    console.error(`Error sending update to player client: ${error}`);
    // Remove the connection as it's probably dead
    playerConnections.delete(playerGuid);
    
    // Close the connection
    try {
      if (res.end) {
        res.end();
      }
    } catch (e) {
      // Already closed
    }
  }
}

// Generate a unique connection ID
function generateConnectionId(): string {
  return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Register a new table connection
export function addTableConnection(tableGuid: string, res: SSEConnection): void {
  const connId = generateConnectionId();
  
  // Check if we already have too many connections for this table
  const connections = tableConnections.get(tableGuid) || [];
  if (connections.length >= 10) { // Limit to 10 connections per table
    console.warn(`Too many connections for table ${tableGuid}, dropping oldest`);
    // Remove the oldest connection
    const oldestConn = connections.shift();
    if (oldestConn && oldestConn.end) {
      try {
        oldestConn.end();
      } catch (e) {
        // Already closed
      }
    }
  }
  
  // Add the new connection
  connections.push(res);
  tableConnections.set(tableGuid, connections);
  connectionIds.add(connId);
  
  // Handle connection close
  res.on('close', () => {
    const connections = tableConnections.get(tableGuid) || [];
    const updatedConnections = connections.filter(conn => conn !== res);
    
    if (updatedConnections.length > 0) {
      tableConnections.set(tableGuid, updatedConnections);
    } else {
      tableConnections.delete(tableGuid);
    }
    
    connectionIds.delete(connId);
  });
}

// Register a new player connection
export function addPlayerConnection(playerGuid: string, res: SSEConnection): void {
  const connId = generateConnectionId();
  
  // If there's an existing connection, close it
  const existingConn = playerConnections.get(playerGuid);
  if (existingConn) {
    console.log(`Replacing existing connection for player ${playerGuid}`);
    try {
      if (existingConn.end) {
        existingConn.end();
      }
    } catch (e) {
      // Already closed
    }
  }
  
  // Set the new connection
  playerConnections.set(playerGuid, res);
  connectionIds.add(connId);
  
  // Handle connection close
  res.on('close', () => {
    // Only delete if this is still the current connection
    if (playerConnections.get(playerGuid) === res) {
      playerConnections.delete(playerGuid);
    }
    connectionIds.delete(connId);
  });
}

// Send a keepalive message to all connections
export function sendKeepalive(): void {
  const keepaliveMessage = ': keepalive\n\n';
  const failedTableConnections = new Map<string, SSEConnection[]>();
  
  // For table connections
  tableConnections.forEach((connections, tableGuid) => {
    const failed: SSEConnection[] = [];
    
    connections.forEach(res => {
      try {
        const result = res.write(keepaliveMessage);
        if (result === false) {
          failed.push(res);
        }
      } catch (error) {
        failed.push(res);
      }
    });
    
    if (failed.length > 0) {
      failedTableConnections.set(tableGuid, failed);
    }
  });
  
  // Clean up failed table connections
  failedTableConnections.forEach((failedConns, tableGuid) => {
    const connections = tableConnections.get(tableGuid) || [];
    const validConnections = connections.filter(conn => !failedConns.includes(conn));
    
    if (validConnections.length > 0) {
      tableConnections.set(tableGuid, validConnections);
    } else {
      tableConnections.delete(tableGuid);
    }
    
    // Close failed connections
    failedConns.forEach(conn => {
      try {
        if (conn.end) {
          conn.end();
        }
      } catch (e) {
        // Already closed
      }
    });
  });
  
  // For player connections
  const playersToRemove: string[] = [];
  
  playerConnections.forEach((res, playerGuid) => {
    try {
      const result = res.write(keepaliveMessage);
      if (result === false) {
        playersToRemove.push(playerGuid);
        
        // Close the connection
        try {
          if (res.end) {
            res.end();
          }
        } catch (e) {
          // Already closed
        }
      }
    } catch (error) {
      playersToRemove.push(playerGuid);
    }
  });
  
  // Clean up failed player connections
  playersToRemove.forEach(playerGuid => {
    playerConnections.delete(playerGuid);
  });
  
  // Log connection stats
  console.log(`SSE Stats: ${tableConnections.size} tables, ${playerConnections.size} players, ${connectionIds.size} total connections`);
}

// Set up a keepalive interval - using a shorter interval to detect dead connections faster
const KEEPALIVE_INTERVAL = 15000; // 15 seconds
setInterval(sendKeepalive, KEEPALIVE_INTERVAL);