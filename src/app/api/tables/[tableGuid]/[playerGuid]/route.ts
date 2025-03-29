import { NextRequest, NextResponse } from 'next/server';
import { getTable, removePlayer, foldHand } from '@/lib/tableManager';
import { generatePokerPlayerAlias } from '@/app/api/tables/playerNamer';
import { generateTableName } from '@/app/api/tables/tableNamer';

interface Params {
  params: {
    tableGuid: string;
    playerGuid: string;
  };
}

// DELETE /api/tables/[tableGuid]/[playerGuid] - Remove a player from a table
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { tableGuid, playerGuid } = params;
    
    const table = getTable(tableGuid);
    
    if (!table) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 });
    }
    
    // Check if player exists in the table
    const playerExists = table.players.some(p => p.playerGuid === playerGuid);
    
    if (!playerExists) {
      return NextResponse.json({ error: 'Player not found in this table' }, { status: 404 });
    }
    
    // Remove the player
    const updatedTable = removePlayer(tableGuid, playerGuid);
    
    // Return the updated table without the deck
    const safeTable = {
      ...updatedTable,
      tableName: generateTableName(updatedTable.tableGuid),
      // Add player aliases
      players: updatedTable.players.map(player => ({
        ...player,
        playerAlias: generatePokerPlayerAlias(player.playerGuid)
      })),
      deck: [], // Don't expose the deck to clients
      lastUpdated: new Date().toISOString()
    };
    
    return NextResponse.json({ 
      success: true,
      table: safeTable
    });
  } catch (error: any) {
    console.error('Error removing player:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/tables/[tableGuid]/[playerGuid] - Handle player actions
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { tableGuid, playerGuid } = params;
    const { action } = await request.json();
    
    const table = getTable(tableGuid);
    
    if (!table) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 });
    }
    
    // Check if player exists in the table
    const playerExists = table.players.some(p => p.playerGuid === playerGuid);
    
    if (!playerExists) {
      return NextResponse.json({ error: 'Player not found in this table' }, { status: 404 });
    }
    
    let updatedTable;
    
    // Handle different player actions
    switch (action) {
      case 'fold':
        updatedTable = foldHand(tableGuid, playerGuid);
        break;
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
    
    // Return the updated table without the deck
    const safeTable = {
      ...updatedTable,
      tableName: generateTableName(updatedTable.tableGuid),
      // Add player aliases
      players: updatedTable.players.map(player => ({
        ...player,
        playerAlias: generatePokerPlayerAlias(player.playerGuid)
      })),
      deck: [], // Don't expose the deck to clients
      lastUpdated: new Date().toISOString()
    };
    
    return NextResponse.json({ 
      success: true,
      table: safeTable
    });
  } catch (error: any) {
    console.error('Error handling player action:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}