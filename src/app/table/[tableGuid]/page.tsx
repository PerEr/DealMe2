"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Card from '@/components/Card';
import DeckDisplay from '@/components/DeckDisplay';
import QRCode from '@/components/QRCode';
import ThemeToggle from '@/components/ThemeToggle';
import { Table, GamePhase } from '@/lib/types';
import { getTableJoinUrl } from '@/lib/ipUtils';
import { generateTableName } from '@/app/api/tables/tableNamer';
import { generatePokerPlayerAlias } from '@/app/api/tables/playerNamer';

// Helper function to get the appropriate button text based on game phase
function getButtonText(phase: GamePhase): string {
  switch (phase) {
    case 'Waiting':
      return 'Deal';
    case 'Pre-Flop':
      return 'Show Flop';
    case 'Flop':
      return 'Show Turn';
    case 'Turn':
      return 'Show River';
    case 'River':
      return 'Shuffle';
    default:
      return 'Advance Game';
  }
}

export default function TablePage() {
  const params = useParams();
  const { tableGuid } = params;
  const [table, setTable] = useState<Table | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdvancing, setIsAdvancing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [playerCount, setPlayerCount] = useState<number>(0);
  const [showDebug, setShowDebug] = useState<boolean>(false);
  const [lastKeyEvent, setLastKeyEvent] = useState<{code: string, key: string} | null>(null);
  
  // Get the table name for page title if table exists
  const tableName = table ? generateTableName(table.tableGuid) : 'Table';
  const pageTitle = `${tableName} - DealMe 2`;
  
  // Update document title when tableName changes
  useEffect(() => {
    if (table) {
      document.title = pageTitle;
    }
  }, [pageTitle, table]);
  
  // Define fetch function with useCallback before using it
  const fetchTable = useCallback(async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/tables/${tableGuid}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch table');
      }
      
      const newTable = data.table;
      
      // Check if player count has changed
      const hasNewPlayers = table && newTable.players.length !== table.players.length;
      
      setTable(newTable);
      setLastUpdated(new Date());
      
      // Always set player count on first load
      if (!table) {
        setPlayerCount(newTable.players.length);
      }
      // Update player count and trigger animation if changed
      else if (hasNewPlayers) {
        console.log(`Player count changed from ${playerCount} to ${newTable.players.length}`);
      }
      
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [tableGuid]);
  
  // Fetch initial table data
  useEffect(() => {
    fetchTable();

    // Set up polling to refresh table data every 5 seconds
    const pollingInterval = setInterval(() => {
      fetchTable();
    }, 5000);
    
    // Clean up interval on unmount
    return () => clearInterval(pollingInterval);
  }, [fetchTable]);
  
  // Handle key press for advancing game phase
  const handleKeyPress = useCallback(async (event: KeyboardEvent) => {
    // Always store the key event for debugging purposes
    setLastKeyEvent({
      code: event.code,
      key: event.key
    });
    
    // Toggle debug panel with Shift+D
    if (event.shiftKey && event.code === 'KeyD') {
      setShowDebug(prev => !prev);
      event.preventDefault();
      return;
    }
    
    // Support for Logitech presentation clicker and standard keys
    // Most presentation clickers send key events like PageDown, Right, or Space
    const supportedKeyCodes = [
      'Space',         // Spacebar
      'Enter',         // Enter key
      'PageDown',      // Page Down key (main "next" button on most clickers)
      'ArrowRight',    // Right arrow (common on clickers)
      'ArrowDown',     // Down arrow (sometimes used) 
      'KeyB',          // B key (used on some clickers for "black screen" but we repurpose it)
      'Period',        // Period key (sometimes used as "advance" on some clickers),
    ];
    
    // Shortcut key for new deal (Shift+N)
    if (event.shiftKey && event.code === 'KeyN' && table && !isAdvancing) {
      event.preventDefault();
      handleNewDeal();
      return;
    }
    
    // Log keypress events for debugging
    console.log(`Key pressed: ${event.code} (key: ${event.key})`);
    
    if (supportedKeyCodes.includes(event.code) && table && !isAdvancing) {
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
        
        // Update local table state immediately
        if (data.table) {
          setTable(data.table);
          setLastUpdated(new Date());
        }
        
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsAdvancing(false);
      }
    }
  }, [table, tableGuid, isAdvancing]);
  
  // Handle starting a new deal
  const handleNewDeal = async () => {
    if (!table || isAdvancing) return;
    
    setIsAdvancing(true);
    
    try {
      const response = await fetch(`/api/tables/${tableGuid}/newdeal`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to start new deal');
      }
      
      // Update local table state immediately
      if (data.table) {
        setTable(data.table);
        setLastUpdated(new Date());
      }
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsAdvancing(false);
    }
  };
  
  // Set up key listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);
  
  // Sync player count with table after animation delay
  useEffect(() => {
    if (table) {
      // After 3 seconds, update playerCount to match current table
      const timer = setTimeout(() => {
        setPlayerCount(table.players.length);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [table?.players.length]);
  
  // Generate join URL with proper IP address
  // useState to ensure URL is correctly set after client-side rendering
  const [joinUrl, setJoinUrl] = useState<string>('');
  
  // Update the join URL after component mounts (client-side only)
  useEffect(() => {
    setJoinUrl(getTableJoinUrl(tableGuid.toString()));
  }, [tableGuid]);
  
  // Handle manual refresh
  const handleRefresh = async () => {
    try {
      await fetchTable();
    } catch (err: any) {
      setError(err.message);
    }
  };
  
  // Handle kicking a player from the table
  const handleKickPlayer = async (playerGuid: string) => {
    if (!confirm("Are you sure you want to remove this player from the table?")) {
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await fetch(`/api/tables/${tableGuid}/${playerGuid}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove player');
      }
      
      // Update table with the response
      if (data.table) {
        setTable(data.table);
        setLastUpdated(new Date());
      }
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    // return <div className="container mx-auto px-4 py-8">Loading table...</div>;
  }
  
  // Handle connection errors by setting a state but not showing an error message
  const [connectionError, setConnectionError] = useState<boolean>(false);
  
  useEffect(() => {
    if (error) {
      // Track connection errors but don't show an error page
      setConnectionError(true);
      console.error('Connection error:', error);
    } else {
      setConnectionError(false);
    }
  }, [error]);
  
  // Only show critical errors that prevent the app from functioning
  if (error && !table) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          Unable to load table data.
          <button 
            onClick={handleRefresh} 
            className="ml-4 px-3 py-1 bg-white text-red-700 border border-red-500 rounded hover:bg-red-50"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  if (!table) {
    return <div className="container mx-auto px-4 py-8">Table not found</div>;
  }
  
  return (
    <>
      <div className="container mx-auto px-2 py-2">
        <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <Link href="/" className="mr-2 px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-sm hover:bg-gray-300 dark:hover:bg-gray-600 dark:text-gray-200">
            All Tables
          </Link>
          <h1 className="text-xl font-bold">
            {generateTableName(tableGuid.toString())} ({tableGuid.toString().substring(0, 4)}...)
          </h1>
        </div>
        <div className="flex items-center space-x-2">
          <ThemeToggle className="mr-2" />
          {connectionError ? (
            <span 
              className="inline-block rounded-full h-3 w-3 bg-red-500"
              title="Connection error - trying to reconnect"
            ></span>
          ) : lastUpdated ? (
            <span 
              className={`inline-block rounded-full h-3 w-3 ${
                new Date().getTime() - lastUpdated.getTime() < 12000 
                  ? 'bg-green-500' 
                  : 'bg-red-500'
              }`} 
              title={`Last updated: ${lastUpdated.toLocaleTimeString()}`}
            ></span>
          ) : (
            <span className="inline-block rounded-full h-3 w-3 bg-gray-400" title="Waiting for update"></span>
          )}
        </div>
      </div>
      
      {/* Community Cards - Full width prominent display */}
      <div className="mb-4">
        <div className="card p-2 md:p-4">
          <div className="flex justify-between items-start">
            <h2 className="text-xl font-semibold mb-2">Community Cards</h2>
            
            {/* Game phase information text */}
            <div className="text-right">
              {table.gamePhase === 'Waiting' ? (
                <div className="text-gray-500">
                  <p className="text-sm font-light">Waiting to start next hand...</p>
                  <p className="text-xs">Press the Deal button to begin</p>
                </div>
              ) : table.gamePhase === 'Pre-Flop' ? (
                <div>
                  <p className="text-sm font-light">Waiting for the flop...</p>
                  <p className="text-xs">Press the Show Flop button when ready</p>
                </div>
              ) : null}
            </div>
          </div>
          
          <div className="flex mt-4">
            {/* Deck display on the left */}
            <div className="w-1/4 flex items-center justify-center">
              <DeckDisplay cardsRemaining={table.deck.length} />
            </div>
            
            {/* Community cards area */}
            <div className="w-1/2">
              {/* Always show the cards/placeholders */}
              <div className="flex flex-wrap justify-center gap-2 md:gap-4 lg:gap-6 py-4 md:py-6">
                {/* Show actual community cards */}
                {table.communityCards.map((card, index) => (
                  <div key={index} className="transform hover:scale-105 transition-transform duration-200">
                    <Card card={card} size="lg" />
                  </div>
                ))}
                
                {/* Show placeholders for remaining community cards */}
                {Array.from({ length: 5 - table.communityCards.length }).map((_, index) => (
                  <div key={`placeholder-${index}`} className="transform hover:scale-105 transition-transform duration-200">
                    <Card size="lg" />
                  </div>
                ))}
              </div>
            </div>
            
            {/* Right spacing to balance the layout */}
            <div className="w-1/4"></div>
          </div>
        </div>
      </div>
      
      {/* Game controls and info - 3 column layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {/* Game Info Panel */}
        <div className="card p-2 md:p-3">
          <h2 className="text-lg font-semibold mb-2">Game Info</h2>
          <p className="mb-1 text-sm"><strong>Phase:</strong> {table.gamePhase}</p>
          <p className="mb-1 text-sm"><strong>Hand ID:</strong> {table.handId.substring(0, 4)}...</p>
          <p className="mb-1 text-sm"><strong>Players:</strong> {table.players.length}/{table.maxPlayers}</p>
          {table.players.length > 0 && (
            <p className="mb-1 text-sm">
              <strong>Big Blind:</strong> {table.bigBlindPosition + 1} - {table.players[table.bigBlindPosition] ? generatePokerPlayerAlias(table.players[table.bigBlindPosition].playerGuid) : "N/A"}
            </p>
          )}
          <div className="flex space-x-2 mt-2">
            <button 
              onClick={() => handleKeyPress({ code: 'Space', preventDefault: () => {} } as KeyboardEvent)} 
              disabled={isAdvancing}
              className="btn text-sm py-1"
            >
              {isAdvancing ? 'Advancing...' : getButtonText(table.gamePhase)}
            </button>
            <button 
              onClick={handleNewDeal}
              disabled={isAdvancing}
              className="btn-secondary text-sm py-1 bg-blue-100 hover:bg-blue-200 text-blue-800"
              title="Reset the game and immediately deal new cards"
            >
              New Deal
            </button>
            <button 
              onClick={handleRefresh} 
              className="btn-secondary text-sm py-1"
              disabled={isAdvancing}
            >
              Refresh
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Press Space, Enter, or use a presentation clicker to advance
            <br />Press Shift+N for a new deal
          </p>
        </div>
        
        {/* Join Table Panel */}
        <div className="card p-2 md:p-3">
          <div className="flex justify-center mb-2">
            <QRCode url={joinUrl} size={150} />
          </div>
          <div className="bg-gray-100 dark:bg-gray-700 p-1 rounded text-xs break-all text-center dark:text-gray-200">
            {joinUrl}
          </div>
        </div>
        
        {/* Player List Panel */}
        <div className="card p-2 md:p-3">
          <h2 className="text-lg font-semibold mb-2">
            Players 
            <span className="ml-2 text-xs text-gray-500">
              ({table.players.length}/{table.maxPlayers})
            </span>
            {playerCount !== table.players.length && (
              <span className="ml-1 text-xs bg-yellow-100 px-1 rounded-full animate-pulse">
                Updated
              </span>
            )}
          </h2>
          
          {table.players.length === 0 ? (
            <p className="text-sm">No players seated yet</p>
          ) : (
            <div className="divide-y max-h-40 overflow-y-auto text-sm">
              {table.players.map((player, index) => {
                // Check if this is a new player (added since last render)
                const isNewPlayer = index >= playerCount;
                // Check if this player has the big blind
                const hasBigBlind = index === table.bigBlindPosition;
                
                return (
                  <div 
                    key={player.playerGuid} 
                    className={`py-1 flex justify-between items-center ${isNewPlayer ? 'bg-yellow-50 animate-pulse' : ''}`}
                  >
                    <p className="flex items-center">
                      {hasBigBlind && (
                        <span 
                          className="mr-1 inline-flex items-center justify-center w-5 h-5 bg-indigo-600 text-white rounded-full font-bold text-xs"
                          title="Big Blind"
                        >
                          BB
                        </span>
                      )}
                      P{index+1}: {generatePokerPlayerAlias(player.playerGuid)} ({player.playerGuid.substring(0, 4)})
                      {isNewPlayer && (
                        <span className="ml-1 text-xs text-green-600 font-semibold">
                          New
                        </span>
                      )}
                    </p>
                    <button
                      onClick={() => handleKickPlayer(player.playerGuid)}
                      className="text-xs px-2 py-0.5 bg-red-100 hover:bg-red-200 text-red-700 rounded"
                      title="Remove player from table"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      
      {/* Debug Panel - Toggle with Shift+D */}
      {showDebug && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-800 text-white p-3 text-sm z-50">
          <div className="container mx-auto">
            <div className="flex justify-between items-center">
              <h3 className="font-bold">Presentation Clicker Debug</h3>
              <button 
                onClick={() => setShowDebug(false)}
                className="px-2 py-1 bg-gray-700 rounded hover:bg-gray-600"
              >
                Close
              </button>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-gray-300">Last Key Event:</h4>
                {lastKeyEvent ? (
                  <pre className="bg-gray-700 p-2 rounded mt-1 overflow-x-auto">
                    code: {lastKeyEvent.code}<br />
                    key: {lastKeyEvent.key}
                  </pre>
                ) : (
                  <p className="text-gray-400">No key events detected yet. Press any key.</p>
                )}
              </div>
              <div>
                <h4 className="font-semibold text-gray-300">Supported Keys:</h4>
                <ul className="list-disc list-inside text-xs space-y-1 mt-1">
                  <li>Space / Enter - Advance game phase</li>
                  <li>PageDown / Right Arrow - Advance game phase</li>
                  <li>Down Arrow - Advance game phase</li>
                  <li>B key - Advance game phase</li>
                  <li>Period (.) - Advance game phase</li>
                  <li>Shift+N - Start new deal</li>
                  <li><strong className="text-yellow-300">Not seeing your clicker?</strong> Press its buttons while this panel is open to see what key codes it sends</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
