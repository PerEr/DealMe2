import { NextRequest, NextResponse } from 'next/server';
import { getTable, resetHandToWaiting } from '@/lib/tableManager';
import { generatePokerPlayerAlias } from '@/app/api/tables/playerNamer';
import { generateTableName } from '@/app/api/tables/tableNamer';
import { Table } from '@/lib/types';

interface Params {
  params: {
    tableGuid: string;
  };
}

// Helper function to create a safe version of the table to return to clients
function createSafeTable(table: Table) {
  return {
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
}

// POST /api/tables/[tableGuid]/reset - Reset a hand to waiting state
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { tableGuid } = params;
    const table = getTable(tableGuid);
    
    if (!table) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 });
    }
    
    // Reset the hand to waiting state
    const updatedTable = resetHandToWaiting(tableGuid);
    
    // Return the updated table
    return NextResponse.json({
      table: createSafeTable(updatedTable)
    });
  } catch (error: any) {
    console.error('Error resetting hand:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}