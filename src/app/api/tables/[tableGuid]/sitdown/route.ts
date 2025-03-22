import { NextRequest, NextResponse } from 'next/server';
import { getTable, addPlayer } from '@/lib/tableManager';

interface Params {
  params: {
    tableGuid: string;
  };
}

// Map to track in-flight requests to prevent duplicates
// Using a Map with tableGuid as key and Set of RequestIds as values
const inFlightRequests = new Map<string, Set<string>>();

// Clean up completed requests after a delay
const cleanupRequest = (tableGuid: string, requestId: string) => {
  setTimeout(() => {
    const requests = inFlightRequests.get(tableGuid);
    if (requests) {
      requests.delete(requestId);
      if (requests.size === 0) {
        inFlightRequests.delete(tableGuid);
      }
    }
  }, 5000); // Clean up after 5 seconds
};

// POST /api/tables/[tableGuid]/sitdown - Add a player to a table
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { tableGuid } = params;
    
    // Generate a unique ID for this request
    const requestId = crypto.randomUUID();
    
    // Check if this table has in-flight requests
    if (!inFlightRequests.has(tableGuid)) {
      inFlightRequests.set(tableGuid, new Set());
    }
    
    // Add this request to the in-flight set
    const requests = inFlightRequests.get(tableGuid)!;
    
    // If there are already too many in-flight requests, return a 429 to prevent abuse
    if (requests.size >= 3) { // Limit to 3 concurrent sit-down requests per table
      return NextResponse.json({ 
        error: 'Too many sit-down requests for this table. Please try again.' 
      }, { status: 429 });
    }
    
    requests.add(requestId);
    
    const table = getTable(tableGuid);
    
    if (!table) {
      // Clean up the request ID since we're returning early
      requests.delete(requestId);
      return NextResponse.json({ error: 'Table not found' }, { status: 404 });
    }
    
    // Add a new player to the table
    const { player, table: updatedTable } = addPlayer(tableGuid);
    console.log('Added player at table ' + tableGuid);
    
    // Schedule cleanup of this request ID
    cleanupRequest(tableGuid, requestId);
    
    // Return the player GUID for redirection
    return NextResponse.json({
      playerGuid: player.playerGuid,
      redirect: `/player/${player.playerGuid}`
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error adding player to table:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
