/**
 * @typedef {Object} BookDto
 * @property {string | null} id
 * @property {string} title
 * @property {string} slug
 * @property {string} author
 * @property {string} description
 * @property {string} officialSite
 * @property {string} category
 * @property {string} level
 * @property {string | Date | null} createdAt
 * @property {string | Date | null} updatedAt
 */

/**
 * @typedef {Object} PaginatedBooksDto
 * @property {BookDto[]} items
 * @property {{ page: number, pageSize: number, total: number, totalPages: number, hasNext: boolean, hasPrev: boolean }} meta
 */

export {};
