"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Card from '@/components/Card';
import { usePolling } from '@/lib/usePolling';
import { Player as PlayerType } from '@/lib/types';

interface PlayerData {
  player: PlayerType;
  tableGuid: string;
  gamePhase: string;
  handId: string;
}

export default function PlayerPage() {
  const params = useParams();
  const { playerGuid } = params;
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastContentUpdate, setLastContentUpdate] = useState<Date | null>(null);
  
  // Set up polling
  const { 
    data, 
    error: pollingError, 
    isLoading: pollingLoading,
    lastUpdated 
  } = usePolling(`/api/players/${playerGuid}`, {
    interval: 5000, // Poll every 5 seconds
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
            gamePhase: data.table.gamePhase,
            handId: data.table.handId,
          });
          setLastContentUpdate(new Date());
          return;
        }
        
        setPlayerData({
          player: data.player,
          tableGuid: data.table.tableGuid,
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
    <div className="container mx-auto px-2 py-2 flex flex-col h-screen">
      {/* Compact header with game info */}
      <div className="bg-white shadow-sm rounded-lg p-2 mb-2 flex justify-between items-center">
        <div className="flex flex-col">
          <h1 className="text-lg font-bold">Your Cards</h1>
          <div className="flex text-xs space-x-3 text-gray-600">
            <span><strong>Table:</strong> {playerData.tableGuid.substring(0, 4)}...</span>
            <span><strong>Phase:</strong> {playerData.gamePhase}</span>
            <span><strong>ID:</strong> {playerData.handId.substring(0, 4)}...</span>
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
      <div className="flex-grow flex items-center justify-center p-2 md:p-4">
        {playerData.gamePhase === 'Waiting' ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-xl md:text-2xl">Waiting for dealer to start next hand...</p>
          </div>
        ) : (
          <>
          <div className="text-center mb-4 text-gray-500">
            <p className="text-sm md:text-base">Click and hold to see your cards</p>
          </div>
          <div className="flex justify-center items-center gap-4 md:gap-6 lg:gap-8 max-w-6xl mx-auto">
            {/* Track if cards are being shown (peek mode) */}
            {(() => {
              const [showCards, setShowCards] = useState(false);

              // Handle mouse/touch events
              const handlePeekStart = () => setShowCards(true);
              const handlePeekEnd = () => setShowCards(false);
              
              return playerData.player.pocketCards.map((card, index) => (
                <div 
                  key={index} 
                  className="transform transition-transform duration-200 flex-1 max-w-[45%] md:max-w-none cursor-pointer perspective-500"
                  onMouseDown={handlePeekStart}
                  onMouseUp={handlePeekEnd}
                  onMouseLeave={handlePeekEnd}
                  onTouchStart={handlePeekStart}
                  onTouchEnd={handlePeekEnd}
                  onTouchCancel={handlePeekEnd}
                >
                  {/* Different size for different devices with card flip animation */}
                  <div className="hidden lg:block relative preserve-3d transition-transform duration-300" 
                    style={{ transform: showCards ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
                    <div className="absolute w-full h-full backface-hidden">
                      <Card card={undefined} hidden={true} size="xl" />
                    </div>
                    <div className="absolute w-full h-full backface-hidden" style={{ transform: 'rotateY(180deg)' }}>
                      <Card card={card} size="xl" />
                    </div>
                  </div>
                  <div className="block lg:hidden relative preserve-3d transition-transform duration-300" 
                    style={{ transform: showCards ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
                    <div className="absolute w-full h-full backface-hidden">
                      <Card card={undefined} hidden={true} size="lg" />
                    </div>
                    <div className="absolute w-full h-full backface-hidden" style={{ transform: 'rotateY(180deg)' }}>
                      <Card card={card} size="lg" />
                    </div>
                  </div>
                </div>
              ));
            })()}
            {/* If no cards yet but not in waiting state, show back-side (empty) cards */}
            {playerData.player.pocketCards.length === 0 && 
              (() => {
                // Use same peek mechanic for empty slots
                const [showCards, setShowCards] = useState(false);
                const handlePeekStart = () => setShowCards(true);
                const handlePeekEnd = () => setShowCards(false);
                
                return Array.from({ length: 2 }).map((_, index) => (
                  <div 
                    key={`empty-${index}`} 
                    className="transform transition-transform duration-200 flex-1 max-w-[45%] md:max-w-none cursor-pointer perspective-500"
                    onMouseDown={handlePeekStart}
                    onMouseUp={handlePeekEnd}
                    onMouseLeave={handlePeekEnd}
                    onTouchStart={handlePeekStart}
                    onTouchEnd={handlePeekEnd}
                    onTouchCancel={handlePeekEnd}
                  >
                    {/* Show flipping card backs */}
                    <div className="hidden lg:block">
                      <Card card={undefined} hidden={true} size="xl" />
                    </div>
                    <div className="block lg:hidden">
                      <Card card={undefined} hidden={true} size="lg" />
                    </div>
                  </div>
                ));
              })()
            }
          </div>
          </>
        )}
      </div>
    </div>
  );
}
