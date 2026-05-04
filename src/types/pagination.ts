/**
 * @typedef {Object} PaginationParams
 * @property {number} page 1-based page index
 * @property {number} pageSize items per page
 */

/**
 * @typedef {Object} PaginationMeta
 * @property {number} page
 * @property {number} pageSize
 * @property {number} total
 * @property {number} totalPages
 * @property {boolean} hasNext
 * @property {boolean} hasPrev
 */

/**
 * @template T
 * @typedef {Object} PaginatedResponse
 * @property {T[]} items
 * @property {PaginationMeta} meta
 */
