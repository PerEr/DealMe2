"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Card from '@/components/Card';
import { useSSE } from '@/lib/useSSE';
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
  
  // Set up SSE connection
  const { data: sseData, isConnected } = useSSE(`/api/players/${playerGuid}/sse`, {
    onMessage: (data) => {
      if (data.player) {
        setPlayerData(data.player);
        setLoading(false);
      }
    },
    onError: (err) => {
      setError('Connection error. Trying to reconnect...');
    },
  });
  
  // Fetch initial player data
  useEffect(() => {
    const fetchPlayer = async () => {
      try {
        setLoading(true);
        
        const response = await fetch(`/api/players/${playerGuid}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch player data');
        }
        
        setPlayerData({
          player: data.player,
          tableGuid: data.table.tableGuid,
          gamePhase: data.table.gamePhase,
          handId: data.table.handId,
        });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPlayer();
  }, [playerGuid]);
  
  if (loading) {
    return <div className="container mx-auto px-4 py-8">Loading your cards...</div>;
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          {error}
        </div>
      </div>
    );
  }
  
  if (!playerData) {
    return <div className="container mx-auto px-4 py-8">Player not found</div>;
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Your Cards</h1>
        <div className="text-sm bg-blue-100 px-3 py-1 rounded-full">
          {isConnected ? (
            <span className="flex items-center">
              <span className="bg-green-500 rounded-full h-2 w-2 mr-2"></span>
              Connected
            </span>
          ) : (
            <span className="flex items-center">
              <span className="bg-red-500 rounded-full h-2 w-2 mr-2"></span>
              Disconnected
            </span>
          )}
        </div>
      </div>
      
      <div className="card mb-4">
        <h2 className="text-xl font-semibold mb-2">Game Info</h2>
        <p className="mb-1"><strong>Table:</strong> {playerData.tableGuid.substring(0, 8)}...</p>
        <p className="mb-1"><strong>Phase:</strong> {playerData.gamePhase}</p>
        <p className="mb-4"><strong>Hand ID:</strong> {playerData.handId.substring(0, 8)}...</p>
      </div>
      
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Your Pocket Cards</h2>
        <div className="flex justify-center gap-4">
          {playerData.player.pocketCards.map((card, index) => (
            <Card key={index} card={card} size="lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
