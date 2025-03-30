import React from 'react';
import Image from 'next/image';

interface DeckDisplayProps {
  cardsRemaining: number;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'auto';
  onClick?: () => void;
  isClickable?: boolean;
  className?: string;
}

const DeckDisplay: React.FC<DeckDisplayProps> = ({ 
  cardsRemaining,
  size = 'lg',
  onClick,
  isClickable = false,
  className = ''
}) => {
  // Define responsive size classes for different screen sizes
  const sizeClasses: {[key: string]: string} = {
    sm: 'w-12 h-16 sm:w-14 sm:h-20 md:w-16 md:h-24 lg:w-20 lg:h-28',
    md: 'w-16 h-24 sm:w-20 sm:h-28 md:w-24 md:h-36 lg:w-28 lg:h-40',
    lg: 'w-20 h-30 sm:w-28 sm:h-40 md:w-32 md:h-48 lg:w-40 lg:h-60',
    xl: 'w-28 h-40 sm:w-36 sm:h-54 md:w-40 md:h-60 lg:w-48 lg:h-72',
    auto: 'w-full h-full', // Will scale with container
  };

  return (
    <div 
      className={`${sizeClasses[size]} ${className} relative ${isClickable ? 'cursor-pointer transform hover:scale-105 transition-transform duration-200' : ''}`}
      onClick={isClickable && onClick ? onClick : undefined}
      role={isClickable ? 'button' : undefined}
      aria-label={isClickable ? 'Advance game' : undefined}
      style={{ aspectRatio: '2/3' }}
    >
      {/* Create a stack-like appearance with multiple card backs */}
      {[...Array(3)].map((_, index) => (
        <div 
          key={`deck-card-${index}`}
          className="absolute inset-0 rounded-lg shadow-md overflow-hidden border border-gray-300 dark:border-slate-700 box-border"
          style={{
            top: `${index * -2}px`,
            left: `${index * 2}px`,
            transform: `rotate(${index * 2}deg)`,
            zIndex: 3 - index
          }}
        >
          <div className="w-[100%] h-[100%] relative">
            <Image 
              src="/cards/Back.png"
              alt="Card Back"
              fill
              sizes="(max-width: 640px) 30vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 15vw"
              className="object-cover"
            />
          </div>
        </div>
      ))}
      
      {/* Card count */}
      <div className="absolute bottom-0 left-0 right-0 text-center text-xs text-gray-600 dark:text-gray-400 mt-2 bg-white dark:bg-gray-800 bg-opacity-80 dark:bg-opacity-80 py-1 rounded">
        {cardsRemaining} cards
      </div>
      
      {/* Visual cue for clickable deck */}
      {isClickable && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 bg-opacity-60 dark:bg-opacity-60 rounded-full p-2 animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeckDisplay;