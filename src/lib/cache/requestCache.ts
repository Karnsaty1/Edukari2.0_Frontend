import { createCacheStore } from './cacheStore';

const defaultStore = createCacheStore();
const inFlight = new Map();

export const getOrSet = async (key, fetcher, { ttlMs = 30_000, store = defaultStore } = {}) => {
  const cached = store.get(key);
  if (cached !== undefined) return cached;

  if (inFlight.has(key)) return inFlight.get(key);

  const p = (async () => {
    try {
      const value = await fetcher();
      store.set(key, value, { ttlMs });
      return value;
    } finally {
      inFlight.delete(key);
    }
  })();

  inFlight.set(key, p);
  return p;
};

export const invalidate = (key, { store = defaultStore } = {}) => {
  store.delete(key);
};

export const clear = ({ store = defaultStore } = {}) => {
  store.clear();
};

export const getDefaultCacheStore = () => defaultStore;
