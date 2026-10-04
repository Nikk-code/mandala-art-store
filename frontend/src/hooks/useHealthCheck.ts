import { useState, useEffect } from 'react';
import { fetchHealth } from '@/services/api-client';
import type { ApiHealthResponse } from '@/types';

export interface UseHealthCheckState {
  data: ApiHealthResponse | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useHealthCheck(): UseHealthCheckState {
  const [data, setData] = useState<ApiHealthResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [reloadTrigger, setReloadTrigger] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    fetchHealth()
      .then(res => {
        if (isMounted) {
          setData(res);
          setIsLoading(false);
        }
      })
      .catch(err => {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Unknown error during health check'));
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [reloadTrigger]);

  const refetch = (): void => {
    setReloadTrigger(prev => prev + 1);
  };

  return { data, isLoading, error, refetch };
}
