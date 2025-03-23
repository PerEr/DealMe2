"use client";

import { useState, useEffect } from 'react';
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
    <div className="container mx-auto px-2 py-2 flex flex-col h-screen">
      {/* Compact header with game info */}
      <div className="bg-white shadow-sm rounded-lg p-2 mb-2 flex justify-between items-center">
        <div className="flex flex-col">
          <h1 className="text-lg font-bold">Pocket Cards</h1>
          <div className="flex text-xs space-x-3 text-gray-600">
            <span><strong>Table:</strong> {playerData.tableName ? `${playerData.tableName} (${playerData.tableGuid.substring(0, 4)})` : playerData.tableGuid.substring(0, 4)}</span>
            <span><strong>Player:</strong> {playerData.player.playerAlias || generatePokerPlayerAlias(playerGuid.toString())} ({playerGuid?.substring(0, 4)})</span>
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
      <div className="flex-grow flex items-center justify-center p-2 md:p-4">
        {playerData.gamePhase === 'Waiting' ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-xl md:text-2xl">Waiting for dealer to start next hand...</p>
          </div>
        ) : (
          <div className="flex justify-center items-center gap-4 md:gap-6 lg:gap-8 max-w-6xl mx-auto">
            {playerData.player.pocketCards.map((card, index) => (
              <div key={index} className="transform hover:scale-105 transition-transform duration-200 flex-1 max-w-[45%] md:max-w-none">
                {/* Different size for different devices */}
                <div className="hidden lg:block">
                  <FlippableCard card={card} size="xl" />
                </div>
                <div className="block lg:hidden">
                  <FlippableCard card={card} size="lg" />
                </div>
              </div>
            ))}
            {/* If no cards yet but not in waiting state, show empty slots */}
            {playerData.player.pocketCards.length === 0 && 
              Array.from({ length: 2 }).map((_, index) => (
                <div key={`empty-${index}`} className="transform hover:scale-105 transition-transform duration-200 flex-1 max-w-[45%] md:max-w-none">
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
  );
}
