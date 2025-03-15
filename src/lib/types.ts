export type Card = {
  rank: string;
  suit: string;
  code: string; // e.g., "AS" for Ace of Spades
};

export type Player = {
  playerGuid: string;
  pocketCards: Card[];
  seat?: number; // Optional seat number
};

export type GamePhase = 'Waiting' | 'Pre-Flop' | 'Flop' | 'Turn' | 'River';

export type Table = {
  tableGuid: string;
  gamePhase: GamePhase;
  communityCards: Card[];
  players: Player[];
  deck: Card[];
  handId: string; // Unique identifier for the current hand
  maxPlayers: number; // Maximum number of players allowed at the table
};
