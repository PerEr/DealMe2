import React, { useState } from 'react';
import Image from 'next/image';
import { Card as CardType } from '@/lib/types';

interface FlippableCardProps {
  card: CardType;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const FlippableCard: React.FC<FlippableCardProps> = ({ card, size = 'md' }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  // Define responsive size classes for different screen sizes
  const sizeClasses: {[key: string]: string} = {
    sm: 'w-12 h-16 md:w-16 md:h-24',
    md: 'w-20 h-28 md:w-24 md:h-36 lg:w-28 lg:h-40',
    lg: 'w-32 h-48 md:w-40 md:h-60 lg:w-48 lg:h-72',
    xl: 'w-40 h-60 md:w-56 md:h-80 lg:w-64 lg:h-96 xl:w-72 xl:h-108',
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

  const handleMouseDown = () => {
    setIsFlipped(true);
  };

  const handleMouseUp = () => {
    setIsFlipped(false);
  };

  const handleTouchStart = () => {
    setIsFlipped(true);
  };

  const handleTouchEnd = () => {
    setIsFlipped(false);
  };

  // Function to prevent context menu (right-click/long-press)
  const preventContextMenu = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  };
  
  // Function to handle both touchstart and prevent default
  const handleTouchStartWithPrevent = (e: React.TouchEvent) => {
    // Prevent iOS Safari from showing the context menu
    e.stopPropagation();
    
    // Call the original handler
    handleTouchStart();
  };

  return (
    <div 
      style={{ aspectRatio: '2/3' }} 
      className={`${sizeClasses[size]} relative rounded-lg shadow-md flex items-center justify-center overflow-hidden cursor-pointer select-none touch-none`}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStartWithPrevent}
      onTouchEnd={handleTouchEnd}
      onTouchMove={preventContextMenu}
      onTouchCancel={handleTouchEnd}
      onContextMenu={preventContextMenu} // Prevent right-click menu
      draggable={false} // Prevent dragging
      unselectable="on" // Older browsers
    >
      {/* We use a simpler flip effect with opacity transitions for better mobile compatibility */}
      {/* Card wrapper to maintain consistent size */}
      <div className="w-full h-full relative select-none touch-none">
        {/* Card Back (shown when not flipped) */}
        <div 
          className={`absolute inset-0 transition-opacity duration-200 ${isFlipped ? 'opacity-0' : 'opacity-100'} select-none touch-none`}
          onContextMenu={preventContextMenu}
        >
          <Image 
            src="/cards/Back.png"
            alt="Card Back"
            fill
            priority
            className="object-contain pointer-events-none select-none"
            draggable={false}
            unselectable="on"
            onContextMenu={preventContextMenu}
          />
        </div>

        {/* Card Front (shown when flipped) */}
        <div 
          className={`absolute inset-0 transition-opacity duration-200 ${isFlipped ? 'opacity-100' : 'opacity-0'} select-none touch-none`}
          onContextMenu={preventContextMenu}
        >
          <Image 
            src={getCardImagePath(card)}
            alt={`${card.rank} of ${card.suit}`}
            fill
            priority
            className="object-contain pointer-events-none select-none"
            draggable={false}
            unselectable="on"
            onContextMenu={preventContextMenu}
          />
        </div>
      </div>
    </div>
  );
};

export default FlippableCard;