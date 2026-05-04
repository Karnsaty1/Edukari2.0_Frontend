import axios from 'axios';
import { readTokens, writeTokens, clearTokens, resolveExpiryMs } from '../auth/tokenStorage';
import { refreshSession } from '../auth/authApi';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/+$/, '');

const isExpired = (expiresAtMs) => {
  const expiryMs = resolveExpiryMs(expiresAtMs);
  if (!expiryMs) return true;
  return Date.now() >= Number(expiryMs);
};

let refreshInFlight = null;
let onAuthFailure = null;

export const setOnAuthFailure = (handler) => {
  onAuthFailure = typeof handler === 'function' ? handler : null;
};

const client = axios.create({
  baseURL: API_BASE || undefined,
  headers: {
    'Content-Type': 'application/json',
  },
});

client.interceptors.request.use(
  (config) => {
    const tokens = readTokens();
    if (tokens?.accessToken && !isExpired(tokens.accessTokenExpiresAt)) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${tokens.accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const refreshTokensIfPossible = async () => {
  const tokens = readTokens();
  if (!tokens?.refreshToken) return null;
  if (isExpired(tokens.refreshTokenExpiresAt)) return null;

  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      const next = await refreshSession({ refreshToken: tokens.refreshToken });
      writeTokens(next);
      return next;
    } catch {
      clearTokens();
      if (onAuthFailure) onAuthFailure();
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
};

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error?.config;
    const status = error?.response?.status;

    if (!original || !status) return Promise.reject(error);
    if (original.__isRetryRequest) return Promise.reject(error);
    if (status !== 401) return Promise.reject(error);

    const next = await refreshTokensIfPossible();
    if (!next?.accessToken) return Promise.reject(error);

    original.__isRetryRequest = true;
    original.headers = original.headers || {};
    original.headers.Authorization = `Bearer ${next.accessToken}`;
    return client(original);
  }
);

export const get = async (url, config) => {
  const res = await client.get(url, config);
  return res.data;
};

export const post = async (url, body, config) => {
  const res = await client.post(url, body, config);
  return res.data;
};

export const put = async (url, body, config) => {
  const res = await client.put(url, body, config);
  return res.data;
};

export const del = async (url, config) => {
  const res = await client.delete(url, config);
  return res.data;
};

export { client as axiosClient };
