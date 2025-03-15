"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function SitDownPage() {
  const params = useParams();
  const { tableGuid } = params;
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Join the table automatically when the page loads
  useEffect(() => {
    const joinTable = async () => {
      try {
        const response = await fetch(`/api/tables/${tableGuid}/sitdown`, {
          method: 'POST',
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to join table');
        }
        
        // Redirect to the player page
        router.push(data.redirect);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    };
    
    joinTable();
  }, [tableGuid, router]);
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Joining Table</h1>
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          {error}
        </div>
        <button 
          onClick={() => router.push(`/table/${tableGuid}`)}
          className="btn"
        >
          Return to Table
        </button>
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
