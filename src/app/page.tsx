"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { generateTableName } from '@/app/api/tables/tableNamer';
import ThemeToggle from '@/components/ThemeToggle';

interface TableInfo {
  tableGuid: string;
  playerCount: number;
  maxPlayers: number;
  gamePhase: string;
}

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="mb-6">{message}</p>
        <div className="flex justify-end space-x-3">
          <button 
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);
  const [tableToDelete, setTableToDelete] = useState<string | null>(null);
  const router = useRouter();
  
  // Update page title
  useEffect(() => {
    document.title = 'DealMe 2';
  }, []);
  
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
  
  // Handle table deletion confirmation
  const confirmDeleteTable = (tableGuid: string) => {
    setTableToDelete(tableGuid);
    setDeleteConfirmOpen(true);
  };
  
  // Cancel delete
  const cancelDelete = () => {
    setDeleteConfirmOpen(false);
    setTableToDelete(null);
  };
  
  // Delete the table
  const handleDeleteTable = async () => {
    if (!tableToDelete) return;
    
    try {
      setLoading(true);
      
      const response = await fetch(`/api/tables/${tableToDelete}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete table');
      }
      
      // Remove the deleted table from the state
      setTables(prevTables => prevTables.filter(table => table.tableGuid !== tableToDelete));
      setDeleteConfirmOpen(false);
      setTableToDelete(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">DealMe 2</h1>
        <ThemeToggle />
      </div>
      
      {error && (
        <div className="bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500 text-red-700 dark:text-red-400 p-4 mb-6">
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
              <div className="flex space-x-2">
                <Link href={`/table/${table.tableGuid}`} className="btn flex-grow text-center">
                  Join Table
                </Link>
                <button 
                  onClick={() => confirmDeleteTable(table.tableGuid)} 
                  className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-800/50"
                  aria-label="Delete table"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Confirmation Modal */}
      <ConfirmModal 
        isOpen={deleteConfirmOpen}
        title="Delete Table"
        message={tableToDelete ? `Are you sure you want to delete ${generateTableName(tableToDelete)}? This action cannot be undone.` : "Are you sure you want to delete this table?"}
        onConfirm={handleDeleteTable}
        onCancel={cancelDelete}
      />
    </div>
  );
}
