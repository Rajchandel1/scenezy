type CacheEntry<T> = { data: T; updatedAt: number };

const entries = new Map<string, CacheEntry<unknown>>();
const requests = new Map<string, Promise<unknown>>();

export function readClientCache<T>(key: string, retainForMs = Number.POSITIVE_INFINITY) {
  if (typeof window === 'undefined') return null;
  const entry = entries.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() - entry.updatedAt > retainForMs) {
    entries.delete(key);
    return null;
  }
  return entry;
}

export async function fetchClientCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: { freshForMs: number; force?: boolean }
) {
  const cached = readClientCache<T>(key);
  if (!options.force && cached && Date.now() - cached.updatedAt <= options.freshForMs) {
    return cached.data;
  }

  const pending = requests.get(key) as Promise<T> | undefined;
  if (pending) return pending;

  const request = fetcher()
    .then(data => {
      entries.set(key, { data, updatedAt: Date.now() });
      return data;
    })
    .finally(() => requests.delete(key));

  requests.set(key, request);
  return request;
}

export function invalidateClientCache(keyOrPrefix: string) {
  for (const key of entries.keys()) {
    if (key === keyOrPrefix || key.startsWith(keyOrPrefix)) entries.delete(key);
  }
}

export function clearClientCache() {
  entries.clear();
  requests.clear();
}
