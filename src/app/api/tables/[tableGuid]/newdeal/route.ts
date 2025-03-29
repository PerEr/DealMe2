import { NextRequest, NextResponse } from 'next/server';
import { getTable, startNewHand } from '@/lib/tableManager';
import { generatePokerPlayerAlias } from '@/app/api/tables/playerNamer';
import { generateTableName } from '@/app/api/tables/tableNamer';

interface Params {
  params: {
    tableGuid: string;
  };
}

// POST /api/tables/[tableGuid]/newdeal - Start a new deal
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { tableGuid } = params;
    console.log(`Received request to start a new deal for table ${tableGuid}`);
    
    const table = getTable(tableGuid);
    
    if (!table) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 });
    }
    
    console.log(`Current game phase for table ${tableGuid}: ${table.gamePhase}`);
    
    // Start a new hand
    const updatedTable = startNewHand(tableGuid);
    console.log(`Started new deal for table ${tableGuid}, game phase is now: ${updatedTable.gamePhase}`);
    
    // Return the updated table
    return NextResponse.json({
      table: {
        ...updatedTable,
        tableName: generateTableName(updatedTable.tableGuid),
        // Add player aliases
        players: updatedTable.players.map(player => ({
          ...player,
          playerAlias: generatePokerPlayerAlias(player.playerGuid)
        })),
        deck: [], // Don't expose the deck to clients
        lastUpdated: new Date().toISOString() // Add timestamp for client synchronization
      }
    });
  } catch (error: any) {
    console.error('Error starting new deal:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}