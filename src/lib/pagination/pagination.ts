export const clampInt = (value, { min, max, fallback }) => {
  const n = Number.parseInt(String(value), 10);
  if (Number.isNaN(n)) return fallback;
  if (typeof min === 'number' && n < min) return min;
  if (typeof max === 'number' && n > max) return max;
  return n;
};

export const normalizePaginationParams = (params) => {
  const page = clampInt(params?.page, { min: 1, max: 1_000_000, fallback: 1 });
  const pageSize = clampInt(params?.pageSize, { min: 1, max: 200, fallback: 20 });
  return { page, pageSize };
};

export const buildPaginationParams = (params) => {
  return normalizePaginationParams(params);
};

export const normalizePaginated = (data, { itemsKey = 'items', metaKey = 'meta' } = {}) => {
  const items = Array.isArray(data?.[itemsKey]) ? data[itemsKey] : Array.isArray(data?.items) ? data.items : [];
  const meta = data?.[metaKey] || data?.meta || null;
  return { items, meta };
};
