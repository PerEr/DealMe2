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
    handNumber: 0, // Start with hand #0
    maxPlayers: 10,
    bigBlindPosition: 0, // Initialize big blind at first position
    smallBlindPosition: 0, // Initialize small blind at first position (will be updated when players join)
    dealerPosition: 0 // Initialize dealer button at first position
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
  
  // Only update positions when a player joins if game is in Waiting state or it's the first player
  if (table.players.length === 1) {
    // First player gets all positions
    table.dealerPosition = 0;
    table.bigBlindPosition = 0;
    table.smallBlindPosition = 0;
  } else if (table.gamePhase === 'Waiting') {
    // Only adjust positions if game is in waiting state (between hands)
    if (table.players.length === 2) {
      // In heads-up (2 players), we follow heads-up rules
      // The dealer/button has the small blind, the other player has the big blind
      table.dealerPosition = 0;
      table.smallBlindPosition = 0;
      table.bigBlindPosition = 1;
    } else {
      // For more than 2 players, properly set all positions
      // Small blind is to the left of the dealer
      table.smallBlindPosition = (table.dealerPosition + 1) % table.players.length;
      // Big blind is to the left of the small blind
      table.bigBlindPosition = (table.smallBlindPosition + 1) % table.players.length;
    }
  }
  // If it's during an active hand (not 'Waiting'), keep the positions as they are
  // This ensures blinds and dealer don't move when a player sits down mid-hand
  
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
  // No need to generate a new hand ID since we're using handNumber now
  
  // Deal new pocket cards to all players
  for (const player of table.players) {
    const { cards, remainingDeck } = dealCards(table.deck, 2);
    player.pocketCards = cards;
    table.deck = remainingDeck;
  }
}

// Update dealer button and blind positions according to poker rules
function updateBlindPositions(table: Table): void {
  const numPlayers = table.players.length;
  
  if (numPlayers === 0) {
    // No players, reset all positions to 0
    table.dealerPosition = 0;
    table.bigBlindPosition = 0;
    table.smallBlindPosition = 0;
    return;
  }
  
  if (numPlayers === 1) {
    // Only one player, they have all positions (theoretical)
    table.dealerPosition = 0;
    table.bigBlindPosition = 0;
    table.smallBlindPosition = 0;
    return;
  }
  
  // Move the dealer button clockwise
  table.dealerPosition = (table.dealerPosition + 1) % numPlayers;
  
  if (numPlayers === 2) {
    // Heads-up play: Button/dealer has small blind, other player has big blind
    table.smallBlindPosition = table.dealerPosition;
    table.bigBlindPosition = (table.dealerPosition + 1) % 2;
    return;
  }
  
  // Normal multi-player poker:
  // Small blind is to the left of the dealer button
  table.smallBlindPosition = (table.dealerPosition + 1) % numPlayers;
  
  // Big blind is to the left of the small blind
  table.bigBlindPosition = (table.smallBlindPosition + 1) % numPlayers;
}

