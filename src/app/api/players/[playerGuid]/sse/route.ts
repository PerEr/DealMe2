import { NextRequest } from 'next/server';
import { getAllTables } from '@/lib/tableManager';
import { setupSSE, addPlayerConnection } from '@/lib/sseUtils';

interface Params {
  params: {
    playerGuid: string;
  };
}

// GET /api/players/[playerGuid]/sse - SSE endpoint for player updates
export async function GET(request: NextRequest, { params }: Params) {
  const { playerGuid } = params;
  
  // Find the table that contains this player
  const tables = getAllTables();
  let playerData = null;
  let tableData = null;
  
  for (const table of tables) {
    const player = table.players.find(p => p.playerGuid === playerGuid);
    
    if (player) {
      playerData = player;
      tableData = table;
      break;
    }
  }
  
  if (!playerData || !tableData) {
    return new Response('Player not found', { status: 404 });
  }
  
  // Prepare player data
  const playerUpdateData = {
    player: playerData,
    tableGuid: tableData.tableGuid,
    gamePhase: tableData.gamePhase,
    handId: tableData.handId
  };
  
  // Create the SSE response
  const encoder = new TextEncoder();
  const responseStream = new ReadableStream({
    start(controller) {
      // Initial player state
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ player: playerUpdateData })}\n\n`));
      
      // We'll create a proxy for the response to use with setupSSE and addPlayerConnection
      const res = {
        write: (data: string) => {
          controller.enqueue(encoder.encode(data));
          return true;
        },
        end: () => {
          controller.close();
        },
        on: (event: string, callback: () => void) => {
          // Handle close event when the stream is canceled
          if (event === 'close') {
            request.signal.addEventListener('abort', callback);
          }
          return res;
        },
        // Mock headers for setupSSE
        setHeader: () => res,
        flushHeaders: () => {}
      };
      
      // Set up the response for SSE
      setupSSE(res as any);
      
      // Register the connection
      addPlayerConnection(playerGuid, res as any);
    }
  });
  
  // Create the Response object with appropriate headers
  const response = new Response(responseStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive'
    }
  });
  
  return response;
}

export const dynamic = 'force-dynamic';
