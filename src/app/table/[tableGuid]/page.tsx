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
  const [showEndHandModal, setShowEndHandModal] = useState<boolean>(false);
  // Debug panel removed
  
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
    const pollingInterval = setInterval(fetchTable, 5000);
    
    // Clean up interval on unmount
    return () => clearInterval(pollingInterval);
  }, [fetchTable]);
  
  // Handle key press for advancing game phase
  const handleKeyPress = useCallback(async (event: KeyboardEvent) => {
    // Debug panel code removed
    
    // Support for Logitech presentation clicker and standard keys
    // Most presentation clickers send key events like PageDown, Right, or Space
    const supportedKeyCodes = [
      'Space',         // Spacebar
      'Enter',         // Enter key
      'PageDown',      // Page Down key (main "next" button on most clickers)
      'ArrowRight',    // Right arrow (common on clickers)
      'ArrowDown',     // Down arrow (sometimes used) 
      'KeyB',          // B key (used on some clickers for "black screen" but we repurpose it)
      'Period',        // Period key (sometimes used as "advance" on some clickers)
    ];
    
    // Second clicker button keycodes (typically the "back" or "previous" button)
    const cancelHandKeyCodes = [
      'Escape',        // Escape key
      'PageUp',        // Page Up key (common "back" button on most clickers)
      'ArrowLeft',     // Left arrow (common on clickers)
    ];
    
    // Check if ESC key or second clicker button was pressed to trigger End Hand functionality
    if (cancelHandKeyCodes.includes(event.code) && table && table.gamePhase !== 'Waiting') {
      event.preventDefault();
      handleEndHand();
      return;
    }
    
    // Debug logging removed
    
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
  
  // Handle key presses specifically for the modal
  const handleModalKeyPress = useCallback((event: KeyboardEvent) => {
    if (!showEndHandModal) return;
    
    // Prevent these keys from triggering the main handler
    event.preventDefault();
    event.stopPropagation();
    
    // Use arrow keys for modal navigation
    if (event.code === 'ArrowRight' || event.code === 'Enter' || event.code === 'Space') {
      confirmEndHand();
    } else if (event.code === 'ArrowLeft' || event.code === 'Escape') {
      setShowEndHandModal(false);
    }
  }, [showEndHandModal]);
  
  // Set up key listeners - modal handler takes precedence over main handler
  useEffect(() => {
    // Modal key handler is registered first to take precedence
    if (showEndHandModal) {
      window.addEventListener('keydown', handleModalKeyPress);
    }
    
    // Only register main key handler when modal is not showing
    if (!showEndHandModal) {
      window.addEventListener('keydown', handleKeyPress);
    }
    
    return () => {
      window.removeEventListener('keydown', handleModalKeyPress);
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress, handleModalKeyPress, showEndHandModal]);
  
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
  
  // Handle ending the current hand early
  const handleEndHand = async () => {
    // Show the modal instead of using confirm
    setShowEndHandModal(true);
  };

  // Actual function to reset the hand after confirmation
  const confirmEndHand = async () => {
    try {
      setIsAdvancing(true);
      setShowEndHandModal(false);
      
      const response = await fetch(`/api/tables/${tableGuid}/reset`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to end the hand');
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
  
  // Loading state is handled by showing the existing UI with loading indicators
  
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
      <div className="flex flex-col h-[95vh] max-h-screen overflow-hidden">
        {/* Header Bar - Minimized */}
        <div className="px-2 py-0.5 border-b dark:border-gray-700 shrink-0 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link href="/" className="mr-1 px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-sm hover:bg-gray-300 dark:hover:bg-gray-600 dark:text-gray-200">
                All Tables
              </Link>
              <h1 className="text-lg font-bold">
                {generateTableName(tableGuid.toString())} ({tableGuid.toString().substring(0, 4)}...)
              </h1>
            </div>
            <div className="flex items-center space-x-1">
              <ThemeToggle className="mr-1" />
              {connectionError ? (
                <span 
                  className="inline-block rounded-full h-2 w-2 bg-red-500"
                  title="Connection error - trying to reconnect"
                ></span>
              ) : lastUpdated ? (
                <span 
                  className={`inline-block rounded-full h-2 w-2 ${
                    new Date().getTime() - lastUpdated.getTime() < 12000 
                      ? 'bg-green-500' 
                      : 'bg-red-500'
                  }`} 
                  title={`Last updated: ${lastUpdated.toLocaleTimeString()}`}
                ></span>
              ) : (
                <span className="inline-block rounded-full h-2 w-2 bg-gray-400" title="Waiting for update"></span>
              )}
            </div>
          </div>
        </div>
        
        {/* Cards Section - Adjusted for better visibility */}
        <div className="h-[60%] px-1 pt-4">
          <div className="card p-6 h-full flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start mb-1 shrink-0">
              <h2 className="text-xl sm:text-2xl font-semibold">Community Cards</h2>
              
              {/* Game phase information text - fixed height to prevent layout shift */}
              <div className="text-right text-sm sm:text-base h-14">
                {table.gamePhase === 'Waiting' ? (
                  <div className="text-gray-500">
                    <p className="font-medium">Waiting to start next hand...</p>
                    <p className="text-sm">Press Deal button to begin</p>
                  </div>
                ) : table.gamePhase === 'Pre-Flop' ? (
                  <div>
                    <p className="font-medium">Waiting for the flop...</p>
                    <p className="text-sm">Press Show Flop button when ready</p>
                  </div>
                ) : (
                  <div className="opacity-0">
                    <p className="font-medium">Placeholder</p>
                    <p className="text-sm">Placeholder</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Card display area - maximize space */}
            <div className="flex-1 flex items-center justify-center">
              <div className="flex w-full items-center justify-center">
                {/* Card grid with equal sizing and special gap after deck */}
                <div className="grid w-full" style={{ 
                  gridTemplateColumns: "1fr 0.2fr 1fr 1fr 1fr 1fr 1fr",
                  gap: "0.5rem"
                }}>
                  {/* Deck display - takes first column */}
                  <div className="flex items-center justify-center">
                    <DeckDisplay 
                      cardsRemaining={table.deck.length} 
                      onClick={() => handleKeyPress({ code: 'Space', preventDefault: () => {} } as KeyboardEvent)}
                      isClickable={!isAdvancing}
                      size="auto"
                    />
                  </div>
                  
                  {/* Empty column for spacing */}
                  <div></div>
                  
                  {/* Community cards - each take one column */}
                  {table.communityCards.map((card, index) => (
                    <div key={index}>
                      <Card card={card} size="auto" />
                    </div>
                  ))}
                  
                  {/* Placeholders for remaining community cards */}
                  {Array.from({ length: 5 - table.communityCards.length }).map((_, index) => (
                    <div key={`placeholder-${index}`}>
                      <Card size="auto" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Game Info and Players Section - Adjusted height */}
        <div className="h-[10%] px-1 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
            {/* Game Info Panel */}
            <div className="card p-1 h-full flex flex-col">
              <h2 className="text-xl sm:text-2xl font-semibold mb-2">Game Info</h2>
              <div className="text-base sm:text-lg flex-grow overflow-auto">
                <div className="mb-1"><strong>Phase:</strong> {table.gamePhase}</div>
                <div className="mb-1"><strong>Hand:</strong> {`#${table.handNumber}`}</div>
                <div className="mb-1"><strong>Players:</strong> {table.players.length}/{table.maxPlayers}</div>
                
                {table.players.length > 0 && (
                  <div className="space-y-1 mt-2">
                    <p>
                      <strong>Dealer:</strong> {table.players[table.dealerPosition] ? generatePokerPlayerAlias(table.players[table.dealerPosition].playerGuid) : "N/A"}
                    </p>
                    <p>
                      <strong>Big Blind:</strong> {table.players[table.bigBlindPosition] ? generatePokerPlayerAlias(table.players[table.bigBlindPosition].playerGuid) : "N/A"}
                    </p>
                    {table.players.length > 1 && (
                      <p>
                        <strong>Small Blind:</strong> {table.players[table.smallBlindPosition] ? generatePokerPlayerAlias(table.players[table.smallBlindPosition].playerGuid) : "N/A"}
                      </p>
                    )}
                  </div>
                )}
              </div>
              
              <div className="mt-auto">
                <div className="flex justify-between items-center">
                  <div>
                    <button 
                      onClick={() => handleKeyPress({ code: 'Space', preventDefault: () => {} } as KeyboardEvent)} 
                      disabled={isAdvancing}
                      className="btn text-base sm:text-lg py-1 px-3"
                    >
                      {isAdvancing ? 'Advancing...' : getButtonText(table.gamePhase)}
                    </button>
                    <p className="text-sm text-gray-500 mt-1">
                      Press Space/Enter to advance
                    </p>
                  </div>
                  {table.gamePhase !== 'Waiting' && (
                    <button 
                      onClick={handleEndHand} 
                      className="bg-red-600 hover:bg-red-700 text-white font-semibold rounded py-1 px-3 text-sm"
                      disabled={isAdvancing}
                      title="End current hand and return to waiting state (ESC or second clicker button)"
                    >
                      End Hand (ESC/←)
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            {/* Join Table Panel */}
            <div className="card p-1 h-full flex flex-col justify-center items-center">
              <div className="flex justify-center mb-1">
                <QRCode url={joinUrl} size={200} className="w-[180px] sm:w-[200px] md:w-[220px] lg:w-[250px]" />
              </div>
              <div className="bg-gray-100 dark:bg-gray-700 p-1 rounded text-xs break-all text-center dark:text-gray-200 w-full">
                {joinUrl}
              </div>
            </div>
            
            {/* Player List Panel */}
            <div className="card p-1 h-full flex flex-col">
              <h2 className="text-xl sm:text-2xl font-semibold mb-2">
                Players 
                <span className="ml-2 text-sm sm:text-base text-gray-500">
                  ({table.players.filter(p => !p.markedForRemoval).length}/{table.maxPlayers})
                </span>
                {playerCount !== table.players.length && (
                  <span className="ml-2 text-sm bg-yellow-100 px-2 py-0.5 rounded-full animate-pulse">
                    Updated
                  </span>
                )}
                {table.players.some(p => p.markedForRemoval) && table.gamePhase !== 'Waiting' && (
                  <span className="ml-2 text-sm bg-red-100 dark:bg-red-900 px-2 py-0.5 rounded-full">
                    {table.players.filter(p => p.markedForRemoval).length} leaving
                  </span>
                )}
              </h2>
              
              {table.players.length === 0 ? (
                <p className="text-base sm:text-lg">No players seated yet</p>
              ) : (
                <div className="divide-y text-base sm:text-lg overflow-y-auto flex-1">
                  {table.players.map((player, index) => {
                    // Check if this is a new player (added since last render)
                    const isNewPlayer = index >= playerCount;
                    // Check if this player has the big blind
                    const hasBigBlind = index === table.bigBlindPosition;
                    // Check if player is marked for removal
                    const isMarkedForRemoval = player.markedForRemoval === true;
                    
                    return (
                      <div 
                        key={player.playerGuid} 
                        className={`py-1 flex justify-between items-center 
                          ${isNewPlayer ? 'bg-yellow-50 animate-pulse' : ''} 
                          ${isMarkedForRemoval ? 'bg-red-50 dark:bg-red-900/30 opacity-60' : ''}`}
                      >
                        <div className={`flex items-center ${isMarkedForRemoval ? 'line-through text-gray-500 dark:text-gray-400' : ''}`}>
                          {/* Fixed-width container for position symbols (space for max 2 symbols) */}
                          <div className="flex items-center w-14 mr-2">
                            {index === table.dealerPosition && (
                              <span 
                                className="mr-1 inline-flex items-center justify-center w-6 h-6 bg-white dark:bg-gray-800 text-black dark:text-white border border-black dark:border-white rounded-full font-bold text-sm"
                                title="Dealer Button"
                              >
                                D
                              </span>
                            )}
                            {hasBigBlind && (
                              <span 
                                className="mr-1 inline-flex items-center justify-center w-6 h-6 bg-indigo-600 text-white rounded-full font-bold text-sm"
                                title="Big Blind"
                              >
                                BB
                              </span>
                            )}
                            {index === table.smallBlindPosition && (
                              <span 
                                className="mr-1 inline-flex items-center justify-center w-6 h-6 bg-blue-500 text-white rounded-full font-bold text-sm"
                                title="Small Blind"
                              >
                                SB
                              </span>
                            )}
                          </div>
                          <span>
                            {generatePokerPlayerAlias(player.playerGuid)} ({player.playerGuid.substring(0, 4)})
                            {isNewPlayer && (
                              <span className="ml-2 text-sm text-green-600 font-semibold">
                                New
                              </span>
                            )}
                            {isMarkedForRemoval && (
                              <span className="ml-2 text-sm text-red-600 font-semibold">
                                Leaving
                              </span>
                            )}
                          </span>
                        </div>
                        <button
                          onClick={() => handleKickPlayer(player.playerGuid)}
                          className={`text-sm px-2 py-1 rounded
                            ${isMarkedForRemoval 
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-red-100 hover:bg-red-200 text-red-700'}`}
                          title={isMarkedForRemoval ? "Player already marked for removal" : "Remove player from table"}
                          disabled={isMarkedForRemoval}
                        >
                          {isMarkedForRemoval ? '✓' : '✕'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* End Hand Confirmation Modal */}
      {showEndHandModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-xl font-bold mb-4 dark:text-white">End Current Hand?</h3>
            <p className="mb-6 dark:text-gray-300">
              Are you sure you want to end the current hand and return to waiting state?
            </p>
            <div className="flex justify-between items-center">
              <div>
                <button 
                  onClick={() => setShowEndHandModal(false)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded mr-2 hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center"
                >
                  <span className="mr-2">←</span> Cancel
                </button>
              </div>
              <div>
                <button 
                  onClick={confirmEndHand}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center"
                >
                  Confirm <span className="ml-2">→</span>
                </button>
              </div>
            </div>
            <p className="text-xs text-center mt-4 text-gray-500">
              Use arrow keys: <span className="font-medium">← Left arrow to cancel</span>, <span className="font-medium">→ Right arrow to confirm</span>
            </p>
          </div>
        </div>
      )}
      
      {/* Debug panel removed */}
    </>
  );
}
