"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Card from '@/components/Card';
import FlippableCard from '@/components/FlippableCard';
import { usePolling } from '@/lib/usePolling';
import { Player as PlayerType } from '@/lib/types';
import { generatePokerPlayerAlias } from '@/app/api/tables/playerNamer';

interface PlayerData {
  player: PlayerType;
  tableGuid: string;
  tableName?: string;
  gamePhase: string;
  handId: string;
}

// Add CSS to prevent iOS contextual menu on images and text selection
const preventIosContextMenuStyles = `
  /* Prevent iOS contextual menus on images */
  img {
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
    -webkit-user-drag: none;
    user-drag: none;
  }
  
  /* Prevent text selection on the entire view */
  body, .card-view, .card-container {
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }
  
  /* Ensure touch events work as expected */
  .card-container {
    touch-action: manipulation;
  }
  
  /* Apply custom transition effect for card show/hide */
  .card-reveal-transition {
    transition: transform 0.2s ease-in-out, opacity 0.2s ease;
  }
`;

export default function PlayerPage() {
  const params = useParams();
  const { playerGuid } = params;
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastContentUpdate, setLastContentUpdate] = useState<Date | null>(null);
  const [showAllCards, setShowAllCards] = useState<boolean>(false);
  
  // Get player alias for the title if playerData exists
  const playerAlias = playerData?.player.playerAlias || 
    (playerGuid ? generatePokerPlayerAlias(playerGuid.toString()) : 'Player');
  const pageTitle = `${playerAlias} - DealMe 2`;
  
  // Update document title when player data changes
  useEffect(() => {
    document.title = pageTitle;
  }, [pageTitle]);
  
  // Handler for background press
  const handleBackgroundPress = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    // Only respond to presses on the container itself, not its children
    if (event.target === event.currentTarget) {
      setShowAllCards(true);
    }
  }, []);
  
  const handleBackgroundRelease = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    setShowAllCards(false);
  }, []);
  
  // Prevent iOS context menu on the background
  const preventContextMenu = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    event.preventDefault();
    return false;
  }, []);
  
  // Set up polling
  const { 
    data, 
    error: pollingError, 
    isLoading: pollingLoading,
    lastUpdated 
  } = usePolling(`/api/players/${playerGuid}`, {
    interval: 2000, // Poll every 5 seconds
    onData: (data) => {
      if (data.player) {
        // Only update state if something has actually changed to prevent flickering
        setLoading(false);
        
        // Check if we need to update the state
        if (!playerData) {
          // Initial data load
          setPlayerData({
            player: data.player,
            tableGuid: data.table.tableGuid,
            tableName: data.table.tableName,
            gamePhase: data.table.gamePhase,
            handId: data.table.handId,
          });
          setLastContentUpdate(new Date());
          return;
        }
        
        setPlayerData({
          player: data.player,
          tableGuid: data.table.tableGuid,
          tableName: data.table.tableName,
          gamePhase: data.table.gamePhase,
          handId: data.table.handId,
        });
        setLastContentUpdate(new Date());
      }
    },
    onError: (err) => {
      setError('Connection error. Retrying...');
    },
  });
  
  // Handle connection errors by setting a state but not showing an error message
  const [connectionError, setConnectionError] = useState<boolean>(false);
  
  // First load is handled by the usePolling hook
  useEffect(() => {
    if (pollingError) {
      // Instead of showing an error, just track the error state
      setConnectionError(true);
      console.error('Connection error:', pollingError);
    } else {
      setConnectionError(false);
    }
  }, [pollingError]);
  
  if (loading || pollingLoading) {
    // Silently load
  }
  
  // Only show critical errors that prevent the app from functioning
  if (error && !playerData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          Unable to load player data. Please try again.
        </div>
      </div>
    );
  }
  
  if (!playerData) {
    return <div className="container mx-auto px-4 py-8">Player not found</div>;
  }
  
  return (
    <>
      <div className="container mx-auto px-2 py-2 flex flex-col h-screen">
        {/* Add inline styles to prevent iOS contextual menus */}
        <style jsx global>{preventIosContextMenuStyles}</style>
      {/* Compact header with game info */}
      <div className="bg-white shadow-sm rounded-lg p-2 mb-2 flex justify-between items-center">
        <div className="flex flex-col">
          <h1 className="text-lg font-bold">Pocket Cards</h1>
          <div className="flex text-xs space-x-3 text-gray-600">
            <span><strong>Table:</strong> {playerData.tableName ? `${playerData.tableName} (${playerData.tableGuid.substring(0, 4)})` : playerData.tableGuid.substring(0, 4)}</span>
            <span><strong>Player:</strong> {playerData.player.playerAlias})</span>
            <span><strong>Phase:</strong> {playerData.gamePhase}</span>
            <span><strong>Hand ID:</strong> {playerData.handId.substring(0, 4)}...</span>
          </div>
        </div>
        <div className="self-start flex items-center">
          {connectionError ? (
            <span 
              className="inline-block rounded-full h-3 w-3 bg-red-500"
              title="Connection error - trying to reconnect"
            ></span>
          ) : lastContentUpdate ? (
            <span 
              className={`inline-block rounded-full h-3 w-3 ${
                new Date().getTime() - lastContentUpdate.getTime() < 12000 
                  ? 'bg-green-500' 
                  : 'bg-red-500'
              }`} 
              title={`Last updated: ${lastContentUpdate.toLocaleTimeString()}`}
            ></span>
          ) : (
            <span className="inline-block rounded-full h-3 w-3 bg-gray-400" title="Waiting for update"></span>
          )}
        </div>
      </div>
      
      {/* Cards - taking up most of the screen */}
      <div 
        className="flex-grow flex items-center justify-center p-2 md:p-4 card-view touch-none select-none relative"
        onMouseDown={handleBackgroundPress}
        onMouseUp={handleBackgroundRelease}
        onMouseLeave={handleBackgroundRelease}
        onTouchStart={handleBackgroundPress}
        onTouchEnd={handleBackgroundRelease}
        onTouchCancel={handleBackgroundRelease}
        onContextMenu={preventContextMenu}
      >
        {/* Background hint text (only shown when not in waiting state) */}
        {playerData.gamePhase !== 'Waiting' && playerData.player.pocketCards.length > 0 && (
          <div className={`absolute top-2 left-0 right-0 text-center text-xs text-gray-500 transition-opacity duration-300 ${showAllCards ? 'opacity-0' : 'opacity-60'}`}>
            Tap background to reveal all cards
          </div>
        )}
        {playerData.gamePhase === 'Waiting' ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-xl md:text-2xl">Waiting for dealer to start next hand...</p>
          </div>
        ) : (
          <div className="flex justify-center items-center gap-4 md:gap-6 lg:gap-8 max-w-6xl mx-auto card-container touch-none select-none">
            {playerData.player.pocketCards.map((card, index) => (
              <div key={index} className="flex-1 max-w-[45%] md:max-w-none card-container touch-none">
                {/* Different size for different devices */}
                <div className="hidden lg:block card-container touch-none">
                  <FlippableCard card={card} size="xl" isForceFlipped={showAllCards} />
                </div>
                <div className="block lg:hidden card-container touch-none">
                  <FlippableCard card={card} size="lg" isForceFlipped={showAllCards} />
                </div>
              </div>
            ))}
            {/* If no cards yet but not in waiting state, show empty slots */}
            {playerData.player.pocketCards.length === 0 && 
              Array.from({ length: 2 }).map((_, index) => (
                <div key={`empty-${index}`} className="flex-1 max-w-[45%] md:max-w-none">
                  {/* Different size for different devices */}
                  <div className="hidden lg:block">
                    <Card key={`empty-xl-${index}`} size="xl" />
                  </div>
                  <div className="block lg:hidden">
                    <Card key={`empty-lg-${index}`} size="lg" />
                  </div>
                </div>
              ))
            }
          </div>
        )}
      </div>
    </div>
    </>
  );
}
