import React from 'react';
import { Card as CardType } from '@/lib/types';

interface CardProps {
  card?: CardType;
  hidden?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const Card: React.FC<CardProps> = ({ card, hidden = false, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-12 h-16',
    md: 'w-16 h-24',
    lg: 'w-20 h-30'
  };
  
  const getSuitSymbol = (suit: string) => {
    switch (suit) {
      case 'hearts':
        return '♥';
      case 'diamonds':
        return '♦';
      case 'clubs':
        return '♣';
      case 'spades':
        return '♠';
      default:
        return '';
    }
  };
  
  const getSuitColor = (suit: string) => {
    return (suit === 'hearts' || suit === 'diamonds') ? 'text-red-600' : 'text-black';
  };
  
  if (!card || hidden) {
    return (
      <div className={`${sizeClasses[size]} rounded-lg bg-gradient-to-r from-blue-800 to-blue-600 flex items-center justify-center text-white border-2 border-white shadow-md`}>
        <div className="transform -rotate-45">♣♥♠♦</div>
      </div>
    );
  }
  
  return (
    <div className={`${sizeClasses[size]} rounded-lg bg-white flex flex-col items-center justify-between p-1 border border-gray-300 shadow-md`}>
      <div className={`self-start font-bold ${getSuitColor(card.suit)}`}>
        {card.rank === 'T' ? '10' : card.rank}
      </div>
      <div className={`text-2xl ${getSuitColor(card.suit)}`}>
        {getSuitSymbol(card.suit)}
      </div>
      <div className={`self-end font-bold ${getSuitColor(card.suit)} transform rotate-180`}>
        {card.rank === 'T' ? '10' : card.rank}
      </div>
    </div>
  );
};

export default Card;