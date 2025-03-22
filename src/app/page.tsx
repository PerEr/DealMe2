"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { generateTableName } from '@/app/api/tables/tableNamer';

interface TableInfo {
  tableGuid: string;
  playerCount: number;
  maxPlayers: number;
  gamePhase: string;
}

export default function Home() {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  // Fetch tables on component mount
  useEffect(() => {
    const fetchTables = async () => {
      try {
        const response = await fetch('/api/tables');
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch tables');
        }
        
        setTables(data.tables || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTables();
  }, []);
  
  // Create a new table
  const handleCreateTable = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/tables', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create table');
      }
      
      // Redirect to the table page
      router.push(data.redirect);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Digital Poker App</h1>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          {error}
        </div>
      )}
      
      <div className="mb-8">
        <button 
          onClick={handleCreateTable} 
          disabled={loading}
          className="btn"
        >
          {loading ? 'Creating...' : 'Create New Table'}
        </button>
      </div>
      
      <h2 className="text-xl font-semibold mb-4">Active Tables</h2>
      
      {loading ? (
        <p>Loading tables...</p>
      ) : tables.length === 0 ? (
        <p>No active tables. Create one to get started!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tables.map(table => (
            <div key={table.tableGuid} className="card">
              <h3 className="text-lg font-semibold mb-2">{generateTableName(table.tableGuid)} ({table.tableGuid.substring(0, 4)}...)</h3>
              <p className="mb-1">Players: {table.playerCount}/{table.maxPlayers}</p>
              <p className="mb-4">Phase: {table.gamePhase}</p>
              <Link href={`/table/${table.tableGuid}`} className="btn block text-center">
                Join Table
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
