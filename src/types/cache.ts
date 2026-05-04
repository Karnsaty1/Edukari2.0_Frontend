/**
 * @typedef {Object} CacheOptions
 * @property {string=} key cache key override
 * @property {number=} ttlMs time-to-live in ms
 */

/**
 * @template T
 * @typedef {Object} CacheEntry
 * @property {T} value
 * @property {number} expiresAt epoch ms
 */
