import { useState, useEffect, useCallback } from 'react';
import { Route, ComparisonResult } from  '../../../core/domain/types';
import { routeService } from '../infrastructure/apiClient';

export function useRoutes(filters: { vesselType?: string; fuelType?: string; year?: number } = {}) {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRoutes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await routeService.getRoutes(filters);
      setRoutes(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to fetch routes');
    } finally {
      setLoading(false);
    }
  }, [filters.vesselType, filters.fuelType, filters.year]); // eslint-disable-line

  useEffect(() => { fetchRoutes(); }, [fetchRoutes]);

  const setBaseline = async (routeId: string) => {
    setLoading(true);
    setError(null);
    try {
      await routeService.setBaseline(routeId);
      await fetchRoutes();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to set baseline');
    } finally {
      setLoading(false);
    }
  };

  return { routes, loading, error, refetch: fetchRoutes, setBaseline };
}

export function useComparison() {
  const [comparisons, setComparisons] = useState<ComparisonResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComparison = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await routeService.getComparison();
      setComparisons(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to fetch comparison');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchComparison(); }, [fetchComparison]);

  return { comparisons, loading, error, refetch: fetchComparison };
}
