export type Card = {
  rank: string;
  suit: string;
  code: string; // e.g., "AS" for Ace of Spades
};

export type Player = {
  playerGuid: string;
  pocketCards: Card[];
  playerAlias?: string; // Optional player alias for display
  markedForRemoval?: boolean; // Flag to indicate the player should be removed at end of hand
};

export type GamePhase = 'Waiting' | 'Pre-Flop' | 'Flop' | 'Turn' | 'River';

export type Table = {
  tableGuid: string;
  gamePhase: GamePhase;
  communityCards: Card[];
  players: Player[];
  deck: Card[];
  handNumber: number; // Simple sequence number for the current hand (starts at 0)
  maxPlayers: number; // Maximum number of players allowed at the table
  bigBlindPosition: number; // Index of the player with the big blind
  smallBlindPosition: number; // Index of the player with the small blind
  dealerPosition: number; // Index of the player with the dealer button
};
