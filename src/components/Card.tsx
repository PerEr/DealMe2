import React from 'react';
import Image from 'next/image';
import { Card as CardType } from '@/lib/types';

interface CardProps {
  card?: CardType;
  hidden?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'auto';
  className?: string;
}

const Card: React.FC<CardProps> = ({ card, hidden = false, size = 'md', className = '' }) => {
  // Define responsive size classes for different screen sizes
  const sizeClasses: {[key: string]: string} = {
    sm: 'w-12 h-16 sm:w-14 sm:h-20 md:w-16 md:h-24 lg:w-20 lg:h-28',
    md: 'w-16 h-24 sm:w-20 sm:h-28 md:w-24 md:h-36 lg:w-28 lg:h-40',
    lg: 'w-20 h-30 sm:w-28 sm:h-40 md:w-32 md:h-48 lg:w-40 lg:h-60',
    xl: 'w-28 h-40 sm:w-36 sm:h-54 md:w-40 md:h-60 lg:w-48 lg:h-72',
    auto: 'w-full h-full', // Will scale with container
  };
  
  // Map for faster rank lookups
  const rankMap: Record<string, string> = {
    'A': '1',
    'J': '11',
    'Q': '12',
    'K': '13'
  };

  // Get the image file path for a card
  const getCardImagePath = (card: CardType): string => {
    const suitCapitalized = card.suit.charAt(0).toUpperCase() + card.suit.slice(1);
    const rankValue = rankMap[card.rank] || card.rank;
    return `/cards/${suitCapitalized}-${rankValue}.png`;
  };
  
  // A reusable card container with consistent styling
  const CardContainer = ({ children, isDashed = false }) => (
    <div 
      style={{ aspectRatio: '2/3' }} 
      className={`${sizeClasses[size]} ${className} relative rounded-lg ${
        isDashed 
          ? 'border border-dashed border-gray-300 dark:border-gray-600' 
          : 'shadow-md dark:shadow-slate-900'
      } flex items-center justify-center overflow-hidden box-border`}
    >
      {children}
    </div>
  );

  // Either show card back (when hidden) or dashed outline (when no card)
  if (!card) {
    // Return dashed outline for no card
    return <CardContainer isDashed={true} />;
  } else if (hidden) {
    // Use the back of card image when hiding an existing card
    return (
      <CardContainer>
        <div className="w-[100%] h-[100%] relative">
          <Image 
            src="/cards/Back.png"
            alt="Card Back"
            fill
            sizes="(max-width: 640px) 30vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 15vw"
            priority
            className="object-cover"
          />
        </div>
      </CardContainer>
    );
  }
  
  // Return the actual card image
  return (
    <CardContainer>
      <div className="w-[100%] h-[100%] relative">
        <Image 
          src={getCardImagePath(card)}
          alt={`${card.rank} of ${card.suit}`}
          fill
          sizes="(max-width: 640px) 30vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 15vw"
          priority
          className="object-cover"
        />
      </div>
    </CardContainer>
  );
};

export default Card;