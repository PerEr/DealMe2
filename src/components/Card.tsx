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
    sm: 'w-[3.1rem] h-[4.1rem] sm:w-[3.6rem] sm:h-[5.1rem] md:w-[4.1rem] md:h-[6.1rem] lg:w-[5.1rem] lg:h-[7.1rem]',
    md: 'w-[4.1rem] h-[6.1rem] sm:w-[5.1rem] sm:h-[7.1rem] md:w-[6.1rem] md:h-[9.1rem] lg:w-[7.1rem] lg:h-[10.1rem]',
    lg: 'w-[5.1rem] h-[7.55rem] sm:w-[7.1rem] sm:h-[10.1rem] md:w-[8.1rem] md:h-[12.1rem] lg:w-[10.1rem] lg:h-[15.1rem]',
    xl: 'w-[7.1rem] h-[10.1rem] sm:w-[9.1rem] sm:h-[13.55rem] md:w-[10.1rem] md:h-[15.1rem] lg:w-[12.1rem] lg:h-[18.1rem]',
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
  
  // Define CardContainer props interface
  interface CardContainerProps {
    children?: React.ReactNode;
    isDashed?: boolean;
  }
  
  // A reusable card container with consistent styling
  const CardContainer: React.FC<CardContainerProps> = ({ children, isDashed = false }) => (
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