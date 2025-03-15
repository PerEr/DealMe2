import { Card } from './types';
import crypto from 'crypto';

// Create a standard 52-card deck
export function createDeck(): Card[] {
  const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  
  const deck: Card[] = [];
  
  for (const suit of suits) {
    for (const rank of ranks) {
      // Create a code for each card (e.g., "AS" for Ace of Spades)
      const rankCode = rank === '10' ? 'T' : rank;
      const suitCode = suit[0].toUpperCase();
      
      deck.push({
        rank,
        suit,
        code: `${rankCode}${suitCode}`,
      });
    }
  }
  
  return deck;
}

// Shuffle the deck using a cryptographically secure method
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  
  // Fisher-Yates shuffle algorithm with crypto randomness
  for (let i = shuffled.length - 1; i > 0; i--) {
    // Generate a random index from 0 to i
    const j = Math.floor(randomNumber(i + 1));
    
    // Swap elements at i and j
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
}

// Generate a random number using crypto module
function randomNumber(max: number): number {
  // Generate 4 random bytes and convert to a 32-bit unsigned integer
  const randomBytes = crypto.randomBytes(4);
  const randomValue = randomBytes.readUInt32BE(0) / (0xffffffff + 1);
  
  return randomValue * max;
}

// Deal cards from the deck
export function dealCards(deck: Card[], count: number): { cards: Card[], remainingDeck: Card[] } {
  const cards = deck.slice(0, count);
  const remainingDeck = deck.slice(count);
  
  return { cards, remainingDeck };
}
