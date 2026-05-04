const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/+$/, '');

const postJson = async (path, body) => {
  if (!API_BASE) {
    const err = new Error('Missing VITE_API_BASE_URL');
    err.code = 'MISSING_API_BASE_URL';
    throw err;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {}),
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const err = new Error('Request failed');
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
};

// Expected backend shape (recommended):
// { accessToken, refreshToken, accessTokenExpiresInSec, refreshTokenExpiresInSec }
export const normalizeTokenResponse = (data) => {
  const now = Date.now();

  const accessToken = data?.accessToken || data?.access_token || '';
  const refreshToken = data?.refreshToken || data?.refresh_token || '';

  const accessExpSec = Number(data?.accessTokenExpiresInSec ?? data?.expiresInSec ?? data?.expires_in ?? 0);
  const refreshExpSec = Number(data?.refreshTokenExpiresInSec ?? data?.refresh_expires_in ?? 0);

  const accessTokenExpiresAt = accessExpSec ? now + accessExpSec * 1000 : now + 60 * 60 * 1000;
  const refreshTokenExpiresAt = refreshExpSec ? now + refreshExpSec * 1000 : now + 2 * 24 * 60 * 60 * 1000;

  return {
    accessToken,
    refreshToken,
    accessTokenExpiresAt,
    refreshTokenExpiresAt,
  };
};

export const loginWithPassword = async ({ email, password }) => {
  const data = await postJson('/auth/login', { email, password });
  return normalizeTokenResponse(data);
};

export const registerWithPassword = async ({ firstname, lastname, email, password }) => {
  const name = [firstname, lastname].filter(Boolean).join(' ').trim();
  const data = await postJson('/auth/register', {
    name,
    firstname,
    lastname,
    email,
    password,
  });
  return normalizeTokenResponse(data);
};

export const loginWithGoogleCredential = async ({ credential }) => {
  const data = await postJson('/auth/google', { credential });
  return normalizeTokenResponse(data);
};

export const refreshSession = async ({ refreshToken }) => {
  const data = await postJson('/auth/refresh', { refreshToken });
  return normalizeTokenResponse(data);
};

export const getMe = async ({ accessToken }) => {
  if (!API_BASE) {
    const err = new Error('Missing VITE_API_BASE_URL');
    err.code = 'MISSING_API_BASE_URL';
    throw err;
  }

  const res = await fetch(`${API_BASE}/auth/me`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const err = new Error('Request failed');
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
};
