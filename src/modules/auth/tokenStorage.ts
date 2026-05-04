const STORAGE_KEY = 'edukari_tokens_v1';
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

const readRaw = (storage) => {
  try {
    return storage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

const writeRaw = (storage, value) => {
  try {
    storage.setItem(STORAGE_KEY, value);
  } catch {
    // ignore
  }
};

const removeRaw = (storage) => {
  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
};

const toIstIsoString = (dateInput) => {
  const date = new Date(Number(dateInput));
  if (Number.isNaN(date.getTime())) return dateInput;
  return new Date(date.getTime() + IST_OFFSET_MS).toISOString().replace('Z', '+05:30');
};

export const resolveExpiryMs = (value) => {
  if (!value) return null;
  if (typeof value === 'number') return value;

  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const normalizeTokensForRuntime = (tokens) => {
  if (!tokens || typeof tokens !== 'object') return null;

  return {
    ...tokens,
    accessTokenExpiresAt: resolveExpiryMs(tokens.accessTokenExpiresAt),
    refreshTokenExpiresAt: resolveExpiryMs(tokens.refreshTokenExpiresAt),
  };
};

const normalizeTokensForStorage = (tokens) => {
  if (!tokens || typeof tokens !== 'object') return null;

  const { savedAt: _savedAt, ...rest } = tokens;

  return {
    ...rest,
    accessTokenExpiresAt: toIstIsoString(rest.accessTokenExpiresAt),
    refreshTokenExpiresAt: toIstIsoString(rest.refreshTokenExpiresAt),
  };
};

export const readTokens = () => {
  try {
    // Primary storage: sessionStorage (clears on tab close).
    const sessionRaw = readRaw(sessionStorage);
    if (sessionRaw) {
      const parsed = JSON.parse(sessionRaw);
      const normalized = normalizeTokensForRuntime(parsed);
      const storageShape = normalizeTokensForStorage(normalized);
      if (storageShape) {
        writeRaw(sessionStorage, JSON.stringify(storageShape));
      }
      return normalized;
    }

    return null;

  } catch {
    return null;
  }
};

export const writeTokens = (tokens) => {
  const payload = normalizeTokensForStorage(tokens);
  writeRaw(sessionStorage, JSON.stringify(payload));
};

export const clearTokens = () => {
  removeRaw(sessionStorage);
};
