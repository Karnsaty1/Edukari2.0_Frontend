export const createCacheStore = ({ maxEntries = 250 } = {}) => {
  const map = new Map();

  const prune = () => {
    const now = Date.now();
    for (const [key, entry] of map.entries()) {
      if (entry.expiresAt <= now) map.delete(key);
    }
    while (map.size > maxEntries) {
      const firstKey = map.keys().next().value;
      map.delete(firstKey);
    }
  };

  return {
    get: (key) => {
      prune();
      const entry = map.get(key);
      if (!entry) return undefined;
      if (entry.expiresAt <= Date.now()) {
        map.delete(key);
        return undefined;
      }
      return entry.value;
    },
    set: (key, value, { ttlMs = 30_000 } = {}) => {
      prune();
      map.set(key, { value, expiresAt: Date.now() + Math.max(0, ttlMs) });
      prune();
    },
    delete: (key) => map.delete(key),
    clear: () => map.clear(),
    keys: () => Array.from(map.keys()),
  };
};