// Reset to waiting state (between hands)
function resetToWaitingState(table: Table): void {
  // Store current blind and dealer positions BEFORE removing players
  const blindPositionsBeforeRemoval = {
    dealerPlayerGuid: table.players[table.dealerPosition]?.playerGuid,
    bigBlindPlayerGuid: table.players[table.bigBlindPosition]?.playerGuid,
    smallBlindPlayerGuid: table.players[table.smallBlindPosition]?.playerGuid,
  };
  
  // Find which players are being removed (for proper blind movement)
  const removingDealer = table.players[table.dealerPosition]?.markedForRemoval === true;
  const removingBigBlind = table.players[table.bigBlindPosition]?.markedForRemoval === true;
  const removingSmallBlind = table.players[table.smallBlindPosition]?.markedForRemoval === true;
  
  // Remove any players that were marked for removal during the hand
  table.players = table.players.filter(player => !player.markedForRemoval);
  
  // Create and shuffle a new deck
  table.deck = shuffleDeck(createDeck());
  
  // Clear community cards
  table.communityCards = [];
  
  // Clear all players' pocket cards
  for (const player of table.players) {
    player.pocketCards = [];
  }
  
  // Increment hand number
  table.handNumber++;
  
  // Handle positions correctly after player removal
  if (table.players.length > 0) {
    // If all positions were removed or we need a full reset, just use the default logic
    if ((removingDealer && removingBigBlind && removingSmallBlind) || 
        table.players.length <= 2) {
      updateBlindPositions(table);
    } else {
      // Otherwise, handle each position case individually
      
      // Handle dealer position
      if (removingDealer) {
        // Dealer was removed, so move to next player position
        table.dealerPosition = (table.dealerPosition) % table.players.length;
      } else {
        // Find where dealer is now after removals
        const newDealerPos = table.players.findIndex(
          p => p.playerGuid === blindPositionsBeforeRemoval.dealerPlayerGuid
        );
        table.dealerPosition = newDealerPos >= 0 ? newDealerPos : 0;
      }
      
      // For standard poker, move the dealer button clockwise, then set blinds accordingly
      table.dealerPosition = (table.dealerPosition + 1) % table.players.length;
      
      // Now set small and big blind positions based on dealer position
      if (table.players.length === 2) {
        // Heads-up: dealer has small blind, other has big blind
        table.smallBlindPosition = table.dealerPosition;
        table.bigBlindPosition = (table.dealerPosition + 1) % 2;
      } else {
        // Normal play: small blind is left of dealer, big blind is left of small blind
        table.smallBlindPosition = (table.dealerPosition + 1) % table.players.length;
        table.bigBlindPosition = (table.smallBlindPosition + 1) % table.players.length;
      }
    }
  }
  
  // Set game phase to waiting
  table.gamePhase = 'Waiting';
}

// Removed unused function startNewHand

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
  
  // If we're in the waiting state, remove the player immediately
  // Otherwise, mark them for removal at the end of the hand
  if (table.gamePhase === 'Waiting') {
    // Check if removed player had a position
    const hadBigBlind = playerIndex === table.bigBlindPosition;
    const hadSmallBlind = playerIndex === table.smallBlindPosition;
    const hadDealer = playerIndex === table.dealerPosition;
    
    // Remove the player
    table.players.splice(playerIndex, 1);
    
    // Adjust positions after player removal
    if (table.players.length > 0) {
      // Handle dealer position
      if (hadDealer || playerIndex < table.dealerPosition) {
        if (hadDealer) {
          // If the dealer was removed, move it to the next available player
          table.dealerPosition = table.players.length > 0 ? 0 : 0;
        } else {
          // If a player before the dealer was removed, adjust the index
          table.dealerPosition--;
        }
      }
      
      // Handle big blind position
      if (hadBigBlind || playerIndex < table.bigBlindPosition) {
        if (hadBigBlind) {
          // If the big blind was removed, move it to the next available player
          table.bigBlindPosition = table.players.length > 0 ? 0 : 0;
        } else {
          // If a player before the big blind was removed, adjust the index
          table.bigBlindPosition--;
        }
      }
      
      // Handle small blind position
      if (hadSmallBlind || playerIndex < table.smallBlindPosition) {
        if (hadSmallBlind) {
          // If the small blind was removed, reassign it
          if (table.players.length <= 1) {
            table.smallBlindPosition = 0;
          } else {
            // Place it appropriately based on dealer position
            table.smallBlindPosition = (table.dealerPosition + 1) % table.players.length;
          }
        } else {
          // If a player before the small blind was removed, adjust the index
          table.smallBlindPosition--;
        }
      }
      
      // Ensure all positions are valid (within range of player count)
      table.dealerPosition = Math.min(table.dealerPosition, table.players.length - 1);
      table.bigBlindPosition = Math.min(table.bigBlindPosition, table.players.length - 1);
      table.smallBlindPosition = Math.min(table.smallBlindPosition, table.players.length - 1);
      
      // For heads-up play (2 players), ensure positions follow heads-up rules
      if (table.players.length === 2) {
        // Dealer has small blind, other player has big blind
        table.smallBlindPosition = table.dealerPosition;
        table.bigBlindPosition = (table.dealerPosition + 1) % 2;
      }
      
      // For single player, all positions are 0
      if (table.players.length === 1) {
        table.dealerPosition = 0;
        table.bigBlindPosition = 0;
        table.smallBlindPosition = 0;
      }
    }
  } else {
    // Mark the player for removal instead of removing immediately
    table.players[playerIndex].markedForRemoval = true;
    
    // Note: We don't adjust positions during active hand, will handle in resetToWaitingState
  }
  
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
