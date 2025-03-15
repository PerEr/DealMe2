"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Card from '@/components/Card';
import QRCode from '@/components/QRCode';
import { useSSE } from '@/lib/useSSE';
import { Table, GamePhase } from '@/lib/types';

export default function TablePage() {
  const params = useParams();
  const { tableGuid } = params;
  const [table, setTable] = useState<Table | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdvancing, setIsAdvancing] = useState<boolean>(false);
  
  // Handle key press for advancing game phase
  const handleKeyPress = useCallback(async (event: KeyboardEvent) => {
    if ((event.code === 'Space' || event.code === 'Enter') && table && !isAdvancing) {
      event.preventDefault();
      setIsAdvancing(true);
      
      try {
        const response = await fetch(`/api/tables/${tableGuid}`, {
          method: 'POST',
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to advance game phase');
        }
        
        // Table will be updated via SSE
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsAdvancing(false);
      }
    }
  }, [table, tableGuid, isAdvancing]);
  
  // Set up SSE connection
  const { data: sseData, isConnected } = useSSE(`/api/tables/${tableGuid}/sse`, {
    onMessage: (data) => {
      if (data.table) {
        setTable(data.table);
        setLoading(false);
      }
    },
    onError: (err) => {
      setError('Connection error. Trying to reconnect...');
    },
  });
  
  // Fetch initial table data
  useEffect(() => {
    const fetchTable = async () => {
      try {
        setLoading(true);
        
        const response = await fetch(`/api/tables/${tableGuid}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch table');
        }
        
        setTable(data.table);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTable();
  }, [tableGuid]);
  
  // Set up key listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);
  
  // Generate join URL and QR code URL
  const joinUrl = `${window.location.origin}/table/${tableGuid}/sitdown`;
  
  if (loading) {
    return <div className="container mx-auto px-4 py-8">Loading table...</div>;
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
  
  if (!table) {
    return <div className="container mx-auto px-4 py-8">Table not found</div>;
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          Table: {tableGuid.toString().substring(0, 8)}...
        </h1>
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div>
          <div className="card mb-4">
            <h2 className="text-xl font-semibold mb-4">Game Info</h2>
            <p className="mb-2"><strong>Phase:</strong> {table.gamePhase}</p>
            <p className="mb-2"><strong>Hand ID:</strong> {table.handId.substring(0, 8)}...</p>
            <p className="mb-2"><strong>Players:</strong> {table.players.length}/{table.maxPlayers}</p>
            <button 
              onClick={() => handleKeyPress({ code: 'Space', preventDefault: () => {} } as KeyboardEvent)} 
              disabled={isAdvancing}
              className="btn mt-4"
            >
              {isAdvancing ? 'Advancing...' : 'Advance Game'}
            </button>
            <p className="text-sm text-gray-500 mt-2">
              Press Space or Enter to advance the game phase
            </p>
          </div>
          
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Join Table</h2>
            <p className="mb-4">Scan this QR code or share the link to join the table:</p>
            <div className="flex justify-center mb-4">
              <QRCode url={joinUrl} size={150} />
            </div>
            <div className="bg-gray-100 p-2 rounded text-sm break-all">
              {joinUrl}
            </div>
          </div>
        </div>
        
        <div>
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Community Cards</h2>
            
            {table.gamePhase === 'Pre-Flop' ? (
              <div className="text-center py-8">
                <p>Waiting for the flop...</p>
              </div>
            ) : (
              <div className="flex flex-wrap justify-center gap-2">
                {table.communityCards.map((card, index) => (
                  <Card key={index} card={card} size="lg" />
                ))}
                
                {/* Show placeholders for remaining community cards */}
                {Array.from({ length: 5 - table.communityCards.length }).map((_, index) => (
                  <div key={`placeholder-${index}`} className="w-20 h-30 border-2 border-dashed border-gray-300 rounded-lg"></div>
                ))}
              </div>
            )}
          </div>
          
          <div className="card mt-4">
            <h2 className="text-xl font-semibold mb-4">Players</h2>
            
            {table.players.length === 0 ? (
              <p>No players seated yet</p>
            ) : (
              <div className="divide-y">
                {table.players.map(player => (
                  <div key={player.playerGuid} className="py-3">
                    <p className="mb-2">Player: {player.playerGuid.substring(0, 8)}...</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
