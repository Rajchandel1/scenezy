import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearClientCache, fetchClientCache, invalidateClientCache, readClientCache } from './client-data-cache';

describe('client data cache', () => {
  beforeEach(() => {
    vi.stubGlobal('window', {});
    clearClientCache();
  });

  afterEach(() => vi.unstubAllGlobals());

  it('reuses fresh data without calling the fetcher again', async () => {
    const fetcher = vi.fn().mockResolvedValue({ value: 1 });
    await fetchClientCache('content', fetcher, { freshForMs: 60_000 });
    const second = await fetchClientCache('content', fetcher, { freshForMs: 60_000 });
    expect(second).toEqual({ value: 1 });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('deduplicates simultaneous requests', async () => {
    const fetcher = vi.fn().mockResolvedValue(['pass']);
    const [first, second] = await Promise.all([
      fetchClientCache('passes:user-1', fetcher, { freshForMs: 10_000 }),
      fetchClientCache('passes:user-1', fetcher, { freshForMs: 10_000 }),
    ]);
    expect(first).toEqual(second);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('invalidates matching private cache keys', async () => {
    await fetchClientCache('passes:user-1', async () => ['pass'], { freshForMs: 10_000 });
    invalidateClientCache('passes:');
    expect(readClientCache('passes:user-1')).toBeNull();
  });
});
