import { NextRequest, NextResponse } from 'next/server';
import { getTable, deleteTable, advanceGamePhase } from '@/lib/tableManager';
import { generatePokerPlayerAlias } from '@/app/api/tables/playerNamer';
import { generateTableName } from '@/app/api/tables/tableNamer';

interface Params {
  params: {
    tableGuid: string;
  };
}

// GET /api/tables/[tableGuid] - Get a specific table
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { tableGuid } = params;
    const table = getTable(tableGuid);
    
    if (!table) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 });
    }
    
    // Create a safe version of the table to return (hide deck)
    const safeTable = {
      ...table,
      tableName: generateTableName(table.tableGuid),
      // Add player aliases
      players: table.players.map(player => ({
        ...player,
        playerAlias: generatePokerPlayerAlias(player.playerGuid)
      })),
      deck: [], // Don't expose the deck to clients
      lastUpdated: new Date().toISOString() // Add timestamp for client synchronization
    };
    
    return NextResponse.json({ table: safeTable });
  } catch (error: any) {
    console.error('Error fetching table:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/tables/[tableGuid] - Delete a table
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { tableGuid } = params;
    const table = getTable(tableGuid);
    
    if (!table) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 });
    }
    
    deleteTable(tableGuid);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting table:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/tables/[tableGuid] - Advance the game phase
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { tableGuid } = params;
    console.log(`Received request to advance game phase for table ${tableGuid}`);
    
    const table = getTable(tableGuid);
    
    if (!table) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 });
    }
    
    console.log(`Current game phase for table ${tableGuid}: ${table.gamePhase}`);
    
    // Advance the game phase
    const updatedTable = advanceGamePhase(tableGuid);
    console.log(`Advanced game phase for table ${tableGuid} to: ${updatedTable.gamePhase}`);
    
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
    console.error('Error advancing game phase:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
