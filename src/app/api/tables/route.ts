import { NextRequest, NextResponse } from 'next/server';
import { createTable, getAllTables } from '@/lib/tableManager';

// GET /api/tables - Get all tables
export async function GET() {
  try {
    const tables = getAllTables();
    
    // Create a safe version of each table to return (remove cards from deck)
    const safeTables = tables.map(table => ({
      tableGuid: table.tableGuid,
      gamePhase: table.gamePhase,
      playerCount: table.players.length,
      maxPlayers: table.maxPlayers,
    }));
    
    return NextResponse.json({ tables: safeTables });
  } catch (error: any) {
    console.error('Error fetching tables:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/tables - Create a new table
export async function POST() {
  try {
    const table = createTable();
    
    return NextResponse.json({
      tableGuid: table.tableGuid,
      redirect: `/table/${table.tableGuid}`
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating table:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
