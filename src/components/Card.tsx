import React from 'react';
import Image from 'next/image';
import { Card as CardType } from '@/lib/types';

interface CardProps {
  card?: CardType;
  hidden?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Card: React.FC<CardProps> = ({ card, hidden = false, size = 'md' }) => {
  // Define responsive size classes for different screen sizes
  const sizeClasses: {[key: string]: string} = {
    sm: 'w-12 h-16 md:w-16 md:h-24',
    md: 'w-20 h-28 md:w-24 md:h-36 lg:w-28 lg:h-40',
    lg: 'w-32 h-48 md:w-40 md:h-60 lg:w-48 lg:h-72',  // Large for community cards
    xl: 'w-40 h-60 md:w-56 md:h-80 lg:w-64 lg:h-96 xl:w-72 xl:h-108',  // Extra large for player cards
  };
  
  
  // Get the image file path for a card
  const getCardImagePath = (card: CardType): string => {
    const suitCapitalized = card.suit.charAt(0).toUpperCase() + card.suit.slice(1);
    let rankValue = card.rank;
    
    // Convert number ranks to their values and face cards to their numbers
    if (card.rank === 'A') rankValue = '1';
    else if (card.rank === 'J') rankValue = '11';
    else if (card.rank === 'Q') rankValue = '12';
    else if (card.rank === 'K') rankValue = '13';
    
    return `/cards/${suitCapitalized}-${rankValue}.png`;
  };
  
  // Either show card back (when hidden) or dashed outline (when no card)
  if (!card) {
    // Return dashed outline for no card
    return (
      <div 
        style={{ aspectRatio: '2/3' }} 
        className={`${sizeClasses[size]} relative rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center`}
      >
        {/* Empty dashed card outline */}
      </div>
    );
  } else if (hidden) {
    // Use the back of card image when hiding an existing card
    return (
      <div style={{ aspectRatio: '2/3' }} className={`${sizeClasses[size]} relative rounded-lg shadow-md dark:shadow-slate-900 flex items-center justify-center overflow-hidden`}>
        <Image 
          src="/cards/Back.png"
          alt="Card Back"
          width={500}
          height={750}
          sizes={`(max-width: 640px) 200px, (max-width: 768px) 300px, (max-width: 1024px) 400px, 500px`}
          priority
          className="object-contain rounded-lg"
        />
      </div>
    );
  }
  
  return (
    <div style={{ aspectRatio: '2/3' }} className={`${sizeClasses[size]} relative rounded-lg shadow-md dark:shadow-slate-900 flex items-center justify-center overflow-hidden`}>
      <Image 
        src={getCardImagePath(card)}
        alt={`${card.rank} of ${card.suit}`}
        width={500}
        height={750}
        sizes={`(max-width: 640px) 200px, (max-width: 768px) 300px, (max-width: 1024px) 400px, 500px`}
        priority
        className="object-contain rounded-lg"
      />
    </div>
  );
};

export default Card;