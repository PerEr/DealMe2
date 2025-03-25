import React from 'react';
import Image from 'next/image';

interface DeckDisplayProps {
  cardsRemaining: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const DeckDisplay: React.FC<DeckDisplayProps> = ({ 
  cardsRemaining,
  size = 'lg'
}) => {
  // Define responsive size classes for different screen sizes
  const sizeClasses: {[key: string]: string} = {
    sm: 'w-12 h-16 md:w-16 md:h-24',
    md: 'w-20 h-28 md:w-24 md:h-36 lg:w-28 lg:h-40',
    lg: 'w-32 h-48 md:w-40 md:h-60 lg:w-48 lg:h-72',  // Large for community cards
    xl: 'w-40 h-60 md:w-56 md:h-80 lg:w-64 lg:h-96 xl:w-72 xl:h-108',  // Extra large for player cards
  };

  return (
    <div className={`${sizeClasses[size]} relative`}>
      {/* Create a stack-like appearance with multiple card backs */}
      {[...Array(3)].map((_, index) => (
        <div 
          key={`deck-card-${index}`}
          className="absolute inset-0 rounded-lg shadow-md overflow-hidden border-2 border-gray-300 dark:border-slate-700"
          style={{
            top: `${index * -2}px`,
            left: `${index * 2}px`,
            transform: `rotate(${index * 2}deg)`,
            zIndex: 3 - index
          }}
        >
          <Image 
            src="/cards/Back.png"
            alt="Card Back"
            fill
            className="object-contain"
          />
        </div>
      ))}
      
      {/* Card count */}
      <div className="absolute bottom-0 left-0 right-0 text-center text-xs text-gray-600 dark:text-gray-400 mt-2 bg-white dark:bg-gray-800 bg-opacity-80 dark:bg-opacity-80 py-1 rounded">
        {cardsRemaining} cards
      </div>
    </div>
  );
};

export default DeckDisplay;