import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Table, Player, GamePhase, Card } from './types';
import { createDeck, shuffleDeck, dealCards } from './cardUtils';

const TABLES_DIR = path.join(process.cwd(), 'tables');

// Ensure tables directory exists
if (!fs.existsSync(TABLES_DIR)) {
  fs.mkdirSync(TABLES_DIR, { recursive: true });
}

// Create a new table
export function createTable(): Table {
  const tableGuid = uuidv4();
  const deck = shuffleDeck(createDeck());
  
  const table: Table = {
    tableGuid,
    gamePhase: 'Waiting',
    communityCards: [],
    players: [],
    deck,
    handId: uuidv4(),
    maxPlayers: 10,
    bigBlindPosition: 0 // Initialize big blind at first position
  };
  
  // Save the table to disk
  saveTable(table);
  
  return table;
}

// Get all tables
export function getAllTables(): Table[] {
  if (!fs.existsSync(TABLES_DIR)) {
    return [];
  }
  
  const tableFiles = fs.readdirSync(TABLES_DIR)
    .filter(file => file.endsWith('.json'));
  
  const tables: Table[] = [];
  
  for (const file of tableFiles) {
    const filePath = path.join(TABLES_DIR, file);
    const tableData = fs.readFileSync(filePath, 'utf-8');
    tables.push(JSON.parse(tableData));
  }
  
  return tables;
}

// Get a single table by guid
export function getTable(tableGuid: string): Table | null {
  const filePath = path.join(TABLES_DIR, `${tableGuid}.json`);
  
  if (!fs.existsSync(filePath)) {
    return null;
  }
  
  const tableData = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(tableData);
}

// Save a table to disk
export function saveTable(table: Table): void {
  const filePath = path.join(TABLES_DIR, `${table.tableGuid}.json`);
  fs.writeFileSync(filePath, JSON.stringify(table, null, 2));
}

// Add a player to a table
export function addPlayer(tableGuid: string): { player: Player; table: Table } {
  const table = getTable(tableGuid);
  
  if (!table) {
    throw new Error(`Table with guid ${tableGuid} not found`);
  }
  
  if (table.players.length >= table.maxPlayers) {
    throw new Error(`Table is full (${table.maxPlayers} players maximum)`);
  }
  
  // Create a new player
  const playerGuid = uuidv4();
  
  // Create the player with empty pocket cards initially
  const player: Player = {
    playerGuid,
    pocketCards: []
  };
  
  // Only deal cards if we're in a hand
  if (table.gamePhase !== 'Waiting') {
    // Deal two pocket cards to the player
    const { cards: pocketCards, remainingDeck } = dealCards(table.deck, 2);
    player.pocketCards = pocketCards;
    table.deck = remainingDeck;
  }
  
  // Update the table
  table.players.push(player);
  
  // Save the updated table
  saveTable(table);
  
  return { player, table };
}

// Advance to the next game phase
export function advanceGamePhase(tableGuid: string): Table {
  const table = getTable(tableGuid);
  
  if (!table) {
    throw new Error(`Table with guid ${tableGuid} not found`);
  }
  
  switch (table.gamePhase) {
    case 'Waiting':
      // Deal pocket cards to all players (start the hand)
      dealPocketCards(table);
      table.gamePhase = 'Pre-Flop';
      break;
      
    case 'Pre-Flop':
      // Deal the flop (3 community cards)
      const flopResult = dealCards(table.deck, 3);
      table.communityCards = flopResult.cards;
      table.deck = flopResult.remainingDeck;
      table.gamePhase = 'Flop';
      break;
      
    case 'Flop':
      // Deal the turn (1 more community card)
      const turnResult = dealCards(table.deck, 1);
      table.communityCards = [...table.communityCards, ...turnResult.cards];
      table.deck = turnResult.remainingDeck;
      table.gamePhase = 'Turn';
      break;
      
    case 'Turn':
      // Deal the river (1 more community card)
      const riverResult = dealCards(table.deck, 1);
      table.communityCards = [...table.communityCards, ...riverResult.cards];
      table.deck = riverResult.remainingDeck;
      table.gamePhase = 'River';
      break;
      
    case 'River':
      // Reset to waiting state
      resetToWaitingState(table);
      break;
  }
  
  // Save the updated table
  saveTable(table);
  
  return table;
}

// Deal pocket cards to all players
function dealPocketCards(table: Table): void {
  // Generate a new hand ID if not already done
  if (table.gamePhase === 'Waiting') {
    table.handId = uuidv4();
  }
  
  // Deal new pocket cards to all players
  for (const player of table.players) {
    const { cards, remainingDeck } = dealCards(table.deck, 2);
    player.pocketCards = cards;
    table.deck = remainingDeck;
  }
}

// Reset to waiting state (between hands)
function resetToWaitingState(table: Table): void {
  // Create and shuffle a new deck
  table.deck = shuffleDeck(createDeck());
  
  // Clear community cards
  table.communityCards = [];
  
  // Clear all players' pocket cards
  for (const player of table.players) {
    player.pocketCards = [];
  }
  
  // Generate a new hand ID
  table.handId = uuidv4();
  
  // Move the big blind to the next player
  if (table.players.length > 0) {
    table.bigBlindPosition = (table.bigBlindPosition + 1) % table.players.length;
  }
  
  // Set game phase to waiting
  table.gamePhase = 'Waiting';
}

// Start a new hand - resets the game and immediately deals new cards
export function startNewHand(tableGuid: string): Table {
  const table = getTable(tableGuid);
  
  if (!table) {
    throw new Error(`Table with guid ${tableGuid} not found`);
  }
  
  // Reset the table to waiting state
  resetToWaitingState(table);
  
  // Immediately deal cards and advance to pre-flop
  dealPocketCards(table);
  table.gamePhase = 'Pre-Flop';
  
  // Save the updated table
  saveTable(table);
  
  return table;
}

// Remove a player from the table
export function removePlayer(tableGuid: string, playerGuid: string): Table {
  const table = getTable(tableGuid);
  
  if (!table) {
    throw new Error(`Table with guid ${tableGuid} not found`);
  }
  
  const playerIndex = table.players.findIndex(p => p.playerGuid === playerGuid);
  
  if (playerIndex === -1) {
    throw new Error(`Player with guid ${playerGuid} not found at table ${tableGuid}`);
  }
  
  // Remove the player
  table.players.splice(playerIndex, 1);
  
  // Save the updated table
  saveTable(table);
  
  return table;
}

// Delete a table
export function deleteTable(tableGuid: string): void {
  const filePath = path.join(TABLES_DIR, `${tableGuid}.json`);
  
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}
