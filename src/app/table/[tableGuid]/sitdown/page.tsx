"use client";

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function SitDownPage() {
  const params = useParams();
  const { tableGuid } = params;
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const joinRequestSent = useRef<boolean>(false);
  
  // Join the table automatically when the page loads
  useEffect(() => {
    const joinTable = async () => {
      // Prevent duplicate requests
      if (joinRequestSent.current) {
        return;
      }
      
      joinRequestSent.current = true;
      
      try {
        console.log(`Sending sit-down request for table ${tableGuid}`);
        
        const response = await fetch(`/api/tables/${tableGuid}/sitdown`, {
          method: 'POST',
          // Prevent caching to ensure a fresh request
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to join table');
        }
        
        console.log(`Successfully joined table, redirecting to ${data.redirect}`);
        
        // Redirect to the player page
        router.push(data.redirect);
        
        // Additional protection - wait a bit before allowing another request
        setTimeout(() => {
          joinRequestSent.current = false;
        }, 5000);
      } catch (err: any) {
        console.error('Error joining table:', err);
        setError(err.message);
        setLoading(false);
        
        // Allow retrying after an error
        setTimeout(() => {
          joinRequestSent.current = false;
        }, 2000);
      }
    };
    
    joinTable();
    
    // Cleanup function to prevent memory leaks
    return () => {
      joinRequestSent.current = true; // Prevent further requests during unmount
    };
  }, [tableGuid, router]);
  
  const handleRetry = () => {
    joinRequestSent.current = false;
    setError(null);
    setLoading(true);
  };
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Joining Table</h1>
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          {error}
        </div>
        <div className="flex space-x-4">
          <button 
            onClick={handleRetry}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
          <button 
            onClick={() => router.push(`/table/${tableGuid}`)}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Return to Table
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8 text-center">
      <h1 className="text-2xl font-bold mb-4">Joining Table</h1>
      <div className="animate-pulse flex flex-col items-center">
        <div className="bg-blue-100 rounded-full h-24 w-24 flex items-center justify-center mb-4">
          <svg className="w-12 h-12 text-blue-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
        </div>
        <p className="text-lg">Joining the table...</p>
      </div>
    </div>
  );
}
