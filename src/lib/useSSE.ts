import { useState, useEffect, useRef } from 'react';

interface SSEOptions {
  onMessage?: (data: any) => void;
  onError?: (error: any) => void;
  onOpen?: () => void;
  onClose?: () => void;
  retryInterval?: number;
  maxRetryInterval?: number;
}

export function useSSE(url: string, options: SSEOptions = {}) {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<any>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  
  // Use refs for values that we don't want to trigger effect dependencies
  const eventSourceRef = useRef<EventSource | null>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCountRef = useRef<number>(0);
  const lastSuccessfulConnectionRef = useRef<number>(0);
  
  useEffect(() => {
    // Clear any existing connection and timeouts before setting up new ones
    const cleanup = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
    
    const connectSSE = () => {
      // Clean up any existing connections
      cleanup();
      
      try {
        // Check if we've had a successful connection in the last few seconds
        // This helps prevent rapid reconnect loops
        const now = Date.now();
        const timeSinceLastSuccess = now - lastSuccessfulConnectionRef.current;
        const minRetryInterval = 1000; // 1 second minimum
        
        if (lastSuccessfulConnectionRef.current > 0 && timeSinceLastSuccess < minRetryInterval) {
          // We're reconnecting too quickly, which could indicate a problem
          // Increase the retry count and wait exponentially longer
          retryCountRef.current++;
          
          // Calculate exponential backoff time, capped at maxRetryInterval
          const backoffTime = Math.min(
            Math.pow(2, retryCountRef.current) * 1000,
            options.maxRetryInterval || 30000 // Default max 30 seconds
          );
          
          retryTimeoutRef.current = setTimeout(() => {
            connectSSE();
          }, backoffTime);
          
          return;
        }
        
        // Create a new EventSource connection
        eventSourceRef.current = new EventSource(url);
        
        eventSourceRef.current.onopen = () => {
          setIsConnected(true);
          setError(null);
          retryCountRef.current = 0; // Reset retry count on successful connection
          lastSuccessfulConnectionRef.current = Date.now();
          options.onOpen?.();
        };
        
        eventSourceRef.current.onmessage = (event) => {
          try {
            const parsedData = JSON.parse(event.data);
            setData(parsedData);
            options.onMessage?.(parsedData);
          } catch (err) {
            console.error('Error parsing SSE data:', err);
          }
        };
        
        eventSourceRef.current.onerror = (err) => {
          console.warn('SSE connection error:', err);
          setIsConnected(false);
          setError(err);
          options.onError?.(err);
          
          // Close current connection
          if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
          }
          
          // Attempt to reconnect after delay with exponential backoff
          if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
          }
          
          retryCountRef.current++;
          const retryTime = Math.min(
            Math.pow(2, retryCountRef.current) * 1000,
            options.maxRetryInterval || 30000
          );
          
          retryTimeoutRef.current = setTimeout(() => {
            connectSSE();
          }, retryTime);
        };
      } catch (err) {
        console.error('Error creating SSE connection:', err);
        setIsConnected(false);
        setError(err);
        options.onError?.(err);
        
        // Attempt to reconnect after delay
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
        }
        
        retryTimeoutRef.current = setTimeout(() => {
          connectSSE();
        }, options.retryInterval || 3000);
      }
    };
    
    // Initial connection
    connectSSE();
    
    // Cleanup on unmount
    return cleanup;
  }, [url, options.onMessage, options.onError, options.onOpen, options.onClose, options.retryInterval, options.maxRetryInterval]);
  
  return { data, error, isConnected };
}