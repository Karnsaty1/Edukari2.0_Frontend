import { axiosClient } from './http';
import { getOrSet, invalidate as invalidateKey, clear as clearAll } from '../../lib/cache';

const stableStringify = (value) => {
  if (!value || typeof value !== 'object') return String(value);
  const keys = Object.keys(value).sort();
  const out = {};
  for (const k of keys) out[k] = value[k];
  return JSON.stringify(out);
};

const makeKey = (url, config) => {
  const params = config?.params ? stableStringify(config.params) : '';
  return `GET:${url}?${params}`;
};

export const getCached = async (url, config, { ttlMs = 30_000, key } = {}) => {
  const cacheKey = key || makeKey(url, config);
  return getOrSet(
    cacheKey,
    async () => {
      const res = await axiosClient.get(url, config);
      return res.data;
    },
    { ttlMs }
  );
};

export const invalidateCacheKey = (key) => invalidateKey(key);
export const clearCache = () => clearAll();
