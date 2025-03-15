import { NextRequest, NextResponse } from 'next/server';
import { getAllTables } from '@/lib/tableManager';

interface Params {
  params: {
    playerGuid: string;
  };
}

// GET /api/players/[playerGuid] - Get player information
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { playerGuid } = params;
    
    // Find the table that contains this player
    const tables = getAllTables();
    let playerData = null;
    let tableData = null;
    
    for (const table of tables) {
      const player = table.players.find(p => p.playerGuid === playerGuid);
      
      if (player) {
        playerData = player;
        tableData = {
          tableGuid: table.tableGuid,
          gamePhase: table.gamePhase,
          handId: table.handId
        };
        break;
      }
    }
    
    if (!playerData || !tableData) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      player: playerData,
      table: tableData
    });
  } catch (error: any) {
    console.error('Error fetching player:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
