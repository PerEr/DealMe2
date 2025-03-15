import { useState, useEffect, useRef, useCallback } from 'react';

interface PollingOptions {
  interval?: number;
  onData?: (data: any) => void;
  onError?: (error: any) => void;
  enabled?: boolean;
}

export function usePolling(url: string, options: PollingOptions = {}) {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Use refs to store the current values of options
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fetchInProgressRef = useRef<boolean>(false);
  const optionsRef = useRef(options);
  
  // Update refs when options change
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);
  
  // Default polling interval is 3 seconds if not specified
  const pollingInterval = options.interval || 3000;
  
  // Callback for fetching data that doesn't change between renders
  const fetchData = useCallback(async () => {
    console.log(`[Polling] Fetching data from ${url}, interval: ${pollingInterval}ms`);
    // If a fetch is already in progress, don't start another one
    if (fetchInProgressRef.current) {
      console.log(`[Polling] Fetch already in progress, skipping`);
      return;
    }
    
    fetchInProgressRef.current = true;
    setIsLoading(true);
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `Error ${response.status}: ${response.statusText}`);
      }
      
      const responseData = await response.json();
      setData(responseData);
      setLastUpdated(new Date());
      setError(null);
      
      // Use the current options from ref
      if (optionsRef.current.onData) {
        optionsRef.current.onData(responseData);
      }
    } catch (err: any) {
      console.error(`[Polling] Error fetching data from ${url}:`, err);
      setError(err);
      
      // Use the current options from ref
      if (optionsRef.current.onError) {
        optionsRef.current.onError(err);
      }
    } finally {
      setIsLoading(false);
      fetchInProgressRef.current = false;
    }
  }, [url]); // Only depend on the URL
  
  // Setup and teardown polling
  useEffect(() => {
    // Get current enabled state
    const pollingEnabled = options.enabled !== undefined ? options.enabled : true;
    
    // Immediately fetch data when the component mounts or URL changes
    if (pollingEnabled) {
      fetchData();
    }
    
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Set up new polling interval if enabled
    if (pollingEnabled) {
      console.log(`[Polling] Setting up interval: ${pollingInterval}ms for ${url}`);
      intervalRef.current = setInterval(fetchData, pollingInterval);
    }
    
    // Cleanup function
    return () => {
      console.log(`[Polling] Cleaning up interval for ${url}`);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [url, pollingInterval, options.enabled, fetchData]); // Only re-run if these change
  
  // Function to manually trigger a fetch
  const refetch = useCallback(async () => {
    if (fetchInProgressRef.current) {
      return;
    }
    
    return fetchData();
  }, [fetchData]);
  
  return { data, error, isLoading, lastUpdated, refetch };
}