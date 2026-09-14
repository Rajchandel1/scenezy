'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchClientCache, readClientCache } from '@/shared/lib/client-data-cache';

interface ClientQueryOptions<T> {
  key: string;
  fetcher: () => Promise<T>;
  freshForMs?: number;
  retainForMs?: number;
}

export function useClientQuery<T>({
  key,
  fetcher,
  freshForMs = 30_000,
  retainForMs = 5 * 60_000,
}: ClientQueryOptions<T>) {
  const initial = readClientCache<T>(key, retainForMs);
  const [data, setData] = useState<T | null>(() => initial?.data ?? null);
  const [loading, setLoading] = useState(() => !initial);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const mounted = useRef(false);

  const load = useCallback(async (force = false) => {
    const cached = readClientCache<T>(key, retainForMs);
    if (cached && !force) {
      setData(cached.data);
      setLoading(false);
    } else if (!cached) {
      setLoading(true);
    }
    setRefreshing(Boolean(cached));

    try {
      const result = await fetchClientCache(key, fetcher, { freshForMs, force });
      if (!mounted.current) return;
      setData(result);
      setError('');
    } catch (caught) {
      if (!mounted.current) return;
      if (!cached) setError(caught instanceof Error ? caught.message : 'Data could not be loaded.');
    } finally {
      if (mounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [fetcher, freshForMs, key, retainForMs]);

  useEffect(() => {
    mounted.current = true;
    const cached = readClientCache<T>(key, retainForMs);
    setData(cached?.data ?? null);
    setLoading(!cached);
    setError('');
    void load();
    const revalidate = () => {
      if (document.visibilityState === 'visible') void load();
    };
    document.addEventListener('visibilitychange', revalidate);
    return () => {
      mounted.current = false;
      document.removeEventListener('visibilitychange', revalidate);
    };
  }, [key, load, retainForMs]);

  return {
    data,
    loading,
    refreshing,
    error,
    refresh: useCallback(() => load(true), [load]),
  };
}
