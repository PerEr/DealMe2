import { NextRequest, NextResponse } from 'next/server';
import { getTable, addPlayer } from '@/lib/tableManager';

interface Params {
  params: {
    tableGuid: string;
  };
}

// POST /api/tables/[tableGuid]/sitdown - Add a player to a table
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { tableGuid } = params;
    const table = getTable(tableGuid);
    
    if (!table) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 });
    }
    
    // Add a new player to the table
    const { player, table: updatedTable } = addPlayer(tableGuid);
    
    // With polling, we no longer need to send real-time updates via SSE
    // Clients will get the updated state on their next poll
    
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
